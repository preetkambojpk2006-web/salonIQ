"use client";

import { Fragment, memo, useMemo } from "react";
import type { HeatmapRow } from "@/lib/insights/types";
import { useT } from "@/lib/i18n/LanguageContext";

const dayKeys = [
  "heatmap.mon",
  "heatmap.tue",
  "heatmap.wed",
  "heatmap.thu",
  "heatmap.fri",
  "heatmap.sat",
  "heatmap.sun",
] as const;

type InsightsHeatmapProps = {
  rows: HeatmapRow[];
};

function heatLevel(value: number, maxValue: number): string {
  const max = Math.max(maxValue, 1);
  const t = Math.min(1, value / max);
  if (t < 0.2) return "var(--mint-soft)";
  if (t < 0.45) return "#b8e6d4";
  if (t < 0.7) return "#6bc9a8";
  return "var(--mint)";
}

function heatText(value: number, maxValue: number): string {
  const max = Math.max(maxValue, 1);
  const t = Math.min(1, value / max);
  return t >= 0.45 ? "#fff" : "var(--ink)";
}

function InsightsHeatmapInner({ rows }: InsightsHeatmapProps) {
  const { t } = useT();
  const maxValue = useMemo(
    () => Math.max(...rows.flatMap((row) => row.values), 1),
    [rows]
  );

  return (
    <div className="heatmap">
      <div className="heat-cell heat-label" />
      {dayKeys.map((dayKey) => (
        <div key={dayKey} className="heat-cell heat-label">
          {t(dayKey)}
        </div>
      ))}
      {rows.map((row) => (
        <HeatmapRow key={row.time} row={row} maxValue={maxValue} />
      ))}
    </div>
  );
}

const HeatmapRow = memo(function HeatmapRow({
  row,
  maxValue,
}: {
  row: HeatmapRow;
  maxValue: number;
}) {
  return (
    <Fragment>
      <div className="heat-cell heat-label">{row.time}</div>
      {row.values.map((value, index) => (
        <div
          key={`${row.time}-${dayKeys[index]}`}
          className="heat-cell"
          style={{
            background: heatLevel(value, maxValue),
            color: heatText(value, maxValue),
          }}
        >
          {value}
        </div>
      ))}
    </Fragment>
  );
});

export const InsightsHeatmap = memo(InsightsHeatmapInner);
