// ─── Mock Data ────────────────────────────────────────────────────────────────
// This file contains all the fake data for Phase 1.
// In Phase 2, these functions will be REPLACED with real Prisma database queries.
// The key principle: the UI components don't care WHERE data comes from —
// they only care about the SHAPE (TypeScript types). So UI never changes!

// ─── Types ───────────────────────────────────────────────────────────────────
// These types match what our Prisma schema will look like in Phase 2.
// We define them here so the UI is already typed correctly.

export interface StatCardData {
  id: string;
  label: string;
  value: string;
  change: number;      // Positive = increase, negative = decrease
  changeLabel: string; // e.g. "+12.4%" or "Stable"
  trend: "up" | "down" | "stable";
  icon: string;        // emoji or icon name
}

export interface RevenueDataPoint {
  day: string;
  designerFrames: number;
  bespokeLenses: number;
}

export interface CollectionMixItem {
  name: string;
  percentage: number;
  color: string;
}

export interface RecentSale {
  id: string;
  clientName: string;
  clientInitials: string;
  product: string;
  amount: number;
  status: "Completed" | "Processing" | "Pending";
}

export interface EyeAlert {
  id: string;
  type: "restock" | "vvip" | "info";
  title: string;
  description: string;
  actionLabel?: string;
}

export interface Product {
  id: string;
  brand: string;
  name: string;
  sku: string;
  price: number;
  imageUrl: string;
  badge?: "NEW SEASON" | "ONLY 2 LEFT" | "LIMITED" | "IN STOCK";
  category: "Frames" | "Lenses" | "Accessories";
}

