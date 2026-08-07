// StatCard — displays a single metric (revenue, sales count, etc.)
// This is a "dumb" component — it only displays what it receives via props.
// It doesn't fetch data or manage state. Just pure UI.

import type { StatCardData } from "@/lib/mockData";
import styles from "./StatCard.module.css";

// Icon mapping — maps our string icon names to emoji symbols
// In Phase 2 you could swap these for real SVG icons
const ICONS: Record<string, string> = {
  dollar: "💰",
  bag: "🛍️",
  sparkles: "✨",
  users: "👥",
};

// Props — what data this component REQUIRES to render
interface StatCardProps {
  data: StatCardData;
}

export default function StatCard({ data }: StatCardProps) {
  // Determine which CSS class to apply based on trend
  const badgeClass =
    data.trend === "up"
      ? styles.badgeUp
      : data.trend === "down"
        ? styles.badgeDown
        : styles.badgeStable;

  return (
    <article className={styles.card} aria-label={`${data.label}: ${data.value}`}>
      <div className={styles.cardHeader}>
        <div className={styles.iconWrap} aria-hidden="true">
          {ICONS[data.icon] ?? "📊"}
        </div>
        <span className={`${styles.badge} ${badgeClass}`}>
          {data.changeLabel}
        </span>
      </div>

      <div>
        <div className={styles.value}>{data.value}</div>
        <div className={styles.label}>{data.label}</div>
      </div>
    </article>
  );
}
