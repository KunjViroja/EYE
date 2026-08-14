import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ─── Google Provider ──────────────────────────────────────────────────────────
const googleConfigured =
  !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;

const providers = [
  CredentialsProvider({
    name: "Email & Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const email = (credentials.email as string).toLowerCase().trim();
      const password = credentials.password as string;

      try {
        const dbUser = await prisma.user.findUnique({ where: { email } });

        if (!dbUser || !dbUser.password) return null;

        const isValid = await bcrypt.compare(password, dbUser.password);
        if (!isValid) return null;

        // Block unverified users from signing in
        if (!dbUser.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: dbUser.id,
          name: dbUser.name || "Shop Owner",
          email: dbUser.email,
          image: dbUser.image || undefined,
          role: dbUser.role || "MANAGER",
        };
      } catch (err) {
        throw err;
      }
    },
  }),
];

if (googleConfigured) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }) as never
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // ─── JWT Callback ──────────────────────────────────────────────────────
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as { role?: string }).role || "MANAGER";
        token.userId = user.id;

        const shop = await prisma.shop.findUnique({
          where: { ownerId: user.id! },
          select: { id: true },
        });
        token.shopId = shop?.id ?? null;
      }

      // Self-repair: if shopId is missing in token, look it up or auto-create
      if (!token.shopId && token.userId) {
        const shop = await prisma.shop.findUnique({
          where: { ownerId: token.userId as string },
          select: { id: true },
        });
        if (shop) {
          token.shopId = shop.id;
        } else {
          // Auto-create shop if missing
          const newShop = await prisma.shop.create({
            data: {
              ownerId: token.userId as string,
              name: "My Optical Store",
              shopType: "RETAIL_OPTICAL",
              plan: "FREE",
            },
            select: { id: true },
          });
          token.shopId = newShop.id;
        }
      }

      if (trigger === "update" && token.userId) {
        const shop = await prisma.shop.findUnique({
          where: { ownerId: token.userId as string },
          select: { id: true },
        });
        token.shopId = shop?.id ?? null;
      }

      return token;
    },

    // ─── Session Callback ─────────────────────────────────────────────────
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { shopId?: string | null }).shopId = token.shopId as string | null;
        (session.user as { userId?: string }).userId = token.userId as string;
        (session.user as { id?: string }).id = token.userId as string;
      }
      return session;
    },
  },

  events: {
    async createUser({ user }) {
      try {
        const existing = await prisma.shop.findUnique({
          where: { ownerId: user.id! },
        });
        if (!existing) {
          await prisma.shop.create({
            data: {
              ownerId: user.id!,
              name: `${user.name || "My"} Optical Store`,
              shopType: "RETAIL_OPTICAL",
              plan: "FREE",
              maxProducts: 20,
              maxClients: 20,
            },
          });
        }
      } catch (err) {
        console.error("Auto-create shop failed for Google user:", err);
      }
    },
  },
});
