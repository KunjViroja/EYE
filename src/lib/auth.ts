import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "manager@eye.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // In Phase 2: verify against database using bcrypt + Prisma
        // Demo fallback credentials:
        if (
          credentials?.email === "admin@eye.com" &&
          credentials?.password === "admin123"
        ) {
          return {
            id: "user-1",
            name: "Julianne Moore",
            email: "admin@eye.com",
            role: "MANAGER",
          };
        }
        return null;
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
