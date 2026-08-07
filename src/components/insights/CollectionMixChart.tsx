"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import styles from "./CollectionMixChart.module.css";
import { Package } from "lucide-react";

export interface CollectionMixItem {
  name: string;
  percentage: number;
  color: string;
}

interface Props {
  data: CollectionMixItem[];
}

export default function CollectionMixChart({ data }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Collection Mix</h3>
        <p className={styles.subtitle}>Sales by luxury tier</p>
      </div>

      <div className={styles.chartWrap}>
        {data.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "180px", color: "var(--color-text-muted)", fontSize: "13px", gap: "8px" }}>
            <Package size={24} strokeWidth={1.5} opacity={0.5} />
            <span>No category data yet.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="percentage"
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [`${value ?? 0}%`, ""]}
                contentStyle={{
                  background: "var(--color-navy)",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  color: "white",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      {data.length > 0 && (
        <div className={styles.legend}>
          {data.map((item) => (
            <div key={item.name} className={styles.legendItem}>
              <div className={styles.legendDot} style={{ backgroundColor: item.color }} />
              <span className={styles.legendName}>{item.name}</span>
              <span className={styles.legendPct}>{item.percentage}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
