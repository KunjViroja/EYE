"use client";

import { useState, useEffect } from "react";
import { getInsightsData } from "@/app/actions/insights";
import StatCard from "@/components/insights/StatCard";
import RevenueChart from "@/components/insights/RevenueChart";
import CollectionMixChart from "@/components/insights/CollectionMixChart";
import RecentSales from "@/components/insights/RecentSales";
import AtelierAlerts from "@/components/insights/AtelierAlerts";
import shellStyles from "@/components/layout/AppShell.module.css";
import styles from "./InsightsPage.module.css";
import { mockRevenueData, mockCollectionMix, StatCardData } from "@/lib/mockData";
import { RefreshCw } from "lucide-react";

const TIME_FILTERS = ["Monthly", "Weekly", "Daily"] as const;

export default function InsightsPage() {
  const [activeFilter, setActiveFilter] = useState<"Monthly" | "Weekly" | "Daily">("Weekly");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<StatCardData[]>([
    { id: "gross-revenue", label: "Gross Revenue", value: "$142,850", change: 12.4, changeLabel: "+12.4%", trend: "up", icon: "dollar" },
    { id: "total-sales", label: "Total Sales", value: "312", change: 5.2, changeLabel: "+5.2%", trend: "up", icon: "bag" },
    { id: "avg-boutique-value", label: "Avg. Boutique Value", value: "$458", change: 0, changeLabel: "Stable", trend: "stable", icon: "sparkles" },
    { id: "new-clients", label: "New Clients", value: "42", change: 18, changeLabel: "+18%", trend: "up", icon: "users" },
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
            change: 12.4,
            changeLabel: "+12.4%",
            trend: "up",
            icon: "dollar",
          },
          {
            id: "total-sales",
            label: "Total Sales",
            value: res.data.totalSalesCount.toString(),
            change: 5.2,
            changeLabel: "+5.2%",
            trend: "up",
            icon: "bag",
          },
          {
            id: "avg-boutique-value",
            label: "Avg. Boutique Value",
            value: `$${res.data.avgBoutiqueValue.toLocaleString()}`,
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
        ]);

        if (res.data.recentSales.length > 0) {
          setRecentSales(res.data.recentSales);
        }

        if (res.data.alerts.length > 0) {
          setAlerts(res.data.alerts);
        }
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
            Welcome back, here&apos;s your live atelier performance from Supabase
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
        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <StatCard key={stat.id} data={stat} animationDelay={index * 80} />
          ))}
        </div>

        {/* Charts Row */}
        <div className={styles.chartsRow}>
          <RevenueChart data={mockRevenueData} />
          <CollectionMixChart data={mockCollectionMix} />
        </div>

        {/* Bottom Row */}
        <div className={styles.bottomRow}>
          <RecentSales sales={recentSales} />
          <AtelierAlerts alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
