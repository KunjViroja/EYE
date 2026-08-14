/**
 * Shop Authentication & Authorization
 *
 * CRITICAL MULTI-TENANT ACCESS CONTROLLER
 * Ensures every query is scoped to the caller's shopId.
 *
 * PERFORMANCE & RELIABILITY DESIGN:
 * 1. Fast Path: Reads `shopId` directly from the JWT cookie (0 DB queries).
 * 2. Auto-Healing Fallback: If shopId is missing in JWT (e.g. older session or fresh account),
 *    it checks the database or auto-creates a default shop so the user is NEVER blocked.
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Extended session user type ───────────────────────────────────────────────
interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  shopId?: string | null;
  userId?: string;
}

// ─── getShopId with Auto-Healing ──────────────────────────────────────────────
export async function getShopId(): Promise<string> {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized: User not authenticated. Please log in.");
  }

  const user = session.user as SessionUser;
  const userId = user.userId || user.id;
  const email = user.email ? user.email.toLowerCase().trim() : null;

  // 1. FAST PATH: shopId is already present in JWT session (0ms)
  if (user.shopId) {
    return user.shopId;
  }

  // 2. AUTO-HEALING PATH: Look up in DB by ownerId or email
  let shop = null;

  if (userId) {
    shop = await prisma.shop.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });
  }

  if (!shop && email) {
    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, shop: { select: { id: true } } },
    });

    if (dbUser?.shop) {
      return dbUser.shop.id;
    }

    // 3. ZERO-BLOCK FALLBACK: If user exists in DB but has no shop, auto-create one
    if (dbUser) {
      const newShop = await prisma.shop.create({
        data: {
          ownerId: dbUser.id,
          name: `${dbUser.name || "My"} Optical Store`,
          shopType: "RETAIL_OPTICAL",
          plan: "FREE",
          maxProducts: 20,
          maxClients: 20,
        },
        select: { id: true },
      });
      return newShop.id;
    }
  }

  if (shop) {
    return shop.id;
  }

  throw new Error("User account not found. Please log in again.");
}

// ─── getSessionUser ────────────────────────────────────────────────────────────
export async function getSessionUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized: User not authenticated");
  return session.user as SessionUser;
}

// ─── requireRole ──────────────────────────────────────────────────────────────
export async function requireRole(allowedRoles: string[]): Promise<void> {
  const user = await getSessionUser();
  const role = user.role || "STYLIST";

  if (!allowedRoles.includes(role)) {
    throw new Error(
      `Access denied. This action requires one of: ${allowedRoles.join(", ")}.`
    );
  }
}

// ─── getCurrentShop ────────────────────────────────────────────────────────────
export async function getCurrentShop() {
  const shopId = await getShopId();

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      id: true,
      name: true,
      city: true,
      phone: true,
      shopType: true,
      plan: true,
      maxClients: true,
      maxProducts: true,
      subscriptionEndsAt: true,
    },
  });

  return shop;
}