"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getShopId } from "@/lib/shopAuth";

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

// ─── Fetch Purchase Logs (From Database, Multi-Tenant Isolated) ───────────────
export async function getPurchaseLogs(): Promise<{ success: boolean; data: PurchaseLogItem[]; error?: string }> {
  try {
    const shopId = await getShopId();

    if (!shopId) {
      return { success: true, data: [] };
    }

    const logsFromDb = await prisma.purchaseLog.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        supplierName: true,
        invoiceNumber: true,
        quantity: true,
        unitCost: true,
        gstIncluded: true,
        gstRate: true,
        totalCost: true,
        createdAt: true,
        productId: true,
      },
    });

    // Fetch product details for these logs
    const productIds = Array.from(new Set(logsFromDb.map((l) => l.productId)));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, brand: true, name: true, sku: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const data: PurchaseLogItem[] = logsFromDb.map((log) => {
      const prod = productMap.get(log.productId);
      return {
        id: log.id,
        supplierName: log.supplierName,
        invoiceNumber: log.invoiceNumber || "Auto",
        productName: prod ? `${prod.brand} ${prod.name}` : "Product",
        sku: prod ? prod.sku : "SKU",
        quantity: log.quantity,
        unitCost: log.unitCost,
        gstIncluded: log.gstIncluded,
        gstRate: log.gstRate,
        totalCost: log.totalCost,
        createdAt: log.createdAt.toISOString(),
      };
    });

    return { success: true, data };
  } catch (err: any) {
    console.error("Error fetching purchase logs:", err);
    return { success: false, data: [], error: err?.message || "Failed to load purchase orders" };
  }
}

// ─── Record Stock Purchase ───────────────────────────────────────────────────
export async function recordStockPurchase(input: RecordPurchaseInput) {
  try {
    const { productId, supplierName, invoiceNumber, quantity, unitCost, gstIncluded, gstRate } = input;

    if (!productId?.trim()) {
      return { success: false, error: "Product ID is required." };
    }

    if (!supplierName?.trim()) {
      return { success: false, error: "Supplier name is required." };
    }

    const qty = Number(quantity);
    const cost = Number(unitCost);

    if (isNaN(qty) || qty <= 0) {
      return { success: false, error: "Quantity must be greater than 0." };
    }

    if (isNaN(cost) || cost < 0) {
      return { success: false, error: "Unit cost cannot be negative." };
    }

    const shopId = await getShopId();

    if (!shopId) {
      return { success: false, error: "Shop not found. Authorization failed." };
    }

    // Verify product exists and belongs to this shop
    const targetProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, shopId: true, brand: true, name: true, sku: true },
    });

    if (!targetProduct || targetProduct.shopId !== shopId) {
      return { success: false, error: "Product not found or access denied." };
    }

    const rate = gstRate || 18;
    let totalCost = cost * qty;
    if (!gstIncluded) {
      totalCost = totalCost * (1 + rate / 100);
    }

    // Execute atomic transaction: update stock & write purchase log
    const purchaseLog = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: { increment: qty },
          costPrice: cost,
        },
      });

      const logEntry = await tx.purchaseLog.create({
        data: {
          shopId,
          productId,
          quantity: qty,
          unitCost: cost,
          supplierName: supplierName.trim(),
          invoiceNumber: invoiceNumber?.trim() || null,
          gstIncluded: gstIncluded ?? true,
          gstRate: rate,
          totalCost,
        },
      });

      return logEntry;
    });

    const newLog: PurchaseLogItem = {
      id: purchaseLog.id,
      supplierName: purchaseLog.supplierName,
      invoiceNumber: purchaseLog.invoiceNumber || "Auto",
      productName: `${targetProduct.brand} ${targetProduct.name}`,
      sku: targetProduct.sku,
      quantity: qty,
      unitCost: cost,
      gstIncluded: gstIncluded ?? true,
      gstRate: rate,
      totalCost,
      createdAt: purchaseLog.createdAt.toISOString(),
    };

    revalidatePath("/collections");
    revalidatePath("/pos");
    revalidatePath("/insights");

    return {
      success: true,
      data: newLog,
      message: `Stock updated for ${targetProduct.brand} ${targetProduct.name} (+${qty} units).`,
    };
  } catch (error: any) {
    console.error("❌ Error recording purchase:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, error: "Product not found. Please verify and try again." };
    }

    return {
      success: false,
      error: error?.message || "Failed to log purchase",
    };
  }
}
