"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { PaymentMethod, SaleStatus, Prisma } from "@prisma/client";
import { getShopId } from "@/lib/shopAuth";

export interface POSCartItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  hasPrescription?: boolean;
}

export interface ProcessSaleInput {
  clientId: string;
  items: POSCartItemInput[];
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  grandTotal: number;
  isAdvancePayment?: boolean;
  advancePaidAmount?: number;
  remainingBalance?: number;
}

export interface ActiveOrderRecord {
  id: string;
  clientName: string;
  grandTotal: number;
  advancePaid: number;
  remainingBalance: number;
  status: "PROCESSING_ADVANCE" | "DELIVERED_PAID";
  paymentMethod: string;
  createdAt: string;
}

// ─── Fetch Active / Pending Advance Orders From Database ─────────────────────
export async function getActiveOrders(): Promise<{ success: boolean; data: ActiveOrderRecord[]; error?: string }> {
  try {
    const shopId = await getShopId();

    if (!shopId) {
      return { success: true, data: [] };
    }

    const salesFromDb = await prisma.sale.findMany({
      where: {
        shopId,
        OR: [
          { remainingBalance: { gt: 0 } },
          { status: SaleStatus.PROCESSING },
        ],
      },
      include: {
        client: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const data: ActiveOrderRecord[] = salesFromDb.map((s) => ({
      id: s.id,
      clientName: s.client?.name || "Client",
      grandTotal: s.grandTotal,
      advancePaid: s.advancePaid,
      remainingBalance: s.remainingBalance,
      status: s.remainingBalance > 0 ? "PROCESSING_ADVANCE" : "DELIVERED_PAID",
      paymentMethod: s.paymentMethod,
      createdAt: s.createdAt.toISOString(),
    }));

    return { success: true, data };
  } catch (err: any) {
    console.error("Error fetching active orders:", err);
    return { success: false, data: [], error: err?.message || "Failed to load active orders" };
  }
}

// ─── Process POS Sale Transaction ────────────────────────────────────────────
export async function processSaleTransaction(input: ProcessSaleInput) {
  try {
    if (!input.clientId?.trim()) {
      return { success: false, error: "Client ID is required." };
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Cart cannot be empty." };
    }

    for (const item of input.items) {
      if (!item.productId) {
        return { success: false, error: "Invalid product in cart." };
      }
      if (item.quantity <= 0) {
        return { success: false, error: "Product quantity must be at least 1." };
      }
      if (item.unitPrice < 0) {
        return { success: false, error: "Product price cannot be negative." };
      }
    }

    if (input.grandTotal < 0) {
      return { success: false, error: "Grand total cannot be negative." };
    }

    const isAdvance = input.isAdvancePayment ?? false;
    const advancePaid = isAdvance ? Number(input.advancePaidAmount || 0) : input.grandTotal;
    const remaining = isAdvance ? Math.max(0, input.grandTotal - advancePaid) : 0;

    if (isAdvance && advancePaid < 0) {
      return { success: false, error: "Advance paid amount cannot be negative." };
    }

    const shopId = await getShopId();

    if (!shopId) {
      return { success: false, error: "Shop authorization failed." };
    }

    // Verify client belongs to this shop
    const client = await prisma.client.findUnique({
      where: { id: input.clientId },
      select: { id: true, shopId: true, name: true },
    });

    if (!client || client.shopId !== shopId) {
      return { success: false, error: "Client not found or belongs to another store." };
    }

    // Verify all products belong to this shop & check stock
    const productIds = input.items.map((item) => item.productId);
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        shopId,
      },
      select: { id: true, stock: true, name: true, brand: true },
    });

    if (dbProducts.length !== productIds.length) {
      return { success: false, error: "One or more products were not found in your inventory." };
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    for (const item of input.items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        return { success: false, error: `Product not found.` };
      }
      if (prod.stock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${prod.brand} ${prod.name}". Available: ${prod.stock}, requested: ${item.quantity}.`,
        };
      }
    }

    // Atomic Database Transaction
    const saleResult = await prisma.$transaction(async (tx) => {
      // 1. Create Sale Record
      const sale = await tx.sale.create({
        data: {
          shopId,
          clientId: input.clientId,
          paymentMethod: input.paymentMethod || PaymentMethod.CASH,
          status: remaining > 0 ? SaleStatus.PROCESSING : SaleStatus.COMPLETED,
          subtotal: input.subtotal,
          discount: input.discount,
          grandTotal: input.grandTotal,
          isAdvancePayment: isAdvance,
          advancePaid,
          remainingBalance: remaining,
        },
      });

      // 2. Create Sale Items
      await tx.saleItem.createMany({
        data: input.items.map((item) => ({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          hasPrescription: item.hasPrescription || false,
        })),
      });

      // 3. Decrement Product Stock
      for (const item of input.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      // 4. Update Client Lifetime Total Spent
      await tx.client.update({
        where: { id: input.clientId },
        data: {
          totalSpent: { increment: input.grandTotal },
        },
      });

      return sale;
    });

    revalidateTag("insights-cache", "default");
    revalidateTag("products-cache", "default");
    revalidateTag("clients-cache", "default");
    revalidatePath("/insights");
    revalidatePath("/collections");
    revalidatePath("/clientele");
    revalidatePath("/pos");

    return {
      success: true,
      data: {
        id: saleResult.id,
        grandTotal: input.grandTotal,
        advancePaid,
        remainingBalance: remaining,
        isAdvancePayment: isAdvance,
      },
      message: `Order #${saleResult.id} created successfully.`,
    };
  } catch (error: any) {
    console.error("❌ Error processing sale transaction:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, error: "One or more items were not found. Cart may have been modified." };
    }

    return {
      success: false,
      error: error?.message || "Failed to process transaction",
    };
  }
}

// ─── Settle Order Remaining Balance on Delivery ──────────────────────────────
export async function settleOrderRemainingBalance(orderId: string) {
  try {
    if (!orderId?.trim()) {
      return { success: false, error: "Order ID is required." };
    }

    const shopId = await getShopId();

    if (!shopId) {
      return { success: false, error: "Unauthorized access." };
    }

    // Verify order exists and belongs to this shop
    const existingOrder = await prisma.sale.findUnique({
      where: { id: orderId },
      select: { id: true, shopId: true, grandTotal: true, remainingBalance: true, status: true },
    });

    if (!existingOrder || existingOrder.shopId !== shopId) {
      return { success: false, error: "Order not found or access denied." };
    }

    // Update in database atomically
    await prisma.sale.update({
      where: { id: orderId },
      data: {
        advancePaid: existingOrder.grandTotal,
        remainingBalance: 0,
        status: SaleStatus.COMPLETED,
      },
    });

    revalidateTag("insights-cache", "default");
    revalidatePath("/pos");
    revalidatePath("/insights");

    return { success: true, message: `Order #${orderId} settled and marked delivered!` };
  } catch (err: any) {
    console.error("Error settling balance:", err);
    return { success: false, error: err?.message || "Failed to settle balance" };
  }
}
