import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load Next.js local environment variables first
dotenv.config({ path: ".env.local" });
dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // For DDL schema migrations/push on Supabase, use DIRECT_URL (session pooler / direct) if available
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
