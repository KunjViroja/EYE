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
      if (input.password.length < 6) {
        return { success: false, error: "Password must be at least 6 characters long." };
      }
      hashedPassword = await bcrypt.hash(input.password, 10);
    }

    // 3. Create or update user record
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: input.name || undefined,
        password: hashedPassword || undefined,
      },
      create: {
        name: input.name || "Atelier Member",
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
