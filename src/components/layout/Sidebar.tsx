"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  Settings,
  UserCircle,
  Eye,
  LogOut,
} from "lucide-react";
import styles from "./Sidebar.module.css";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

const mainNavItems: NavItem[] = [
  { href: "/insights",    label: "Insights",     icon: BarChart2   },
  { href: "/pos",         label: "Boutique POS", icon: ShoppingBag },
  { href: "/collections", label: "Collections",  icon: Package     },
  { href: "/clientele",   label: "Clientele",    icon: Users       },
  { href: "/analytics",   label: "Analytics",    icon: TrendingUp  },
];

const managementNavItems: NavItem[] = [
  { href: "/staff",    label: "Staff",    icon: UserCircle },
  { href: "/settings", label: "Settings", icon: Settings   },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar} aria-label="Main navigation">

      {/* ─── Logo ─────────────────────────────────────────────── */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Eye size={16} color="#0D1117" strokeWidth={2.5} />
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoName}>EYE</span>
          <span className={styles.logoSub}>Dashboard</span>
        </div>
      </div>

      {/* ─── Navigation ───────────────────────────────────────── */}
      <nav className={styles.nav} aria-label="Primary navigation">
        {mainNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active indicator bar */}
              {isActive && <span className={styles.activeBar} aria-hidden="true" />}
              <Icon
                size={16}
                strokeWidth={isActive ? 2.2 : 1.8}
                className={styles.navIcon}
              />
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}

        <div className={styles.sectionLabel} aria-hidden="true">Management</div>

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
              {isActive && <span className={styles.activeBar} aria-hidden="true" />}
              <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} className={styles.navIcon} />
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ─── User Section ─────────────────────────────────────── */}
      {/* Phase 2: this pulls name/role from the auth session */}
      <div className={styles.userSection}>
        <div className={styles.userAvatar} aria-hidden="true">
          {/* Shows user initials — dynamic in Phase 2 */}
          <UserCircle size={18} strokeWidth={1.5} />
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>Your Account</div>
          <div className={styles.userRole}>Sign in to continue</div>
        </div>
        <button className={styles.logoutBtn} title="Sign out" aria-label="Sign out">
          <LogOut size={14} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  );
}
