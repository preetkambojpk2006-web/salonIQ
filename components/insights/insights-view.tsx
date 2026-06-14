"use client";

import dynamic from "next/dynamic";
import { InsightsCards } from "@/components/insights/insights-cards";
import { HeatmapSkeleton } from "@/components/ui/page-skeletons";
import type { HeatmapRow, InsightCard } from "@/lib/insights/queries";

const InsightsHeatmap = dynamic(
  () =>
    import("@/components/insights/insights-heatmap").then((m) => m.InsightsHeatmap),
  {
    loading: () => <HeatmapSkeleton />,
    ssr: false,
  }
);

type InsightsViewProps = {
  cards: InsightCard[];
  heatmapRows: HeatmapRow[];
  showHeatmap: boolean;
};

export function InsightsView({
  cards,
  heatmapRows,
  showHeatmap,
}: InsightsViewProps) {
  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">AI business intelligence</p>
            <h2>Simple insights, direct actions</h2>
          </div>
        </div>
        <InsightsCards cards={cards} />
      </section>

      {showHeatmap ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Busy hours</p>
              <h2>Demand heatmap</h2>
            </div>
          </div>
          <InsightsHeatmap rows={heatmapRows} />
        </section>
      ) : null}
    </div>
  );
}
