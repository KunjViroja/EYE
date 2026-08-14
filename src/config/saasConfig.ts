/**
 * OptiPay SaaS Configuration
 * 
 * Centralized configuration for the OptiPay eyewear boutique management system.
 * This file controls business-critical settings including currency, branding, and defaults.
 * 
 * SECURITY NOTE: Do not store sensitive data (API keys, secrets) here.
 * Use environment variables for sensitive configuration via .env.local
 */

export const saasConfig = {
  // ─── Application Identity ────────────────────────────────────────────────
  appName: "OptiPay",
  storeName: "OptiPay Premium Eyewear Boutique",
  appVersion: "1.0.0",
  
  // ─── Currency & Localization ──────────────────────────────────────────────
  // Used across all monetary displays (POS, Inventory, Analytics)
  currency: "₹", // Indian Rupee
  currencyCode: "INR",
  locale: "en-IN", // en-IN for Indian English
  
  // ─── Business Defaults ────────────────────────────────────────────────────
  defaultGSTRate: 18, // Default GST percentage for products (can be overridden per product)
  
  // GST Configuration (India-specific)
  gstRates: [
    { rate: 0, label: "0% - Exempt" },
    { rate: 5, label: "5% GST" },
    { rate: 12, label: "12% GST" },
    { rate: 18, label: "18% GST" },
    { rate: 28, label: "28% GST" },
  ],
  
  // ─── POS Configuration ────────────────────────────────────────────────────
  pos: {
    defaultBillSeries: "SALE_26-27",
    defaultBillType: "TAXFREE(L)",
    defaultPaymentMethod: "CASH",
    // Min/Max for advance payment
    minAdvancePercentage: 10, // 10% minimum advance
    defaultAdvancePercentage: 50, // Default 50% for advance payment
  },
  
  // ─── Feature Flags ────────────────────────────────────────────────────────
  features: {
    enableAdvancePayments: true,
    enableBespokeConsultation: true,
    enableRxManagement: true,
    enableAnalytics: true,
    enableStaffManagement: false, // Coming soon
  },
  
  // ─── Security & Compliance ────────────────────────────────────────────────
  security: {
    // Session timeout in milliseconds (30 minutes)
    sessionTimeout: 30 * 60 * 1000,
    // Max login attempts before account lock
    maxLoginAttempts: 5,
    // Password requirements
    passwordMinLength: 12,
    requireSpecialCharacters: true,
    requireNumbers: true,
    requireUppercase: true,
  },
  
  // ─── API Configuration ────────────────────────────────────────────────────
  api: {
    // All API endpoints should use relative paths for CSRF protection
    timeout: 30000, // 30 seconds
  },
} as const;

// Type export for TypeScript consumers
export type SaasConfig = typeof saasConfig;
