import { DollarSign, ShoppingBag, Gem, Users, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { StatCardItem } from "@/app/insights/page";
import styles from "./StatCard.module.css";

const ICON_MAP = {
  dollar:   DollarSign,
  bag:      ShoppingBag,
  sparkles: Gem,
  users:    Users,
} as const;

interface StatCardProps {
  data: StatCardItem;
  animationDelay?: number;
}

export default function StatCard({ data, animationDelay = 0 }: StatCardProps) {
  const Icon = ICON_MAP[data.icon as keyof typeof ICON_MAP] ?? DollarSign;

  const TrendIcon =
    data.trend === "up"   ? TrendingUp   :
    data.trend === "down" ? TrendingDown :
    Minus;

  const badgeClass =
    data.trend === "up"   ? styles.badgeUp   :
    data.trend === "down" ? styles.badgeDown :
    styles.badgeStable;

  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${animationDelay}ms` }}
      aria-label={`${data.label}: ${data.value}`}
    >
      <div className={styles.cardHeader}>
        <div className={styles.iconWrap} aria-hidden="true">
          <Icon size={18} strokeWidth={1.8} className={styles.icon} />
        </div>

        <span className={`${styles.badge} ${badgeClass}`}>
          <TrendIcon size={10} strokeWidth={2.5} />
          {data.changeLabel}
        </span>
      </div>

      <div className={styles.valueArea}>
        <div className={styles.value}>{data.value}</div>
        <div className={styles.label}>{data.label}</div>
      </div>
    </article>
  );
}
