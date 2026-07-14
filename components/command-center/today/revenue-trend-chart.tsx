"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenueTrendPoint } from "@/lib/dashboard/analytics-queries";
import { formatInr } from "@/lib/format/currency";
import { useT } from "@/lib/i18n/LanguageContext";

const ACCENT_GREEN = "#1FA873";
const MUTED = "#8A8A8A";
const INK = "#1A1A1A";

function formatAxisAmount(value: number): string {
  if (value >= 100000) {
    return `₹${Math.round(value / 100000)}L`;
  }
  if (value >= 1000) {
    return `₹${Math.round(value / 1000)}k`;
  }
  return `₹${value}`;
}

type RevenueTrendChartProps = {
  data: RevenueTrendPoint[];
};

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const { t } = useT();
  const hasData = data.some((point) => point.amount > 0);

  if (!hasData) {
    return (
      <p className="business-pulse-empty">{t("dashboard.noDataYet")}</p>
    );
  }

  return (
    <div className="business-pulse-chart">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#E0DAD0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: MUTED, fontSize: 12, fontWeight: 700 }}
            axisLine={{ stroke: "#E0DAD0" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatAxisAmount}
            tick={{ fill: MUTED, fontSize: 12, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            formatter={(value) => [
              formatInr(Number(value ?? 0)),
              t("dashboard.revenueTrend"),
            ]}
            labelFormatter={(label) => String(label)}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #E0DAD0",
              background: "#F9F8F3",
              color: INK,
              fontSize: 13,
              fontWeight: 700,
            }}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke={ACCENT_GREEN}
            strokeWidth={2.5}
            dot={{ r: 4, fill: ACCENT_GREEN, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: ACCENT_GREEN, stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
