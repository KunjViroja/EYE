// ─── Insights Page ────────────────────────────────────────────────────────────
// This is a SERVER COMPONENT (no "use client") — it runs on the server.
// Server components can be async and fetch data directly. No useEffect needed!
// The data fetching happens BEFORE the page reaches the browser.

import type { Metadata } from "next";
import {
  mockStats,
  mockRevenueData,
  mockCollectionMix,
  mockRecentSales,
  mockAlerts,
} from "@/lib/mockData";

// Page-level components
import StatCard from "@/components/insights/StatCard";
import RevenueChart from "@/components/insights/RevenueChart";
import CollectionMixChart from "@/components/insights/CollectionMixChart";
import RecentSales from "@/components/insights/RecentSales";
import AtelierAlerts from "@/components/insights/AtelierAlerts";

// Layout helpers
import shellStyles from "@/components/layout/AppShell.module.css";
import styles from "./InsightsPage.module.css";

// ─── SEO for this page ────────────────────────────────────────────────────────
// This merges with the root layout's metadata — produces "Insights | Lumina Atelier"
export const metadata: Metadata = {
  title: "Insights",
};

// ─── Time filter options ──────────────────────────────────────────────────────
const TIME_FILTERS = ["Monthly", "Weekly", "Daily"] as const;

export default function InsightsPage() {
  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={shellStyles.pageHeader}>
        <div className={shellStyles.pageHeaderLeft}>
          <h1 className={shellStyles.pageTitle}>Executive Insights</h1>
          <p className={shellStyles.pageSubtitle}>
            Welcome back, here&apos;s what&apos;s happening at the Atelier
          </p>
        </div>

        {/* Time Filter Tabs */}
        <div className={shellStyles.pageHeaderRight}>
          {TIME_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`${styles.timeTab} ${filter === "Weekly" ? styles.timeTabActive : ""}`}
              aria-pressed={filter === "Weekly"}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Page Body */}
      <div className={shellStyles.pageBody}>
        {/* Stats Grid — 4 metric cards */}
        <div className={styles.statsGrid}>
          {mockStats.map((stat) => (
            <StatCard key={stat.id} data={stat} />
          ))}
        </div>

        {/* Charts Row — Revenue Stream + Collection Mix */}
        <div className={styles.chartsRow}>
          <RevenueChart data={mockRevenueData} />
          <CollectionMixChart data={mockCollectionMix} />
        </div>

        {/* Bottom Row — Recent Sales + Atelier Alerts */}
        <div className={styles.bottomRow}>
          <RecentSales sales={mockRecentSales} />
          <AtelierAlerts alerts={mockAlerts} />
        </div>
      </div>
    </div>
  );
}
