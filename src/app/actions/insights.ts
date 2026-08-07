"use server";

import { prisma } from "@/lib/prisma";

export async function getInsightsData() {
  try {
    // 1. Calculate Gross Revenue & Total Sales Count live from database
    const salesAggregate = await prisma.sale.aggregate({
      where: { status: "COMPLETED" },
      _sum: { grandTotal: true },
      _count: { id: true },
    });

    const grossRevenue = salesAggregate._sum.grandTotal || 0;
    const totalSalesCount = salesAggregate._count.id || 0;
    const avgBoutiqueValue = totalSalesCount > 0 ? Math.round(grossRevenue / totalSalesCount) : 0;

    // 2. Fetch Recent Sales live from database
    const recentSalesFromDb = await prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        items: { include: { product: true } },
      },
    });

    const recentSales = recentSalesFromDb.map((s) => ({
      id: s.id,
      clientName: s.client?.name || "Client",
      clientInitials: s.client?.name ? s.client.name.split(" ").map((n) => n[0]).join("").toUpperCase() : "CL",
      product: s.items[0]?.product?.name || "Custom Eyewear",
      amount: s.grandTotal,
      status: s.status === "COMPLETED" ? ("Completed" as const) : ("Processing" as const),
    }));

    // 3. Fetch Alerts live from database
    const alertsFromDb = await prisma.alert.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    const alerts = alertsFromDb.map((a) => ({
      id: a.id,
      type: a.type.toLowerCase() as "restock" | "vvip" | "info",
      title: a.title,
      description: a.description,
      actionLabel: a.actionLabel || undefined,
    }));

    return {
      success: true,
      data: {
        grossRevenue,
        totalSalesCount,
        avgBoutiqueValue,
        recentSales,
        alerts,
      },
    };
  } catch (error: any) {
    console.error("Error fetching insights data:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch insights data",
      data: {
        grossRevenue: 0,
        totalSalesCount: 0,
        avgBoutiqueValue: 0,
        recentSales: [],
        alerts: [],
      },
    };
  }
}
