"use client";
// Recharts uses browser APIs — must be a client component

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
import type { RevenueDataPoint } from "@/lib/mockData";
import styles from "./RevenueChart.module.css";

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

// Custom tooltip that appears when hovering over the chart
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
          {entry.name}: ${entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Revenue Stream</h3>
          <p className={styles.subtitle}>Boutique performance across luxury categories</p>
        </div>
      </div>

      {/* ResponsiveContainer makes the chart fill its parent width automatically */}
      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            {/* Background grid lines */}
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />

            {/* X axis — days of the week */}
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            />

            {/* Y axis — dollar amounts */}
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{value}</span>
              )}
            />

            {/* Designer Frames — gold filled area */}
            <Area
              type="monotone"
              dataKey="designerFrames"
              name="Designer Frames"
              stroke="var(--color-gold)"
              strokeWidth={2}
              fill="var(--color-gold-muted)"
              dot={false}
            />

            {/* Bespoke Lenses — dashed navy line */}
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
      </div>
    </div>
  );
}
