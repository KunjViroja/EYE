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

// ─── Cached Internal Insights Query (30-second TTL + Tag Invalidation) ────────
const getCachedInsightsQuery = unstable_cache(
  async (shopId: string) => {
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
            quantity: true,
            product: {
              select: { name: true, brand: true, category: true },
            },
          },
        },
      },
    });

    const recentSales = recentSalesFromDb.map((s) => ({
      id: s.id,
      clientName: s.client?.name || "Walk-in Client",
      clientInitials: s.client?.name
        ? s.client.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
        : "CL",
      product: s.items[0]?.product?.name || "Bespoke Eyewear",
      amount: s.grandTotal,
      advancePaid: s.advancePaid,
      remainingBalance: s.remainingBalance,
      status: s.status === "COMPLETED" ? ("Completed" as const) : ("Processing" as const),
    }));

    // 4. Live 7-Day Revenue Stream Chart Points
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const pastWeekSales = await prisma.sale.findMany({
      where: {
        shopId,
        createdAt: { gte: sevenDaysAgo },
      },
      include: {
        items: {
          include: {
            product: { select: { category: true } },
          },
        },
      },
    });

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const revenueMap = new Map<string, { designerFrames: number; bespokeLenses: number }>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = dayLabels[d.getDay()];
      revenueMap.set(label, { designerFrames: 0, bespokeLenses: 0 });
    }

    for (const sale of pastWeekSales) {
      const dayLabel = dayLabels[new Date(sale.createdAt).getDay()];
      const entry = revenueMap.get(dayLabel);
      if (entry) {
        for (const item of sale.items) {
          const itemVal = item.unitPrice * item.quantity;
          if (item.product?.category === "BESPOKE_LENSES") {
            entry.bespokeLenses += itemVal;
          } else {
            entry.designerFrames += itemVal;
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
        id: `low-stock-${p.name}`,
        type: "restock" as const,
        title: "Low Inventory Alert",
        description: `${p.brand} ${p.name} has only ${p.stock} piece${p.stock === 1 ? "" : "s"} left in stock.`,
        actionLabel: "Order Stock",
      })),
      ...(pendingOrdersCount > 0
        ? [
            {
              id: "pending-orders-alert",
              type: "vvip" as const,
              title: "Pending Balance Due",
              description: `You have ${pendingOrdersCount} active customer order${pendingOrdersCount === 1 ? "" : "s"} with advance balances pending collection.`,
              actionLabel: "View Orders",
            },
          ]
        : []),
      ...dbAlerts.map((a) => ({
        id: a.id,
        type: (a.type.toLowerCase() as "restock" | "vvip" | "info") || "info",
        title: a.title,
        description: a.description,
        actionLabel: a.actionLabel || undefined,
      })),
    ];

    return {
      grossRevenue,
      totalSalesCount,
      avgBoutiqueValue,
      totalClientsCount,
      recentSales,
      revenueStream,
      collectionMix,
      alerts,
    };
  },
  ["insights-dashboard-cache"],
  {
    revalidate: 30,
    tags: ["insights-cache"],
  }
);

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

    const data = await getCachedInsightsQuery(shopId);

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
