"use client";

import dynamic from "next/dynamic";
import { InsightsCards } from "@/components/insights/insights-cards";
import { HeatmapSkeleton } from "@/components/ui/page-skeletons";
import { useT } from "@/lib/i18n/LanguageContext";
import type { HeatmapRow, InsightCard } from "@/lib/insights/types";

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
  const { t } = useT();

  const isEmpty = cards.length === 0;

  return (
    <div className={isEmpty ? "view-stack view-stack-fill" : "view-stack"}>
      <section className={isEmpty ? "panel empty-state-panel" : "panel"}>
        {!isEmpty ? (
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t("insights.eyebrow")}</p>
              <h2>{t("insights.title")}</h2>
            </div>
          </div>
        ) : null}
        <InsightsCards cards={cards} />
      </section>

      {showHeatmap ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t("insights.busyHours")}</p>
              <h2>{t("insights.heatmap")}</h2>
            </div>
          </div>
          <InsightsHeatmap rows={heatmapRows} />
        </section>
      ) : null}
    </div>
  );
}
