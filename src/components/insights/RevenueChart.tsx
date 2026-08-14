"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import styles from "./RevenueChart.module.css";
import { TrendingUp } from "lucide-react";
import { saasConfig } from "@/config/saasConfig";

export interface RevenueDataPoint {
  day: string;
  designerFrames: number;
  bespokeLenses: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className={styles.tooltipValue}>
          {entry.name}: {saasConfig.currency}{entry.value.toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  );
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const hasNonZeroData = data.some(
    (d) => d.designerFrames > 0 || d.bespokeLenses > 0
  );

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Revenue Stream</h3>
          <p className={styles.subtitle}>Boutique performance across luxury categories</p>
        </div>
      </div>

      <div className={styles.chartWrap}>
        {!hasNonZeroData && data.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "180px", color: "var(--color-text-muted)", fontSize: "13px", gap: "8px" }}>
            <TrendingUp size={24} strokeWidth={1.5} opacity={0.5} />
            <span>No live transactions recorded yet. Process a POS sale to see live charts.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                tickFormatter={(v) => `${saasConfig.currency}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{value}</span>
                )}
              />
              <Area
                type="monotone"
                dataKey="designerFrames"
                name="Designer Frames"
                stroke="var(--color-gold)"
                strokeWidth={2}
                fill="var(--color-gold-muted)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="bespokeLenses"
                name="Bespoke Lenses"
                stroke="var(--color-navy)"
                strokeWidth={2}
                strokeDasharray="5 3"
                fill="transparent"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
