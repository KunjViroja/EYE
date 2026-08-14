"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, unstable_cache, revalidateTag } from "next/cache";
import { MemberTier, Prisma } from "@prisma/client";
import { getShopId } from "@/lib/shopAuth";

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
  doctorName?: string;
  visitDate?: string;
  rightSph: number;
  rightCyl: number;
  rightAxis: number;
  rightAdd: number;
  rightVision?: string;
  leftSph: number;
  leftCyl: number;
  leftAxis: number;
  leftAdd: number;
  leftVision?: string;
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
  lensFor?: string;
  lensIndex?: string;
  lensCoating?: string;
  opticianNotes?: string;
}

// ─── Direct High-Performance Client Query (Instant Live Sync) ─────────────────
export async function getClients(cursor?: string, take: number = 15) {
  try {
    const shopId = await getShopId();

    if (!shopId) {
      return { success: false, error: "Unauthorized" };
    }

    const clients = await prisma.client.findMany({
      where: { shopId },
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        location: true,
        tier: true,
        totalSpent: true,
        stylePreference: true,
        medicalNotes: true,
        prescriptionMilestone: true,
        sales: {
          select: {
            id: true,
            subtotal: true,
            discount: true,
            grandTotal: true,
            advancePaid: true,
            remainingBalance: true,
            status: true,
            paymentMethod: true,
            createdAt: true,
            items: {
              take: 5,
              select: {
                id: true,
                quantity: true, // ✅ Select quantity for accurate item counts
                unitPrice: true,
                hasPrescription: true,
                product: {
                  select: { name: true, brand: true, category: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        prescriptions: {
          select: {
            id: true,
            rightSph: true,
            rightCyl: true,
            rightAxis: true,
            rightAdd: true,
            leftSph: true,
            leftCyl: true,
            leftAxis: true,
            leftAdd: true,
            pdBinocular: true,
            lensType: true,
            lensIndex: true,
            lensCoating: true,
            doctorName: true,
            visitDate: true,
            lastVerified: true,
          },
          orderBy: { lastVerified: "desc" },
          take: 1,
        },
      },
    });

    const hasMore = clients.length > take;
    const data = hasMore ? clients.slice(0, take) : clients;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return {
      success: true,
      data,
      nextCursor,
      hasMore,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch clients";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get full client details with prescriptions & sales
 */
export async function getClientDetails(clientId: string) {
  try {
    const shopId = await getShopId();

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        prescriptions: {
          orderBy: { lastVerified: "desc" },
        },
        sales: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client || client.shopId !== shopId) {
      return {
        success: false,
        error: "Client not found or access denied",
      };
    }

    return { success: true, data: client };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch client details";
    return { success: false, error: errorMessage };
  }
}

// ─── Create Client ────────────────────────────────────────────────────────────
export async function createClient(input: CreateClientInput) {
  try {
    if (!input.name?.trim()) {
      return { success: false, error: "Client name is required." };
    }

    if (!input.email?.trim()) {
      return { success: false, error: "Email address is required." };
    }

    const email = input.email.toLowerCase().trim();

    if (!input.phone?.trim()) {
      return { success: false, error: "Phone number is required." };
    }

    const phoneDigits = input.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return { success: false, error: "Please enter a valid phone number (min 10 digits)." };
    }

    const shopId = await getShopId();

    if (!shopId) {
      return {
        success: false,
        error: "Shop not found. Please complete registration first.",
      };
    }

    // ⚡ Execute plan validation, count, and duplicate check in parallel (1 round-trip instead of 3)
    const [shop, clientCount, existing] = await Promise.all([
      prisma.shop.findUnique({
        where: { id: shopId },
        select: { plan: true, maxClients: true },
      }),
      prisma.client.count({
        where: { shopId },
      }),
      prisma.client.findFirst({
        where: {
          shopId,
          email,
        },
        select: { id: true },
      }),
    ]);

    if (!shop) {
      return { success: false, error: "Shop configuration error." };
    }

    if (clientCount >= shop.maxClients) {
      return {
        success: false,
        error: `You've reached the client limit (${shop.maxClients}) for your ${shop.plan} plan. Upgrade to add more clients.`,
      };
    }

    if (existing) {
      return {
        success: false,
        error: `A client with email "${email}" is already registered in your shop.`,
      };
    }

    const client = await prisma.$transaction(async (tx) => {
      const newClient = await tx.client.create({
        data: {
          shopId,
          name: input.name.trim(),
          email,
          phone: input.phone.trim(),
          secondaryPhone: input.secondaryPhone?.trim() || undefined,
          dob: input.dob?.trim() || undefined,
          gender: input.gender || "Unspecified",
          location: input.location?.trim() || "Local",
          tier: input.tier || MemberTier.STANDARD_MEMBER,
          stylePreference: input.stylePreference?.trim() || undefined,
          medicalNotes: input.medicalNotes?.trim() || undefined,
          prescriptionMilestone: "Profile initiated. Standard blueprint active.",
        },
      });

      await tx.prescription.create({
        data: {
          clientId: newClient.id,
          lastVerified: new Date(),
          rightSph: 0.0,
          rightCyl: 0.0,
          rightAxis: 180,
          rightAdd: 0.0,
          leftSph: 0.0,
          leftCyl: 0.0,
          leftAxis: 180,
          leftAdd: 0.0,
          pdBinocular: 63,
          lensType: "Single Vision",
          lensIndex: "1.60 High-Index",
          lensCoating: "Anti-Reflective AR",
        },
      });

      return newClient;
    });

    revalidateTag("clients-cache", "default");
    revalidatePath("/clientele");
    revalidatePath("/pos");

    return {
      success: true,
      data: client,
      message: `Client "${client.name}" registered successfully.`,
    };
  } catch (error) {
    console.error("❌ Error creating client:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          error: "A client with this email already exists in your shop.",
        };
      }
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to create client";
    return { success: false, error: errorMessage };
  }
}

// ─── Update Vision Prescription Blueprint ─────────────────────────────────────
export async function updatePrescription(input: UpdatePrescriptionInput) {
  try {
    if (!input.clientId) {
      return { success: false, error: "Client ID is required." };
    }

    const shopId = await getShopId();
    const existingClient = await prisma.client.findUnique({
      where: { id: input.clientId },
      select: { shopId: true },
    });

    if (!existingClient || existingClient.shopId !== shopId) {
      return { success: false, error: "Access denied or client does not exist." };
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

    await prisma.client.update({
      where: { id: input.clientId },
      data: {
        prescriptionMilestone: `Vision Blueprint updated on ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`,
      },
    });

    revalidateTag("clients-cache", "default");
    revalidatePath("/clientele");
    revalidatePath("/pos");

    return { success: true, data: newRx };
  } catch (error) {
    console.error("Error updating prescription:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update prescription";
    return { success: false, error: errorMessage };
  }
}
