"use server";

import { prisma } from "@/lib/prisma";
import { getShopId } from "@/lib/shopAuth";
import { unstable_cache } from "next/cache";

export interface RevenueDataPoint {
  day: string;
  designerFrames: number;
  bespokeLenses: number;
}

export interface CollectionMixItem {
  name: string;
  percentage: number;
  color: string;
}

export async function getInsightsData() {
  try {
    const shopId = await getShopId();

    if (!shopId) {
      return {
        success: false,
        error: "Shop not found. Please log in.",
        data: {
          grossRevenue: 0,
          totalSalesCount: 0,
          avgBoutiqueValue: 0,
          totalClientsCount: 0,
          recentSales: [],
          revenueStream: [],
          collectionMix: [],
          alerts: [],
        },
      };
    }

    // 1. Calculate Gross Revenue (actual collected money) & Total Sales Count
    const salesAggregate = await prisma.sale.aggregate({
      where: {
        shopId,
      },
      _sum: {
        advancePaid: true,
        grandTotal: true,
      },
      _count: { id: true },
    });

    const grossRevenue = salesAggregate._sum.advancePaid || 0;
    const totalSalesCount = salesAggregate._count.id || 0;
    const totalBilled = salesAggregate._sum.grandTotal || 0;
    const avgBoutiqueValue = totalSalesCount > 0 ? Math.round(totalBilled / totalSalesCount) : 0;

    // 2. Total Registered Clients Count
    const totalClientsCount = await prisma.client.count({
      where: { shopId },
    });

    // 3. Fetch Recent Sales live from database for this shop
    const recentSalesFromDb = await prisma.sale.findMany({
      where: { shopId },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        grandTotal: true,
        advancePaid: true,
        remainingBalance: true,
        status: true,
        createdAt: true,
        client: {
          select: { name: true },
        },
        items: {
          take: 1,
          select: {
            product: {
              select: { name: true, brand: true },
            },
          },
        },
      },
    });

    const recentSales = recentSalesFromDb.map((sale) => {
      const name = sale.client?.name || "Walk-in Guest";
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return {
        id: sale.id,
        clientName: name,
        clientInitials: initials || "WG",
        product: sale.items[0]?.product?.name || "Bespoke Optical Creation",
        productName: sale.items[0]?.product?.name || "Bespoke Optical Creation",
        amount: sale.grandTotal,
        advancePaid: sale.advancePaid,
        remainingBalance: sale.remainingBalance,
        status: (sale.status === "COMPLETED" ? "Completed" : "Processing") as "Completed" | "Processing" | "Pending",
        date: new Date(sale.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
    });

    // 4. Generate Daily Revenue Stream (last 7 days from live sales)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklySales = await prisma.sale.findMany({
      where: {
        shopId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        createdAt: true,
        advancePaid: true,
        items: {
          select: {
            unitPrice: true,
            quantity: true,
            product: { select: { category: true } },
          },
        },
      },
    });

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const revenueMap = new Map<string, { designerFrames: number; bespokeLenses: number }>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      revenueMap.set(dayName, { designerFrames: 0, bespokeLenses: 0 });
    }

    for (const sale of weeklySales) {
      const dayName = days[new Date(sale.createdAt).getDay()];
      if (revenueMap.has(dayName)) {
        const current = revenueMap.get(dayName)!;
        for (const item of sale.items) {
          const itemTotal = item.unitPrice * item.quantity;
          if (item.product?.category === "FRAMES") {
            current.designerFrames += itemTotal;
          } else {
            current.bespokeLenses += itemTotal;
          }
        }
      }
    }

    const revenueStream: RevenueDataPoint[] = Array.from(revenueMap.entries()).map(([day, val]) => ({
      day,
      designerFrames: Math.round(val.designerFrames),
      bespokeLenses: Math.round(val.bespokeLenses),
    }));

    // 5. Category Mix Distribution (From actual inventory & sales)
    const categoryCounts = await prisma.product.groupBy({
      by: ["category"],
      where: { shopId },
      _count: { id: true },
    });

    const totalCategoryItems = categoryCounts.reduce((sum, c) => sum + c._count.id, 0);
    const categoryColors: Record<string, string> = {
      FRAMES: "#C9A96E",
      BESPOKE_LENSES: "#38BDF8",
      ACCESSORIES: "#10B981",
      CARE_KITS: "#A855F7",
    };

    const categoryNames: Record<string, string> = {
      FRAMES: "Eyewear Frames",
      BESPOKE_LENSES: "Bespoke Lenses",
      ACCESSORIES: "Accessories",
      CARE_KITS: "Care Kits",
    };

    const collectionMix: CollectionMixItem[] = categoryCounts.map((c) => ({
      name: categoryNames[c.category] || c.category,
      percentage: totalCategoryItems > 0 ? Math.round((c._count.id / totalCategoryItems) * 100) : 0,
      color: categoryColors[c.category] || "#C9A96E",
    }));

    // 6. Dynamic Auto-Generated Alerts for this Shop
    const lowStockProducts = await prisma.product.findMany({
      where: {
        shopId,
        stock: { lte: 3 },
      },
      take: 2,
      select: { brand: true, name: true, stock: true },
    });

    const pendingOrdersCount = await prisma.sale.count({
      where: {
        shopId,
        remainingBalance: { gt: 0 },
      },
    });

    const dbAlerts = await prisma.alert.findMany({
      where: { shopId },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    const alerts = [
      ...lowStockProducts.map((p) => ({
        id: `low-stock-${p.brand}-${p.name}`,
        type: "LOW_STOCK",
        title: "Low Inventory Alert",
        description: `${p.brand} ${p.name} has only ${p.stock} units left in boutique.`,
        actionLabel: "Restock in Inventory",
      })),
      ...(pendingOrdersCount > 0
        ? [
            {
              id: "pending-orders",
              type: "PENDING_DELIVERY",
              title: "Pending Orders Due",
              description: `${pendingOrdersCount} client order${pendingOrdersCount === 1 ? "" : "s"} waiting for remaining balance / delivery.`,
              actionLabel: "View in POS Terminal",
            },
          ]
        : []),
      ...dbAlerts.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        actionLabel: a.actionLabel || undefined,
      })),
    ];

    const data = {
      grossRevenue,
      totalSalesCount,
      avgBoutiqueValue,
      totalClientsCount,
      recentSales,
      revenueStream,
      collectionMix,
      alerts,
    };

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error("Error fetching insights data:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch insights data",
      data: {
        grossRevenue: 0,
        totalSalesCount: 0,
        avgBoutiqueValue: 0,
        totalClientsCount: 0,
        recentSales: [],
        revenueStream: [],
        collectionMix: [],
        alerts: [],
      },
    };
  }
}
