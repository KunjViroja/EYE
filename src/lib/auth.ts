import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // 1. Google OAuth Provider
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // SECURITY: Throw error if credentials not configured
      ...((!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) && {
        onError: (error: Error | string) => {
          console.error("Google OAuth not properly configured. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET env vars.");
          throw new Error("Google OAuth provider misconfigured");
        },
      }),
    }),

    // 2. Credentials Provider (Email & Hashed Password / Verification Check)
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        try {
          // Query live database for user record
          const dbUser = await prisma.user.findUnique({
            where: { email },
          });

          if (!dbUser || !dbUser.password) {
            return null;
          }

          // Compare hashed password using bcrypt
          const isValidPassword = await bcrypt.compare(password, dbUser.password);
          if (!isValidPassword) {
            return null;
          }

          return {
            id: dbUser.id,
            name: dbUser.name || "EYE Member",
            email: dbUser.email,
            image: dbUser.image || undefined,
            role: dbUser.role || "MANAGER",
          };
        } catch (err) {
          console.error("Database authentication query error:", err);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role || "MANAGER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});
