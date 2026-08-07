import styles from "./AtelierAlerts.module.css";
import { Zap, Package, Star } from "lucide-react";

export interface AtelierAlertItem {
  id: string;
  type: "restock" | "vvip" | "info";
  title: string;
  description: string;
  actionLabel?: string;
}

interface Props {
  alerts: AtelierAlertItem[];
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
        {alerts.length === 0 ? (
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", padding: "12px 0" }}>
            No active alerts at this time.
          </div>
        ) : (
          alerts.map((alert) => {
            const Icon = ALERT_ICONS[alert.type] || Zap;
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
          })
        )}
      </div>
    </div>
  );
}
