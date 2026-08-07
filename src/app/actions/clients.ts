"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MemberTier } from "@prisma/client";

export interface CreateClientInput {
  name: string;
  email: string;
  phone: string;
  location: string;
  tier?: MemberTier;
  stylePreference?: string;
}

export interface UpdatePrescriptionInput {
  clientId: string;
  rightSph: number;
  rightCyl: number;
  rightAxis: number;
  rightAdd: number;
  leftSph: number;
  leftCyl: number;
  leftAxis: number;
  leftAdd: number;
}

// ─── Fetch Clients from Supabase ─────────────────────────────────────────────
export async function getClients() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        prescriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        sales: {
          orderBy: { createdAt: "desc" },
          include: { items: { include: { product: true } } },
        },
      },
    });

    return { success: true, data: clients };
  } catch (error: any) {
    console.error("Error fetching clients:", error);
    return { success: false, error: error.message || "Failed to fetch clients" };
  }
}

// ─── Create Client in Supabase ──────────────────────────────────────────────
export async function createClient(input: CreateClientInput) {
  try {
    if (!input.name || !input.email || !input.phone) {
      return { success: false, error: "Name, email, and phone are required." };
    }

    const existing = await prisma.client.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      return { success: false, error: `Client with email "${input.email}" already exists.` };
    }

    const client = await prisma.client.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        location: input.location || "Los Angeles, CA",
        tier: input.tier || MemberTier.ATELIER_MEMBER,
        stylePreference: input.stylePreference || "Classic luxury aesthetics.",
        prescriptionMilestone: "Initial vision profile created.",
        prescriptions: {
          create: {
            lastVerified: new Date(),
            rightSph: 0.0,
            rightCyl: 0.0,
            rightAxis: 180,
            rightAdd: 0.0,
            leftSph: 0.0,
            leftCyl: 0.0,
            leftAxis: 180,
            leftAdd: 0.0,
          },
        },
      },
    });

    revalidatePath("/clientele");
    revalidatePath("/pos");

    return { success: true, data: client };
  } catch (error: any) {
    console.error("Error creating client:", error);
    return { success: false, error: error.message || "Failed to create client" };
  }
}

// ─── Update Vision Prescription in Supabase ─────────────────────────────────
export async function updatePrescription(input: UpdatePrescriptionInput) {
  try {
    if (!input.clientId) {
      return { success: false, error: "Client ID is required." };
    }

    const newRx = await prisma.prescription.create({
      data: {
        clientId: input.clientId,
        lastVerified: new Date(),
        rightSph: Number(input.rightSph),
        rightCyl: Number(input.rightCyl),
        rightAxis: Number(input.rightAxis),
        rightAdd: Number(input.rightAdd),
        leftSph: Number(input.leftSph),
        leftCyl: Number(input.leftCyl),
        leftAxis: Number(input.leftAxis),
        leftAdd: Number(input.leftAdd),
      },
    });

    // Update milestone message
    await prisma.client.update({
      where: { id: input.clientId },
      data: {
        prescriptionMilestone: `Vision Blueprint updated on ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`,
      },
    });

    revalidatePath("/clientele");

    return { success: true, data: newRx };
  } catch (error: any) {
    console.error("Error updating prescription:", error);
    return { success: false, error: error.message || "Failed to update prescription" };
  }
}
