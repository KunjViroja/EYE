"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import ProductTour from "@/components/onboarding/ProductTour";
import styles from "./AppShell.module.css";

const STANDALONE_ROUTES = [
  "/login",
  "/register",
  "/verify-email",
  "/welcome",
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If on login, register, verify-email, or welcome onboarding, do not render Sidebar & Topbar
  const isStandalonePage = STANDALONE_ROUTES.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`)
  );

  if (isStandalonePage) {
    return <div className={styles.standaloneContent}>{children}</div>;
  }

  return (
    <div className={styles.appShell}>
      {/* Interactive Feature Spotlight Tour */}
      <Suspense fallback={null}>
        <ProductTour />
      </Suspense>

      {/* Sidebar — visible on dashboard pages */}
      <Sidebar />

      {/* Right side: Topbar + page content */}
      <div className={styles.rightPane}>
        {/* Topbar — sticky across dashboard pages */}
        <Topbar />

        {/* Page content area */}
        <main className={styles.mainContent} id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
