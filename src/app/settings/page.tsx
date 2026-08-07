"use client";

import { useSession } from "next-auth/react";
import shellStyles from "@/components/layout/AppShell.module.css";
import styles from "./SettingsPage.module.css";
import { Database, ShieldCheck, User } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div>
      <div className={shellStyles.pageHeader}>
        <div className={shellStyles.pageHeaderLeft}>
          <h1 className={shellStyles.pageTitle}>EYE Settings</h1>
          <p className={shellStyles.pageSubtitle}>
            Manage account credentials and system connection status.
          </p>
        </div>
      </div>

      <div className={shellStyles.pageBody}>
        {/* Profile Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.title}>Account Overview</h2>
              <p className={styles.subtitle}>Current logged-in executive session</p>
            </div>
            <User size={20} color="var(--color-gold-dark)" />
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Account Name</span>
            <span className={styles.infoValue}>{session?.user?.name || "Manager"}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Email Address</span>
            <span className={styles.infoValue}>{session?.user?.email || "No email"}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Role Permissions</span>
            <span className={styles.infoValue}>{(session?.user as any)?.role || "MANAGER"}</span>
          </div>
        </div>

        {/* Database Status Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.title}>Database Status</h2>
              <p className={styles.subtitle}>Live Enterprise Cloud Connection</p>
            </div>
            <ShieldCheck size={20} color="var(--color-success)" />
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Database Engine</span>
            <span className={styles.infoValue}>Enterprise Cloud Database</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Connection Security</span>
            <span className={styles.infoValue}>TLS/SSL Encrypted (Port 5432)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
