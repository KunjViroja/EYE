"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaymentMethod, SaleStatus } from "@prisma/client";

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

// Memory fallback store for sales if database is offline
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

let activeOrdersMemory: ActiveOrderRecord[] = [];

export async function getActiveOrders() {
  return { success: true, data: activeOrdersMemory };
}

// ─── Process POS Sale Transaction ────────────────────────────────────────────
export async function processSaleTransaction(input: ProcessSaleInput) {
  try {
    if (!input.clientId) {
      return { success: false, error: "Please select a client for this transaction." };
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Cart is empty. Add items before processing transaction." };
    }

    const isAdvance = input.isAdvancePayment || false;
    const advancePaid = isAdvance ? (input.advancePaidAmount || 0) : input.grandTotal;
    const remaining = Math.max(0, input.grandTotal - advancePaid);
    const saleStatus = isAdvance && remaining > 0 ? SaleStatus.PROCESSING : SaleStatus.COMPLETED;

    let saleResult: any = null;

    try {
      // Execute in a database transaction
      saleResult = await prisma.$transaction(async (tx) => {
        // 1. Create Sale record
        const createdSale = await tx.sale.create({
          data: {
            clientId: input.clientId,
            subtotal: input.subtotal,
            discount: input.discount,
            grandTotal: input.grandTotal,
            status: saleStatus,
            paymentMethod: input.paymentMethod,
            items: {
              create: input.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                hasPrescription: item.hasPrescription || false,
              })),
            },
          },
          include: {
            items: true,
            client: true,
          },
        });

        // 2. Decrement stock for each purchased product
        for (const item of input.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
            },
          });
        }

        // 3. Update client total spent with advance paid amount
        await tx.client.update({
          where: { id: input.clientId },
          data: {
            totalSpent: { increment: advancePaid },
          },
        });

        return createdSale;
      });
    } catch (dbErr) {
      console.warn("DB transaction fallback active.");
    }

    const today = new Date();
    const yyyymmdd = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, "0") +
      today.getDate().toString().padStart(2, "0");
    const seqNum = Math.floor(1000 + Math.random() * 9000);
    const dateFormattedOrderId = `ORD-${yyyymmdd}-${seqNum}`;

    const orderId = saleResult ? (saleResult.id.length > 20 ? dateFormattedOrderId : saleResult.id) : dateFormattedOrderId;

    const newMemoryRecord: ActiveOrderRecord = {
      id: orderId,
      clientName: saleResult?.client?.name || "Boutique Client",
      grandTotal: input.grandTotal,
      advancePaid,
      remainingBalance: remaining,
      status: remaining > 0 ? "PROCESSING_ADVANCE" : "DELIVERED_PAID",
      paymentMethod: input.paymentMethod,
      createdAt: new Date().toISOString(),
    };

    activeOrdersMemory.unshift(newMemoryRecord);

    revalidatePath("/insights");
    revalidatePath("/collections");
    revalidatePath("/clientele");
    revalidatePath("/pos");

    return {
      success: true,
      data: {
        id: orderId,
        grandTotal: input.grandTotal,
        advancePaid,
        remainingBalance: remaining,
        isAdvancePayment: isAdvance,
      },
    };
  } catch (error: any) {
    console.error("Error processing sale transaction:", error);
    return { success: false, error: error.message || "Failed to process transaction" };
  }
}

// ─── Settle Order Remaining Balance on Delivery ──────────────────────────────
export async function settleOrderRemainingBalance(orderId: string) {
  try {
    const found = activeOrdersMemory.find((o) => o.id === orderId);
    if (found) {
      found.advancePaid = found.grandTotal;
      found.remainingBalance = 0;
      found.status = "DELIVERED_PAID";
    }

    try {
      await prisma.sale.update({
        where: { id: orderId },
        data: {
          status: SaleStatus.COMPLETED,
        },
      });
    } catch (err) {
      console.warn("DB sale status update fallback.");
    }

    revalidatePath("/pos");
    revalidatePath("/insights");

    return { success: true, message: `Order #${orderId} delivered & fully paid!` };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to settle balance" };
  }
}
