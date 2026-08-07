import type { AtelierAlert } from "@/lib/mockData";
import styles from "./AtelierAlerts.module.css";
import { Zap, Package, Star } from "lucide-react";

interface Props {
  alerts: AtelierAlert[];
}

const ALERT_ICONS = {
  restock: Package,
  vvip: Star,
  info: Zap,
};

export default function AtelierAlerts({ alerts }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Atelier Alerts</h3>
        <Zap size={16} color="var(--color-gold)" />
      </div>

      <div className={styles.list}>
        {alerts.map((alert) => {
          const Icon = ALERT_ICONS[alert.type];
          return (
            <div key={alert.id} className={styles.alertItem}>
              <div className={styles.alertIcon}>
                <Icon size={16} color="var(--color-gold)" />
              </div>
              <div className={styles.alertContent}>
                <p className={styles.alertTitle}>{alert.title}</p>
                <p className={styles.alertDesc}>{alert.description}</p>
                {alert.actionLabel && (
                  <button className={styles.alertAction} type="button">
                    {alert.actionLabel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
