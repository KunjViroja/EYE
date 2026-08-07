"use server";

import { prisma } from "@/lib/prisma";

export async function getClients() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { name: "asc" },
      include: {
        prescriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return { success: true, data: clients };
  } catch (error: any) {
    console.error("Error fetching clients:", error);
    return { success: false, error: error.message || "Failed to fetch clients" };
  }
}
