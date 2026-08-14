/**
 * Shared TypeScript Types and Enums
 * 
 * This file contains type definitions that can be safely imported
 * in both server and client components.
 * 
 * IMPORTANT: Do NOT import anything from @prisma/client here.
 * Only define pure TypeScript types and enums.
 * 
 * These enums are synced with prisma/schema.prisma
 */

// ─── User Roles ──────────────────────────────────────────────────────────
export enum Role {
  MANAGER = "MANAGER",
  OPTICIAN = "OPTICIAN",
  STYLIST = "STYLIST",
}

export type RoleType = keyof typeof Role;

// ─── Payment Methods ──────────────────────────────────────────────────────
// Mirrors the PaymentMethod enum from Prisma schema
export enum PaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  APPLE_PAY = "APPLE_PAY",
  WIRE_TRANSFER = "WIRE_TRANSFER",
  CASH = "CASH",
}

export type PaymentMethodType = keyof typeof PaymentMethod;

// ─── Member Tiers ────────────────────────────────────────────────────────
// Mirrors the MemberTier enum from Prisma schema
export enum MemberTier {
  ELITE_EYE_MEMBER = "ELITE_EYE_MEMBER",
  PREMIUM_MEMBER = "PREMIUM_MEMBER",
  STANDARD_MEMBER = "STANDARD_MEMBER",
}

export type MemberTierType = keyof typeof MemberTier;

// ─── Product Categories ──────────────────────────────────────────────────
// Mirrors the ProductCategory enum from Prisma schema
export enum ProductCategory {
  FRAMES = "FRAMES",
  BESPOKE_LENSES = "BESPOKE_LENSES",
  ACCESSORIES = "ACCESSORIES",
  CARE_KITS = "CARE_KITS",
}

export type ProductCategoryType = keyof typeof ProductCategory;

// ─── Product Badges ──────────────────────────────────────────────────────
// Mirrors the ProductBadge enum from Prisma schema
export enum ProductBadge {
  NEW_SEASON = "NEW_SEASON",
  LIMITED = "LIMITED",
  ONLY_2_LEFT = "ONLY_2_LEFT",
  IN_STOCK = "IN_STOCK",
}

export type ProductBadgeType = keyof typeof ProductBadge;

// ─── Order Status ────────────────────────────────────────────────────────
export enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export type OrderStatusType = keyof typeof OrderStatus;

// ─── Sale Status ─────────────────────────────────────────────────────────
export enum SaleStatus {
  COMPLETED = "COMPLETED",
  PROCESSING = "PROCESSING",
  CANCELLED = "CANCELLED",
}

export type SaleStatusType = keyof typeof SaleStatus;

// ─── Transaction Status ──────────────────────────────────────────────────
export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export type TransactionStatusType = keyof typeof TransactionStatus;

