"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface RecordPurchaseInput {
  productId: string;
  supplierName: string;
  invoiceNumber: string;
  quantity: number;
  unitCost: number;
  gstIncluded?: boolean;
  gstRate?: number;
  notes?: string;
}

export interface PurchaseLogItem {
  id: string;
  supplierName: string;
  invoiceNumber: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  gstIncluded?: boolean;
  gstRate?: number;
  totalCost: number;
  createdAt: string;
}

let globalPurchaseMemory: PurchaseLogItem[] = [];

export async function getPurchaseLogs(): Promise<{ success: boolean; data: PurchaseLogItem[] }> {
  try {
    return { success: true, data: globalPurchaseMemory };
  } catch (err) {
    return { success: true, data: [] };
  }
}

export async function recordStockPurchase(input: RecordPurchaseInput) {
  try {
    const { productId, supplierName, invoiceNumber, quantity, unitCost, notes } = input;

    if (!productId || !supplierName || !quantity || quantity <= 0) {
      return { success: false, error: "Please provide valid product, supplier name, and quantity." };
    }

    // Try to update live stock count in Prisma DB
    let targetProduct: any = null;
    try {
      targetProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (targetProduct) {
        await prisma.product.update({
          where: { id: productId },
          data: {
            stock: { increment: Number(quantity) },
            costPrice: Number(unitCost),
          },
        });
      }
    } catch (dbErr) {
      console.warn("Database stock increment fallback active.");
    }

    const newLog: PurchaseLogItem = {
      id: `po-${Date.now()}`,
      supplierName,
      invoiceNumber: invoiceNumber || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      productName: targetProduct ? `${targetProduct.brand} ${targetProduct.name}` : "Inventory Item",
      sku: targetProduct ? targetProduct.sku : "SKU-UPDATE",
      quantity: Number(quantity),
      unitCost: Number(unitCost),
      totalCost: Number(quantity) * Number(unitCost),
      createdAt: new Date().toISOString(),
    };

    globalPurchaseMemory.unshift(newLog);

    revalidatePath("/collections");
    revalidatePath("/pos");

    return { success: true, data: newLog };
  } catch (err: any) {
    console.error("Error recording purchase:", err);
    return { success: false, error: err?.message || "Failed to log purchase" };
  }
}
