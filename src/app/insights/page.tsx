"use client";

import { useState, useEffect } from "react";
import { getInsightsData } from "@/app/actions/insights";
import StatCard from "@/components/insights/StatCard";
import RevenueChart from "@/components/insights/RevenueChart";
import CollectionMixChart from "@/components/insights/CollectionMixChart";
import RecentSales from "@/components/insights/RecentSales";
import EyeAlerts from "@/components/insights/EyeAlerts";
import shellStyles from "@/components/layout/AppShell.module.css";
import styles from "./InsightsPage.module.css";
import { RefreshCw } from "lucide-react";

export interface StatCardItem {
  id: string;
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  trend: "up" | "down" | "stable";
  icon: "dollar" | "bag" | "sparkles" | "users";
}

const TIME_FILTERS = ["Monthly", "Weekly", "Daily"] as const;

export default function InsightsPage() {
  const [activeFilter, setActiveFilter] = useState<"Monthly" | "Weekly" | "Daily">("Weekly");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<StatCardItem[]>([
    { id: "gross-revenue", label: "Gross Revenue", value: "$0", change: 0, changeLabel: "Live", trend: "stable", icon: "dollar" },
    { id: "total-sales", label: "Total Sales", value: "0", change: 0, changeLabel: "Live", trend: "stable", icon: "bag" },
    { id: "avg-boutique-value", label: "Avg. Boutique Value", value: "$0", change: 0, changeLabel: "Live", trend: "stable", icon: "sparkles" },
    { id: "new-clients", label: "New Clients", value: "0", change: 0, changeLabel: "Live", trend: "stable", icon: "users" },
  ]);

  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    async function loadLiveInsights() {
      setLoading(true);
      const res = await getInsightsData();
      if (res.success && res.data) {
        setStats([
          {
            id: "gross-revenue",
            label: "Gross Revenue",
            value: `$${res.data.grossRevenue.toLocaleString()}`,
            change: 0,
            changeLabel: "Live",
            trend: res.data.grossRevenue > 0 ? "up" : "stable",
            icon: "dollar",
          },
          {
            id: "total-sales",
            label: "Total Sales",
            value: res.data.totalSalesCount.toString(),
            change: 0,
            changeLabel: "Live",
            trend: res.data.totalSalesCount > 0 ? "up" : "stable",
            icon: "bag",
          },
          {
            id: "avg-boutique-value",
            label: "Avg. Boutique Value",
            value: `$${res.data.avgBoutiqueValue.toLocaleString()}`,
            change: 0,
            changeLabel: "Live",
            trend: "stable",
            icon: "sparkles",
          },
          {
            id: "new-clients",
            label: "New Clients",
            value: res.data.recentSales.length.toString(),
            change: 0,
            changeLabel: "Live",
            trend: "stable",
            icon: "users",
          },
        ]);

        setRecentSales(res.data.recentSales || []);
        setAlerts(res.data.alerts || []);
      }
      setLoading(false);
    }

    loadLiveInsights();
  }, []);

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={shellStyles.pageHeader}>
        <div className={shellStyles.pageHeaderLeft}>
          <h1 className={shellStyles.pageTitle}>Executive Insights</h1>
          <p className={shellStyles.pageSubtitle}>
            Welcome back, here&apos;s your live EYE performance dashboard
          </p>
        </div>

        {/* Time Filter Tabs */}
        <div className={shellStyles.pageHeaderRight}>
          {TIME_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`${styles.timeTab} ${filter === activeFilter ? styles.timeTabActive : ""}`}
              onClick={() => setActiveFilter(filter)}
              aria-pressed={filter === activeFilter}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Page Body */}
      <div className={shellStyles.pageBody}>
        {loading ? (
          <div className={styles.loadingState}>
            <RefreshCw size={24} className={styles.spin} />
            <span>Calculating live metrics…</span>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className={styles.statsGrid}>
              {stats.map((stat, index) => (
                <StatCard key={stat.id} data={stat} animationDelay={index * 80} />
              ))}
            </div>

            {/* Charts Row */}
            <div className={styles.chartsRow}>
              <RevenueChart data={[]} />
              <CollectionMixChart data={[]} />
            </div>

            {/* Bottom Row */}
            <div className={styles.bottomRow}>
              <RecentSales sales={recentSales} />
              <EyeAlerts alerts={alerts} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
