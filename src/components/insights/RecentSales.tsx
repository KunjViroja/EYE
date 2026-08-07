import styles from "./RecentSales.module.css";
import Link from "next/link";

export interface RecentSaleItem {
  id: string;
  clientName: string;
  clientInitials: string;
  product: string;
  amount: number;
  status: "Completed" | "Processing" | "Pending";
}

interface Props {
  sales: RecentSaleItem[];
}

const STATUS_CLASS: Record<RecentSaleItem["status"], string> = {
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
        {sales.length === 0 ? (
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", padding: "16px 0", textAlign: "center" }}>
            No sales recorded yet. Process a POS transaction to update sales ledger.
          </div>
        ) : (
          sales.map((sale) => (
            <div key={sale.id} className={styles.saleRow}>
              <div className={styles.avatar} aria-hidden="true">
                {sale.clientInitials}
              </div>

              <div className={styles.info}>
                <span className={styles.clientName}>{sale.clientName}</span>
                <span className={styles.product}>{sale.product}</span>
              </div>

              <div className={styles.right}>
                <span className={styles.amount}>${sale.amount.toLocaleString()}.00</span>
                <span className={`${styles.status} ${STATUS_CLASS[sale.status] || styles.statusCompleted}`}>
                  {sale.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
