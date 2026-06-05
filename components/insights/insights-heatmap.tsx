"use client";

import { Fragment, memo, useMemo } from "react";
import { heatmapRows } from "@/lib/command-center/mock-modules";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function heatLevel(value: number): string {
  const t = Math.min(1, value / 65);
  if (t < 0.2) return "var(--mint-soft)";
  if (t < 0.45) return "#b8e6d4";
  if (t < 0.7) return "#6bc9a8";
  return "var(--mint)";
}

function heatText(value: number): string {
  const t = Math.min(1, value / 65);
  return t >= 0.45 ? "#fff" : "var(--ink)";
}

function InsightsHeatmapInner() {
  const rows = useMemo(() => heatmapRows, []);

  return (
    <div className="heatmap">
      <div className="heat-cell heat-label" />
      {days.map((day) => (
        <div key={day} className="heat-cell heat-label">
          {day}
        </div>
      ))}
      {rows.map((row) => (
        <HeatmapRow key={row.time} row={row} />
      ))}
    </div>
  );
}

const HeatmapRow = memo(function HeatmapRow({
  row,
}: {
  row: (typeof heatmapRows)[number];
}) {
  return (
    <Fragment>
      <div className="heat-cell heat-label">{row.time}</div>
      {row.values.map((value, index) => (
        <div
          key={`${row.time}-${days[index]}`}
          className="heat-cell"
          style={{
            background: heatLevel(value),
            color: heatText(value),
          }}
        >
          {value}
        </div>
      ))}
    </Fragment>
  );
});

export const InsightsHeatmap = memo(InsightsHeatmapInner);
