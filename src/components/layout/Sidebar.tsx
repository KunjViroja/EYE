"use client";
// ↑ IMPORTANT: This tells Next.js this component runs in the BROWSER (client-side),
// not on the server. We need this because we use usePathname() which reads the URL.
// Rule of thumb: if you use hooks (useState, useEffect, usePathname), add "use client".

import Link from "next/link";
// Link is Next.js's version of <a> tags. It does "client-side navigation" —
// meaning the page doesn't fully reload, just the content changes. Much faster!

import { usePathname } from "next/navigation";
// usePathname() returns the current URL path e.g. "/insights" or "/collections"
// We use this to know which nav item should be highlighted as "active"

import {
  BarChart2,
  ShoppingBag,
  Grid,
  Users,
  TrendingUp,
  Settings,
  UserCircle,
  Eye,
} from "lucide-react";
// lucide-react gives us clean SVG icons. Each import is one icon component.
// Usage: <BarChart2 size={18} /> renders a bar chart icon at 18px

import styles from "./Sidebar.module.css";
// This imports the CSS Module. We access classes as: styles.sidebar, styles.navItem, etc.

// ─── Type Definition ─────────────────────────────────────────────────────────
// TypeScript: we define the SHAPE of each navigation item
interface NavItem {
  href: string;      // URL this item links to
  label: string;     // Text shown in sidebar
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  // ↑ This is a React component type (the icon). It accepts optional size and strokeWidth props.
}

// ─── Navigation Data ─────────────────────────────────────────────────────────
// Separating DATA from UI is a key principle.
// If you want to add a new nav item, just add it here — no need to touch the JSX.
const mainNavItems: NavItem[] = [
  { href: "/insights", label: "Insights", icon: BarChart2 },
  { href: "/pos", label: "Boutique POS", icon: ShoppingBag },
  { href: "/collections", label: "Collections", icon: Grid },
  { href: "/clientele", label: "Clientele", icon: Users },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
];

const managementNavItems: NavItem[] = [
  { href: "/staff", label: "Staff", icon: UserCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  // pathname = "/insights" when on the insights page, "/collections" on collections, etc.

  return (
    <aside className={styles.sidebar} aria-label="Main navigation">
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Eye size={18} color="#0D1117" strokeWidth={2.5} />
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoName}>Lumina</span>
          <span className={styles.logoSub}>Atelier</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav} aria-label="Primary navigation">
        {/* Main nav items */}
        {mainNavItems.map((item) => {
          // For each item in our array, we check if the current URL starts with its href
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon; // Store icon component in a variable (must be capitalized)

          return (
            <Link
              key={item.href}               // key is required in React lists — helps React track items
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
              // ↑ Template literal: applies "navItem" always, adds "active" class only if isActive
              aria-current={isActive ? "page" : undefined}
              // ↑ Accessibility: tells screen readers which page is currently active
            >
              <Icon
                className={styles.navIcon}
                size={17}
                strokeWidth={isActive ? 2.2 : 1.8}
                // ↑ Active items have slightly bolder icons — a subtle premium detail
              />
              {item.label}
            </Link>
          );
        })}

        {/* Management section */}
        <div className={styles.sectionLabel} aria-hidden="true">
          Management
        </div>

        {managementNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={styles.navIcon} size={17} strokeWidth={isActive ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className={styles.userSection} aria-label="Current user">
        <div className={styles.userAvatar} aria-hidden="true">
          JM
          {/* In Phase 2, this will show a real user photo from the database */}
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>Julianne Moore</div>
          <div className={styles.userRole}>Boutique Manager</div>
        </div>
      </div>
    </aside>
  );
}
