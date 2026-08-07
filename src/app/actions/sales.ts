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

    // Execute in a transaction (Atomicity)
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Create Sale record
      const createdSale = await tx.sale.create({
        data: {
          clientId: input.clientId,
          subtotal: input.subtotal,
          discount: input.discount,
          grandTotal: input.grandTotal,
          status: SaleStatus.COMPLETED,
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

      // 3. Update client total spent
      await tx.client.update({
        where: { id: input.clientId },
        data: {
          totalSpent: { increment: input.grandTotal },
        },
      });

      return createdSale;
    });

    revalidatePath("/insights");
    revalidatePath("/collections");
    revalidatePath("/clientele");
    revalidatePath("/pos");

    return { success: true, data: sale };
  } catch (error: any) {
    console.error("Error processing sale transaction:", error);
    return { success: false, error: error.message || "Failed to process transaction" };
  }
}
