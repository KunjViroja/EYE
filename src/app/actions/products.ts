"use server";

import { prisma } from "@/lib/prisma";
import { getShopId } from "@/lib/shopAuth";
import { revalidatePath, unstable_cache, revalidateTag } from "next/cache";
import { ProductCategory, ProductBadge, Prisma } from "@prisma/client";

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

// ─── Direct High-Performance Product Query (Instant Live Sync) ─────────────────
export async function getProducts(
  category?: string,
  query?: string,
  cursor?: string,
  take: number = 20
) {
  try {
    const shopId = await getShopId();

    if (!shopId) {
      return { success: false, error: "Shop not found" };
    }

    const where: Prisma.ProductWhereInput = {
      shopId,
    };

    if (category && category !== "All") {
      const formattedCategory = category.toUpperCase();
      if (formattedCategory in ProductCategory) {
        where.category = formattedCategory as ProductCategory;
      }
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
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        brand: true,
        name: true,
        sku: true,
        price: true,
        category: true,
        badge: true,
        stock: true,
        imageUrl: true,
      },
    });

    const hasMore = products.length > take;
    const data = hasMore ? products.slice(0, take) : products;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return {
      success: true,
      data,
      nextCursor,
      hasMore,
      timestamp: Date.now(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch products";
    return { success: false, error: errorMessage };
  }
}

/**
 * ✅ Get full product details (Loaded on-demand)
 */
export async function getProductDetails(productId: string) {
  try {
    const shopId = await getShopId();

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.shopId !== shopId) {
      return {
        success: false,
        error: "Product not found or access denied",
      };
    }

    return { success: true, data: product };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch product details";
    return { success: false, error: errorMessage };
  }
}

// ─── Create Product with Instant Cache Invalidation ───────────────────────────
export async function createProduct(input: CreateProductInput) {
  try {
    if (!input.brand?.trim() || !input.name?.trim() || !input.sku?.trim() || !input.price) {
      return {
        success: false,
        error: "Brand, name, SKU, and price are required fields.",
      };
    }

    if (Number(input.price) <= 0) {
      return {
        success: false,
        error: "Price must be greater than 0.",
      };
    }

    if (input.costPrice && Number(input.costPrice) > Number(input.price)) {
      return {
        success: false,
        error: "Cost price cannot be higher than selling price.",
      };
    }

    const shopId = await getShopId();

    if (!shopId) {
      return {
        success: false,
        error: "Shop not found. Please complete registration first.",
      };
    }

    const formattedSku = input.sku.toUpperCase().trim();

    // ⚡ Execute plan validation, count, and duplicate check in parallel (1 round-trip instead of 3)
    const [shop, productCount, existing] = await Promise.all([
      prisma.shop.findUnique({
        where: { id: shopId },
        select: { plan: true, maxProducts: true },
      }),
      prisma.product.count({
        where: { shopId },
      }),
      prisma.product.findFirst({
        where: {
          shopId,
          sku: formattedSku,
        },
        select: { id: true },
      }),
    ]);

    if (!shop) {
      return { success: false, error: "Shop configuration error." };
    }

    if (productCount >= shop.maxProducts) {
      return {
        success: false,
        error: `You've reached the product limit (${shop.maxProducts}) for your ${shop.plan} plan. Upgrade to add more products.`,
      };
    }

    if (existing) {
      return {
        success: false,
        error: `Product with SKU "${formattedSku}" already exists in your inventory.`,
      };
    }

    const initialStock = input.purchaseDetails?.quantity ?? Number(input.stock || 10);

    if (initialStock < 0) {
      return {
        success: false,
        error: "Stock quantity cannot be negative.",
      };
    }

    const finalCostPrice = input.purchaseDetails?.unitCost
      ? Number(input.purchaseDetails.unitCost)
      : input.costPrice
        ? Number(input.costPrice)
        : undefined;

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          shopId,
          brand: input.brand.trim().toUpperCase(),
          name: input.name.trim(),
          sku: formattedSku,
          price: Number(input.price),
          costPrice: finalCostPrice,
          category: input.category || ProductCategory.FRAMES,
          badge: input.badge || null,
          stock: initialStock,
          frameMaterial: input.frameMaterial?.trim() || undefined,
          frameShape: input.frameShape?.trim() || undefined,
          frameType: input.frameType?.trim() || undefined,
          color: input.color?.trim() || undefined,
          lensWidth: input.lensWidth ? Number(input.lensWidth) : undefined,
          bridgeWidth: input.bridgeWidth ? Number(input.bridgeWidth) : undefined,
          templeLength: input.templeLength ? Number(input.templeLength) : undefined,
          gender: input.gender?.trim() || "Unisex",
        },
      });

      if (input.purchaseDetails?.supplierName) {
        const gstRate = input.purchaseDetails.gstRate || 18;
        const unitCost = Number(input.purchaseDetails.unitCost);
        const quantity = input.purchaseDetails.quantity;

        let totalCost = unitCost * quantity;

        if (!input.purchaseDetails.gstIncluded) {
          totalCost = totalCost * (1 + gstRate / 100);
        }

        await tx.purchaseLog.create({
          data: {
            shopId,
            productId: newProduct.id,
            quantity,
            unitCost,
            supplierName: input.purchaseDetails.supplierName.trim(),
            invoiceNumber: input.purchaseDetails.invoiceNumber?.trim() || null,
            gstIncluded: input.purchaseDetails.gstIncluded || false,
            gstRate,
            totalCost,
          },
        });
      }

      return newProduct;
    });

    // Invalidate product cache tags instantly
    revalidateTag("products-cache", "default");
    revalidateTag("insights-cache", "default");
    revalidatePath("/collections");
    revalidatePath("/pos");

    return {
      success: true,
      data: product,
      message: `Product "${product.name}" created successfully.`,
    };
  } catch (error) {
    console.error("❌ Error creating product:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          error: "A product with this SKU already exists in your shop.",
        };
      }
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to create product";
    return { success: false, error: errorMessage };
  }
}
