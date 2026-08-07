import type { RecentSale } from "@/lib/mockData";
import styles from "./RecentSales.module.css";
import Link from "next/link";

interface Props {
  sales: RecentSale[];
}

const STATUS_CLASS: Record<RecentSale["status"], string> = {
  Completed: styles.statusCompleted,
  Processing: styles.statusProcessing,
  Pending: styles.statusPending,
};

export default function RecentSales({ sales }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Recent Sales</h3>
        <Link href="/pos" className={styles.viewAll}>View Ledger</Link>
      </div>

      <div className={styles.list}>
        {sales.map((sale) => (
          <div key={sale.id} className={styles.saleRow}>
            {/* Client initials avatar */}
            <div className={styles.avatar} aria-hidden="true">
              {sale.clientInitials}
            </div>

            <div className={styles.info}>
              <span className={styles.clientName}>{sale.clientName}</span>
              <span className={styles.product}>{sale.product}</span>
            </div>

            <div className={styles.right}>
              <span className={styles.amount}>${sale.amount.toLocaleString()}.00</span>
              <span className={`${styles.status} ${STATUS_CLASS[sale.status]}`}>
                {sale.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
