import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, ProductCategory, ProductBadge, MemberTier } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Supabase database...");

  // 1. Create Demo Manager User
  await prisma.user.upsert({
    where: { email: "admin@eye.com" },
    update: {},
    create: {
      name: "Julianne Moore",
      email: "admin@eye.com",
      role: Role.MANAGER,
    },
  });

  // 2. Create Products
  const productsData = [
    {
      brand: "OLIVER PEOPLES",
      name: "Gregory Peck Bespoke Edition",
      sku: "OP-OP-12",
      price: 540.0,
      category: ProductCategory.FRAMES,
      badge: ProductBadge.NEW_SEASON,
      stock: 15,
    },
    {
      brand: "CARTIER",
      name: "Panthère de Cartier Gold",
      sku: "CR-PN-94",
      price: 980.0,
      category: ProductCategory.FRAMES,
      badge: ProductBadge.ONLY_2_LEFT,
      stock: 2,
    },
    {
      brand: "TOM FORD",
      name: "Signature Rose Gold Aviator",
      sku: "TF-FT-56",
      price: 720.0,
      category: ProductCategory.FRAMES,
      stock: 8,
    },
    {
      brand: "PRADA",
      name: "Cinema Crystal Acetate",
      sku: "PR-16M-CLR",
      price: 680.0,
      category: ProductCategory.FRAMES,
      stock: 12,
    },
    {
      brand: "GUCCI",
      name: "Titanium Aviator",
      sku: "GC-TI-88",
      price: 580.0,
      category: ProductCategory.FRAMES,
      badge: ProductBadge.LIMITED,
      stock: 5,
    },
    {
      brand: "RAY-BAN",
      name: "Bespoke Clubmaster",
      sku: "RB-CL-47",
      price: 320.0,
      category: ProductCategory.FRAMES,
      badge: ProductBadge.IN_STOCK,
      stock: 20,
    },
  ];

  for (const prod of productsData) {
    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {},
      create: prod,
    });
  }

  // 3. Create Client & Prescription
  await prisma.client.upsert({
    where: { email: "sofia.jensen@luxury.com" },
    update: {},
    create: {
      name: "Sofia Jensen",
      email: "sofia.jensen@luxury.com",
      phone: "+1 (555) 012-3456",
      location: "Bel Air Estates, Los Angeles",
      tier: MemberTier.ELITE_ATELIER_MEMBER,
      stylePreference: '"Prefers oversized acetate frames in tortoiseshell. Avoids thin metal rims. Interested in the new Cartier fall collection."',
      prescriptionMilestone: "Stable for 2 years. Recently upgraded to Zeiss Elite Progressive Lenses with BlueProtect.",
      totalSpent: 4842.0,
      prescriptions: {
        create: {
          lastVerified: new Date(),
          rightSph: -2.75,
          rightCyl: -0.5,
          rightAxis: 180,
          rightAdd: 1.5,
          leftSph: -3.0,
          leftCyl: -0.75,
          leftAxis: 175,
          leftAdd: 1.5,
        },
      },
    },
  });

  // 4. Create Alerts
  const alertsData = [
    {
      type: "RESTOCK" as const,
      title: "Restock Required",
      description: "Limited edition Cartier frames are below threshold (2 units left).",
      actionLabel: "ORDER NOW",
    },
    {
      type: "VVIP" as const,
      title: "VVIP Visit Scheduled",
      description: "Mr. David Gandy arriving at 2:00 PM for private viewing.",
    },
  ];

  for (const alert of alertsData) {
    await prisma.alert.create({
      data: alert,
    });
  }

  console.log("✅ Supabase Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