export interface Client {
  id: string;
  name: string;
  tier: "ELITE EYE MEMBER" | "PREMIUM CLIENT" | "EYE MEMBER";
  totalSpent: number;
  itemsOwned: number;
  phone: string;
  email: string;
  location: string;
  imageUrl?: string;
  prescription: {
    lastVerified: string;
    rightEye: { sph: number; cyl: number; axis: number; add: number };
    leftEye: { sph: number; cyl: number; axis: number; add: number };
  };
  stylePreference: string;
  prescriptionMilestone: string;
  acquisitions: Array<{
    id: string;
    product: string;
    description: string;
    amount: number;
    date: string;
    status: "DELIVERED" | "PROCESSING";
  }>;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

export const mockStats: StatCardData[] = [
  {
    id: "gross-revenue",
    label: "Gross Revenue",
    value: "$142,850",
    change: 12.4,
    changeLabel: "+12.4%",
    trend: "up",
    icon: "dollar",
  },
  {
    id: "total-sales",
    label: "Total Sales",
    value: "312",
    change: 5.2,
    changeLabel: "+5.2%",
    trend: "up",
    icon: "bag",
  },
  {
    id: "avg-boutique-value",
    label: "Avg. Boutique Value",
    value: "$458",
    change: 0,
    changeLabel: "Stable",
    trend: "stable",
    icon: "sparkles",
  },
  {
    id: "new-clients",
    label: "New Clients",
    value: "42",
    change: 18,
    changeLabel: "+18%",
    trend: "up",
    icon: "users",
  },
];

export const mockRevenueData: RevenueDataPoint[] = [
  { day: "Mon", designerFrames: 12000, bespokeLenses: 8000 },
  { day: "Tue", designerFrames: 15000, bespokeLenses: 9500 },
  { day: "Wed", designerFrames: 18000, bespokeLenses: 12000 },
  { day: "Thu", designerFrames: 22000, bespokeLenses: 14000 },
  { day: "Fri", designerFrames: 28000, bespokeLenses: 18000 },
  { day: "Sat", designerFrames: 32000, bespokeLenses: 20000 },
  { day: "Sun", designerFrames: 35000, bespokeLenses: 22000 },
];

export const mockCollectionMix: CollectionMixItem[] = [
  { name: "Haute Couture", percentage: 42, color: "#C9A96E" },
  { name: "Premium Core", percentage: 38, color: "#0D1117" },
  { name: "Essential Luxury", percentage: 20, color: "#E5E7EB" },
];

export const mockRecentSales: RecentSale[] = [
  {
    id: "sale-1",
    clientName: "Marcus Klein",
    clientInitials: "MK",
    product: "Oliver Peoples x Zeiss",
    amount: 1240,
    status: "Completed",
  },
  {
    id: "sale-2",
    clientName: "Sofia Jensen",
    clientInitials: "SJ",
    product: "Prada Crystal Limited",
    amount: 845,
    status: "Processing",
  },
  {
    id: "sale-3",
    clientName: "Robert Tanaka",
    clientInitials: "RT",
    product: "Tom Ford FT5634",
    amount: 590,
    status: "Completed",
  },
];

export const mockAlerts: EyeAlert[] = [
  {
    id: "alert-1",
    type: "restock",
    title: "Restock Required",
    description:
      "Limited edition Cartier frames are below threshold (2 units left).",
    actionLabel: "ORDER NOW",
  },
  {
    id: "alert-2",
    type: "vvip",
    title: "VVIP Visit Scheduled",
    description: "Mr. David Gandy arriving at 2:00 PM for private viewing.",
  },
];

export const mockProducts: Product[] = [
  {
    id: "prod-1",
    brand: "OLIVER PEOPLES",
    name: "Gregory Peck Bespoke Edition",
    sku: "OP-OP-12",
    price: 540,
    imageUrl: "/products/oliver-peoples.jpg",
    badge: "NEW SEASON",
    category: "Frames",
  },
  {
    id: "prod-2",
    brand: "CARTIER",
    name: "Panthère de Cartier Gold",
    sku: "CR-PN-94",
    price: 980,
    imageUrl: "/products/cartier.jpg",
    badge: "ONLY 2 LEFT",
    category: "Frames",
  },
  {
    id: "prod-3",
    brand: "TOM FORD",
    name: "Signature Rose Gold Aviator",
    sku: "TF-FT-56",
    price: 720,
    imageUrl: "/products/tom-ford.jpg",
    category: "Frames",
  },
  {
    id: "prod-4",
    brand: "PRADA",
    name: "Cinema Crystal Acetate",
    sku: "PR-16M-CLR",
    price: 680,
    imageUrl: "/products/prada.jpg",
    category: "Frames",
  },
  {
    id: "prod-5",
    brand: "GUCCI",
    name: "Titanium Aviator",
    sku: "GC-TI-88",
    price: 580,
    imageUrl: "/products/gucci.jpg",
    badge: "LIMITED",
    category: "Frames",
  },
  {
    id: "prod-6",
    brand: "RAY-BAN",
    name: "Bespoke Clubmaster",
    sku: "RB-CL-47",
    price: 320,
    imageUrl: "/products/rayban.jpg",
    badge: "IN STOCK",
    category: "Frames",
  },
];

export const mockClients: Client[] = [
  {
    id: "client-1",
    name: "Sofia Jensen",
    tier: "ELITE EYE MEMBER",
    totalSpent: 4842,
    itemsOwned: 12,
    phone: "+1 (555) 012-3456",
    email: "sofia.jensen@luxury.com",
    location: "Bel Air Estates, Los Angeles",
    prescription: {
      lastVerified: "Oct 24, 2024",
      rightEye: { sph: -2.75, cyl: -0.5, axis: 180, add: 1.5 },
      leftEye: { sph: -3.0, cyl: -0.75, axis: 175, add: 1.5 },
    },
    stylePreference:
      '"Prefers oversized acetate frames in tortoiseshell. Avoids thin metal rims. Interested in the new Cartier fall collection."',
    prescriptionMilestone:
      "Stable for 2 years. Recently upgraded to Zeiss Elite Progressive Lenses with BlueProtect.",
    acquisitions: [
      {
        id: "acq-1",
        product: "Oliver Peoples Gregory Peck",
        description: "Custom Acetate / Zeiss Progressive Set",
        amount: 540,
        date: "OCT 24, 2024",
        status: "DELIVERED",
      },
      {
        id: "acq-2",
        product: "Prada Cinema Limited",
        description: "Crystal Clear Acetate / Standard Single Vision",
        amount: 385,
        date: "APR 12, 2023",
        status: "DELIVERED",
      },
    ],
  },
  {
    id: "client-2",
    name: "Marcus Klein",
    tier: "PREMIUM CLIENT",
    totalSpent: 3200,
    itemsOwned: 8,
    phone: "+1 (555) 987-6543",
    email: "marcus.klein@email.com",
    location: "Beverly Hills, California",
    prescription: {
      lastVerified: "Sep 10, 2024",
      rightEye: { sph: -1.5, cyl: -0.25, axis: 90, add: 0 },
      leftEye: { sph: -1.75, cyl: -0.5, axis: 85, add: 0 },
    },
    stylePreference:
      '"Prefers slim metal frames. Classic and understated aesthetic. Open to Cartier and Tom Ford."',
    prescriptionMilestone: "New prescription. First progressive lens recommended.",
    acquisitions: [
      {
        id: "acq-3",
        product: "Oliver Peoples x Zeiss",
        description: "Vintage Gold / Clear Acetate",
        amount: 1240,
        date: "OCT 15, 2024",
        status: "DELIVERED",
      },
    ],
  },
];

// ─── POS Cart Types ────────────────────────────────────────────────────────
export interface CartItem {
  productId: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  hasPrescription: boolean;
}

export interface POSClient {
  id: string;
  name: string;
  tier: string;
  imageUrl?: string;
  memberDiscount: number; // e.g. 0.1 = 10%
}
