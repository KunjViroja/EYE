"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MemberTier } from "@prisma/client";

export interface CreateClientInput {
  name: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  dob?: string;
  gender?: string;
  location: string;
  tier?: MemberTier;
  stylePreference?: string;
  medicalNotes?: string;
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
  pdBinocular?: number;
  pdRight?: number;
  pdLeft?: number;
  segHeightRight?: number;
  segHeightLeft?: number;
  rightPrism?: number;
  rightBase?: string;
  leftPrism?: number;
  leftBase?: string;
  lensType?: string;
  lensIndex?: string;
  lensCoating?: string;
  opticianNotes?: string;
}

// ─── Fetch Clients ───────────────────────────────────────────────────────────
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

// ─── Create Client ────────────────────────────────────────────────────────────
export async function createClient(input: CreateClientInput) {
  try {
    if (!input.name || !input.email || !input.phone) {
      return { success: false, error: "Name, email, and primary phone are required." };
    }

    const email = input.email.toLowerCase().trim();

    const existing = await prisma.client.findUnique({
      where: { email },
    });

    if (existing) {
      return { success: false, error: `A client with email "${email}" is already registered.` };
    }

    const client = await prisma.client.create({
      data: {
        name: input.name,
        email,
        phone: input.phone,
        secondaryPhone: input.secondaryPhone || undefined,
        dob: input.dob || undefined,
        gender: input.gender || "Unspecified",
        location: input.location || "Location not provided",
        tier: input.tier || MemberTier.ELITE_EYE_MEMBER,
        stylePreference: input.stylePreference || "Classic eyewear aesthetics.",
        medicalNotes: input.medicalNotes || undefined,
        prescriptionMilestone: "Initial vision blueprint created.",
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
            pdBinocular: 63.0,
            lensType: "Single Vision",
            lensIndex: "1.60 High-Index",
            lensCoating: "Anti-Reflective AR + BlueProtect",
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

// ─── Update Vision Prescription Blueprint ─────────────────────────────────────
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
        pdBinocular: input.pdBinocular !== undefined ? Number(input.pdBinocular) : undefined,
        pdRight: input.pdRight !== undefined ? Number(input.pdRight) : undefined,
        pdLeft: input.pdLeft !== undefined ? Number(input.pdLeft) : undefined,
        segHeightRight: input.segHeightRight !== undefined ? Number(input.segHeightRight) : undefined,
        segHeightLeft: input.segHeightLeft !== undefined ? Number(input.segHeightLeft) : undefined,
        rightPrism: input.rightPrism !== undefined ? Number(input.rightPrism) : undefined,
        rightBase: input.rightBase || undefined,
        leftPrism: input.leftPrism !== undefined ? Number(input.leftPrism) : undefined,
        leftBase: input.leftBase || undefined,
        lensType: input.lensType || "Single Vision",
        lensIndex: input.lensIndex || "1.60 High-Index",
        lensCoating: input.lensCoating || "Anti-Reflective AR",
        opticianNotes: input.opticianNotes || undefined,
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
