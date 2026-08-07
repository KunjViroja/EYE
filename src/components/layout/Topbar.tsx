"use client";

import { useState, useEffect } from "react";
import { Bell, Search } from "lucide-react";
import styles from "./Topbar.module.css";

export default function Topbar() {
  // Live clock — updates every minute
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    // Format: "Thursday, 7 August 2026"
    const format = () =>
      new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

    setDateStr(format());

    // Update at the start of every minute
    const timer = setInterval(() => setDateStr(format()), 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className={styles.topbar} role="banner">
      {/* Left: Current date */}
      <div className={styles.dateArea}>
        <span className={styles.date}>{dateStr}</span>
      </div>

      {/* Center: Global search */}
      <div className={styles.searchWrap}>
        <Search size={14} className={styles.searchIcon} aria-hidden="true" />
        <input
          type="search"
          placeholder="Search clients, products, orders…"
          className={styles.searchInput}
          id="global-search"
          aria-label="Global search"
        />
        <kbd className={styles.searchKbd}>⌘K</kbd>
      </div>

      {/* Right: Actions */}
      <div className={styles.actions}>
        {/* Notification bell */}
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Notifications (2 unread)"
          title="Notifications"
          id="topbar-notifications"
        >
          <Bell size={17} strokeWidth={1.8} />
          {/* Unread badge */}
          <span className={styles.badge} aria-hidden="true">2</span>
        </button>

        {/* Divider */}
        <span className={styles.divider} aria-hidden="true" />

        {/* Session status indicator */}
        <div className={styles.sessionPill} title="Phase 2: Real auth coming soon">
          <span className={styles.sessionDot} />
          <span className={styles.sessionLabel}>Demo Mode</span>
        </div>
      </div>
    </header>
  );
}
