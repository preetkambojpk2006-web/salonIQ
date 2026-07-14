"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TopServicePoint } from "@/lib/dashboard/analytics-queries";
import { useT } from "@/lib/i18n/LanguageContext";

const ACCENT_GREEN = "#1FA873";
const MUTED = "#8A8A8A";
const INK = "#1A1A1A";

function truncateLabel(value: string, max = 14): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

type TopServicesChartProps = {
  data: TopServicePoint[];
};

export function TopServicesChart({ data }: TopServicesChartProps) {
  const { t } = useT();

  if (data.length === 0) {
    return (
      <p className="business-pulse-empty">{t("dashboard.noDataYet")}</p>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    shortName: truncateLabel(item.name),
  }));

  return (
    <div className="business-pulse-chart">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
        >
          <CartesianGrid stroke="#E0DAD0" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: MUTED, fontSize: 12, fontWeight: 700 }}
            axisLine={{ stroke: "#E0DAD0" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            width={88}
            tick={{ fill: MUTED, fontSize: 12, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [Number(value ?? 0), t("dashboard.topServices")]}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as TopServicePoint | undefined;
              return row?.name ?? "";
            }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #E0DAD0",
              background: "#F9F8F3",
              color: INK,
              fontSize: 13,
              fontWeight: 700,
            }}
          />
          <Bar dataKey="count" fill={ACCENT_GREEN} radius={[0, 6, 6, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
