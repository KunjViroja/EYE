"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ProductCategory, ProductBadge } from "@prisma/client";

export interface CreateProductInput {
  brand: string;
  name: string;
  sku: string;
  price: number;
  category: ProductCategory;
  badge?: ProductBadge | null;
  stock?: number;
}

// ─── Fetch All Products from Supabase ────────────────────────────────────────
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

// ─── Create Product in Supabase ──────────────────────────────────────────────
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

    const product = await prisma.product.create({
      data: {
        brand: input.brand.toUpperCase(),
        name: input.name,
        sku: input.sku.toUpperCase(),
        price: Number(input.price),
        category: input.category || ProductCategory.FRAMES,
        badge: input.badge || null,
        stock: input.stock ? Number(input.stock) : 10,
      },
    });

    revalidatePath("/collections");
    revalidatePath("/pos");

    return { success: true, data: product };
  } catch (error: any) {
    console.error("Error creating product:", error);
    return { success: false, error: error.message || "Failed to create product" };
  }
}
