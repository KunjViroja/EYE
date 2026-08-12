"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ProductCategory, ProductBadge } from "@prisma/client";

export interface CreateProductInput {
  brand: string;
  name: string;
  sku: string;
  price: number;
  costPrice?: number;
  category: ProductCategory;
  badge?: ProductBadge | null;
  stock?: number;
  frameMaterial?: string;
  frameShape?: string;
  frameType?: string;
  color?: string;
  lensWidth?: number;
  bridgeWidth?: number;
  templeLength?: number;
  gender?: string;
  // Purchase & GST fields
  purchaseDetails?: {
    supplierName: string;
    invoiceNumber?: string;
    quantity: number;
    unitCost: number;
    gstIncluded?: boolean;
    gstRate?: number;
  };
}

// ─── Fetch All Products ───────────────────────────────────────────────────────
export async function getProducts(category?: string, query?: string) {
  try {
    const where: any = {};

    if (category && category !== "All") {
      where.category = category.toUpperCase() as ProductCategory;
    }

    if (query && query.trim() !== "") {
      where.OR = [
        { brand: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { frameMaterial: { contains: query, mode: "insensitive" } },
        { frameShape: { contains: query, mode: "insensitive" } },
        { color: { contains: query, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: products };
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return { success: false, error: error.message || "Failed to fetch products" };
  }
}

// ─── Create Product ───────────────────────────────────────────────────────────
export async function createProduct(input: CreateProductInput) {
  try {
    if (!input.brand || !input.name || !input.sku || !input.price) {
      return { success: false, error: "Brand, name, SKU, and price are required." };
    }

    const existing = await prisma.product.findUnique({
      where: { sku: input.sku.toUpperCase() },
    });

    if (existing) {
      return { success: false, error: `Product with SKU "${input.sku}" already exists.` };
    }

    const initialStock = input.purchaseDetails?.quantity ?? (input.stock ? Number(input.stock) : 10);
    const finalCostPrice = input.purchaseDetails?.unitCost ?? (input.costPrice ? Number(input.costPrice) : undefined);

    const product = await prisma.product.create({
      data: {
        brand: input.brand.toUpperCase(),
        name: input.name,
        sku: input.sku.toUpperCase(),
        price: Number(input.price),
        costPrice: finalCostPrice,
        category: input.category || ProductCategory.FRAMES,
        badge: input.badge || null,
        stock: initialStock,
        frameMaterial: input.frameMaterial || undefined,
        frameShape: input.frameShape || undefined,
        frameType: input.frameType || undefined,
        color: input.color || undefined,
        lensWidth: input.lensWidth ? Number(input.lensWidth) : undefined,
        bridgeWidth: input.bridgeWidth ? Number(input.bridgeWidth) : undefined,
        templeLength: input.templeLength ? Number(input.templeLength) : undefined,
        gender: input.gender || "Unisex",
      },
    });

    // If purchase details provided, log purchase
    if (input.purchaseDetails && input.purchaseDetails.supplierName) {
      try {
        const { recordStockPurchase } = await import("@/app/actions/purchases");
        await recordStockPurchase({
          productId: product.id,
          supplierName: input.purchaseDetails.supplierName,
          invoiceNumber: input.purchaseDetails.invoiceNumber || "",
          quantity: input.purchaseDetails.quantity,
          unitCost: input.purchaseDetails.unitCost,
          gstIncluded: input.purchaseDetails.gstIncluded,
          gstRate: input.purchaseDetails.gstRate,
        });
      } catch (purchErr) {
        console.warn("Could not log opening purchase details:", purchErr);
      }
    }

    revalidatePath("/collections");
    revalidatePath("/pos");

    return { success: true, data: product };
  } catch (error: any) {
    console.error("Error creating product:", error);
    return { success: false, error: error.message || "Failed to create product" };
  }
}
