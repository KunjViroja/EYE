"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Role } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterStep1Input {
  name: string;
  email: string;
  password: string;
}

export interface CompleteShopSetupInput {
  userId: string;   // returned from step 1
  shopName: string;
  city: string;
  phone: string;
  shopType: string; // "RETAIL_OPTICAL" | "EYE_CLINIC" | "BOTH"
}

// ─── Step 1: Create User Account ──────────────────────────────────────────────
/**
 * Creates a user record and sends a verification email.
 * The Shop is NOT created yet — that happens in Step 2 (completeShopSetup).
 *
 * Why separate steps?
 * Long forms have high dropout rates. Step 1 feels like normal signup.
 * Step 2 feels like "setting up your workspace" (like Notion/Slack/Linear).
 */
export async function registerUserWithVerification(input: RegisterStep1Input) {
  try {
    if (!input.name?.trim() || !input.email?.trim() || !input.password) {
      return { success: false, error: "Name, email, and password are required." };
    }

    const email = input.email.toLowerCase().trim();

    // 1. Check if a verified account already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.emailVerified) {
      return {
        success: false,
        error: `An account with "${email}" is already registered. Please sign in.`,
      };
    }

    // 2. Validate password strength
    const passwordValidation = validatePassword(input.password);
    if (!passwordValidation.isValid) {
      return { success: false, error: passwordValidation.error };
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(input.password, 12);

    // 4. Upsert user (handles re-registration of unverified accounts)
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: input.name.trim(),
        password: hashedPassword,
      },
      create: {
        name: input.name.trim(),
        email,
        password: hashedPassword,
        role: Role.MANAGER,
      },
    });

    // 5. Generate email verification token (24-hour expiry)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Delete any existing token for this email before creating a new one
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationLink = `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    // ─── TODO: Replace console.log with Resend email ──────────────────────────
    // Install Resend: npm install resend
    // Add env var: RESEND_API_KEY=re_xxxxxxxx
    //
    // import { Resend } from "resend";
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: "OptiPay <noreply@yourdomain.com>",
    //   to: email,
    //   subject: "Verify your OptiPay account",
    //   html: `<p>Hi ${input.name},</p>
    //          <p>Click below to verify your email and set up your shop:</p>
    //          <a href="${verificationLink}">Verify My Account</a>`,
    // });
    // ─────────────────────────────────────────────────────────────────────────

    console.log("─────────────────────────────────────────────────────────");
    console.log("📧 VERIFICATION EMAIL FOR:", email);
    console.log("🔗 LINK:", verificationLink);
    console.log("─────────────────────────────────────────────────────────");

    return {
      success: true,
      userId: user.id,
      message: `Verification email sent to ${email}.`,
      verificationLink, // Only used in dev mode UI
    };
  } catch (error) {
    console.error("Registration error:", error);
    const msg = error instanceof Error ? error.message : "Registration failed.";
    return { success: false, error: msg };
  }
}

// ─── Step 2: Complete Shop Setup ──────────────────────────────────────────────
/**
 * Creates the Shop record after Step 1 account creation.
 * Called from the /register page (Step 2 of the signup wizard).
 *
 * Uses upsert so that re-submitting the form doesn't create duplicate shops.
 */
export async function completeShopSetup(input: CompleteShopSetupInput) {
  try {
    if (!input.userId) return { success: false, error: "User ID is required." };
    if (!input.shopName?.trim()) return { success: false, error: "Shop name is required." };
    if (!input.city?.trim()) return { success: false, error: "City is required." };
    if (!input.phone?.trim()) return { success: false, error: "Contact number is required." };

    // Validate phone — at least 10 digits
    const phoneDigits = input.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return { success: false, error: "Please enter a valid 10-digit contact number." };
    }

    // Verify the user actually exists
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) return { success: false, error: "Account not found. Please register again." };

    // Create or update the shop (upsert prevents duplicate on form re-submit)
    const shop = await prisma.shop.upsert({
      where: { ownerId: input.userId },
      update: {
        name: input.shopName.trim(),
        city: input.city.trim(),
        phone: input.phone.trim(),
        shopType: input.shopType || "RETAIL_OPTICAL",
      },
      create: {
        ownerId: input.userId,
        name: input.shopName.trim(),
        city: input.city.trim(),
        phone: input.phone.trim(),
        shopType: input.shopType || "RETAIL_OPTICAL",
        plan: "FREE",
        maxProducts: 10,
        maxClients: 5,
      },
    });

    return { success: true, shopId: shop.id, message: "Shop setup complete!" };
  } catch (error) {
    console.error("Shop setup error:", error);
    const msg = error instanceof Error ? error.message : "Failed to set up shop.";
    return { success: false, error: msg };
  }
}

// ─── Verify Email Token ────────────────────────────────────────────────────────
/**
 * Called from /verify-email page.
 * Marks the user as verified. Shop was already created in Step 2.
 * On success, the UI redirects to /welcome (onboarding screen).
 */
export async function verifyEmailToken(email: string, token: string) {
  try {
    const record = await prisma.verificationToken.findUnique({ where: { token } });

    if (!record || record.identifier !== email || record.expires < new Date()) {
      return { success: false, error: "This verification link is invalid or has expired." };
    }

    // Mark user as verified
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Clean up the used token
    await prisma.verificationToken.delete({ where: { token } });

    return { success: true, message: "Email verified! Your shop is ready." };
  } catch (error) {
    console.error("Email verification error:", error);
    const msg = error instanceof Error ? error.message : "Verification failed.";
    return { success: false, error: msg };
  }
}

// ─── Password Validation ──────────────────────────────────────────────────────
/**
 * Enforces OWASP-recommended password requirements.
 * Min 12 chars, uppercase, lowercase, number, special character.
 */
function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 12) {
    return { isValid: false, error: "Password must be at least 12 characters long." };
  }
  if (password.length > 128) {
    return { isValid: false, error: "Password must not exceed 128 characters." };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one uppercase letter (A-Z)." };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one lowercase letter (a-z)." };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one number (0-9)." };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};:'",.<>/?\\|`~]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one special character (!@#$%^&* etc.)" };
  }
  return { isValid: true };
}
