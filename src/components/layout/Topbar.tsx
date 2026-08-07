"use client";

import { useState, useEffect } from "react";
import { Bell, Search } from "lucide-react";
import styles from "./Topbar.module.css";

export default function Topbar() {
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const format = () =>
      new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

    setDateStr(format());
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
          <span className={styles.badge} aria-hidden="true">2</span>
        </button>

        <span className={styles.divider} aria-hidden="true" />

        {/* Live Supabase connection indicator */}
        <div className={styles.sessionPill} title="Connected to live Supabase PostgreSQL database">
          <span className={styles.sessionDot} />
          <span className={styles.sessionLabel}>Supabase Connected</span>
        </div>
      </div>
    </header>
  );
}
