import type { Metadata } from "next";
import shellStyles from "@/components/layout/AppShell.module.css";
import styles from "./AnalyticsPage.module.css";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <div>
      <div className={shellStyles.pageHeader}>
        <div className={shellStyles.pageHeaderLeft}>
          <h1 className={shellStyles.pageTitle}>Analytics</h1>
          <p className={shellStyles.pageSubtitle}>Deep-dive performance reports and trend analysis.</p>
        </div>
      </div>
      <div className={shellStyles.pageBody}>
        <div className={styles.comingSoon}>
          <div className={styles.comingSoonIcon}>📊</div>
          <h2 className={styles.comingSoonTitle}>Advanced Analytics</h2>
          <p className={styles.comingSoonText}>
            Detailed analytics, forecasting, and AI-powered insights are coming in Phase 3.
            <br />
            This will connect to the Python FastAPI backend for ML-powered predictions.
          </p>
          <div className={styles.phaseTag}>PHASE 3</div>
        </div>
      </div>
    </div>
  );
}
