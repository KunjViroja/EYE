"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Role, ProductCategory, ProductBadge, MemberTier } from "@prisma/client";

export async function seedSampleData() {
  try {
    // 1. Create Products
    const productsData = [
      {
        brand: "OLIVER PEOPLES",
        name: "Gregory Peck Bespoke Edition",
        sku: `OP-${Math.floor(1000 + Math.random() * 9000)}`,
        price: 540.0,
        category: ProductCategory.FRAMES,
        badge: ProductBadge.NEW_SEASON,
        stock: 15,
      },
      {
        brand: "CARTIER",
        name: "Panthère de Cartier Gold",
        sku: `CR-${Math.floor(1000 + Math.random() * 9000)}`,
        price: 980.0,
        category: ProductCategory.FRAMES,
        badge: ProductBadge.ONLY_2_LEFT,
        stock: 2,
      },
      {
        brand: "TOM FORD",
        name: "Signature Rose Gold Aviator",
        sku: `TF-${Math.floor(1000 + Math.random() * 9000)}`,
        price: 720.0,
        category: ProductCategory.FRAMES,
        stock: 8,
      },
      {
        brand: "PRADA",
        name: "Cinema Crystal Acetate",
        sku: `PR-${Math.floor(1000 + Math.random() * 9000)}`,
        price: 680.0,
        category: ProductCategory.FRAMES,
        stock: 12,
      },
    ];

    for (const prod of productsData) {
      await prisma.product.create({ data: prod });
    }

    // 2. Create Client
    await prisma.client.create({
      data: {
        name: "Sofia Jensen",
        email: `sofia.${Date.now()}@luxury.com`,
        phone: "+1 (555) 012-3456",
        location: "Bel Air Estates, Los Angeles",
        tier: MemberTier.ELITE_EYE_MEMBER,
        stylePreference: '"Prefers oversized acetate frames in tortoiseshell."',
        prescriptionMilestone: "Stable for 2 years. Upgraded to Zeiss Elite Progressive Lenses.",
        totalSpent: 4842.0,
        prescriptions: {
          create: {
            lastVerified: new Date(),
            rightSph: -2.75,
            rightCyl: -0.5,
            rightAxis: 180,
            rightAdd: 1.5,
            leftSph: -3.0,
            leftCyl: -0.75,
            leftAxis: 175,
            leftAdd: 1.5,
          },
        },
      },
    });

    revalidatePath("/collections");
    revalidatePath("/pos");
    revalidatePath("/clientele");
    revalidatePath("/insights");

    return { success: true, message: "Sample boutique data populated successfully!" };
  } catch (error: any) {
    console.error("Error seeding sample data:", error);
    return { success: false, error: error.message || "Failed to seed sample data" };
  }
}
