"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Role } from "@prisma/client";

export interface RegisterUserInput {
  name: string;
  email: string;
  password?: string;
}

export async function registerUserWithVerification(input: RegisterUserInput) {
  try {
    if (!input.email) {
      return { success: false, error: "Email address is required." };
    }

    const email = input.email.toLowerCase().trim();

    // 1. Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing && existing.emailVerified) {
      return { success: false, error: `An account with email "${email}" is already registered and verified. Please sign in.` };
    }

    // 2. Hash password if provided
    let hashedPassword: string | undefined = undefined;
    if (input.password) {
      // SECURITY: Enforce strong password requirements
      const passwordValidation = validatePassword(input.password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.error };
      }
      hashedPassword = await bcrypt.hash(input.password, 12); // Increased salt rounds for better security
    }

    // 3. Create or update user record
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: input.name || undefined,
        password: hashedPassword || undefined,
      },
      create: {
        name: input.name || "EYE Member",
        email,
        password: hashedPassword,
        role: Role.MANAGER,
      },
    });

    // 4. Generate verification token (expires in 24 hours)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    const verificationLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    console.log("--------------------------------------------------");
    console.log("📧 VERIFICATION EMAIL GENERATED FOR:", email);
    console.log("🔗 VERIFICATION LINK:", verificationLink);
    console.log("--------------------------------------------------");

    return {
      success: true,
      message: `Verification email generated for ${email}.`,
      verificationLink, // Returned for dev preview mode
    };
  } catch (error: any) {
    console.error("Error registering user with verification:", error);
    return { success: false, error: error.message || "Failed to generate verification request." };
  }
}

export async function verifyEmailToken(email: string, token: string) {
  try {
    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record || record.identifier !== email || record.expires < new Date()) {
      return { success: false, error: "Invalid or expired verification link." };
    }

    // Mark user as emailVerified
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Clean up verification token
    await prisma.verificationToken.delete({
      where: { token },
    });

    return { success: true, message: "Email successfully verified! You can now log in." };
  } catch (error: any) {
    console.error("Error verifying email token:", error);
    return { success: false, error: error.message || "Email verification failed." };
  }
}

/**
 * Validates password against security requirements
 * SECURITY: Enforces industry-standard password complexity
 */
function validatePassword(password: string): { isValid: boolean; error?: string } {
  // Minimum 12 characters (OWASP recommendation for user-created passwords)
  if (password.length < 12) {
    return {
      isValid: false,
      error: "Password must be at least 12 characters long.",
    };
  }

  // Maximum 128 characters (prevent potential DoS)
  if (password.length > 128) {
    return {
      isValid: false,
      error: "Password must not exceed 128 characters.",
    };
  }

  // Must contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one uppercase letter.",
    };
  }

  // Must contain at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one lowercase letter.",
    };
  }

  // Must contain at least one number
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one number.",
    };
  }

  // Must contain at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one special character (!@#$%^&* etc.)",
    };
  }

  return { isValid: true };
}
