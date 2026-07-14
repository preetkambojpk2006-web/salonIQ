"use client";

import dynamic from "next/dynamic";
import { TrendingUp } from "lucide-react";
import { RevenueTrendChart } from "@/components/command-center/today/revenue-trend-chart";
import { TopServicesChart } from "@/components/command-center/today/top-services-chart";
import { HeatmapSkeleton } from "@/components/ui/page-skeletons";
import type { DashboardAnalyticsData } from "@/lib/dashboard/analytics-queries";
import { useT } from "@/lib/i18n/LanguageContext";

const InsightsHeatmap = dynamic(
  () =>
    import("@/components/insights/insights-heatmap").then(
      (module) => module.InsightsHeatmap
    ),
  {
    loading: () => <HeatmapSkeleton />,
    ssr: false,
  }
);

type BusinessPulseProps = {
  analytics: DashboardAnalyticsData;
};

export function BusinessPulse({ analytics }: BusinessPulseProps) {
  const { t } = useT();
  const { revenueTrend, topServices, heatmapRows, showHeatmap } = analytics;

  return (
    <section className="panel business-pulse-section">
      <div className="panel-header">
        <div>
          <h2 className="business-pulse-heading">
            <TrendingUp size={16} strokeWidth={1.5} aria-hidden />
            {t("dashboard.businessPulse")}
          </h2>
        </div>
      </div>

      <div className="business-pulse-grid">
        <article className="panel business-pulse-card business-pulse-card-wide">
          <h3 className="business-pulse-card-title">{t("dashboard.revenueTrend")}</h3>
          <RevenueTrendChart data={revenueTrend} />
        </article>

        <article className="panel business-pulse-card">
          <h3 className="business-pulse-card-title">{t("dashboard.topServices")}</h3>
          <TopServicesChart data={topServices} />
        </article>

        <article className="panel business-pulse-card business-pulse-card-full">
          <h3 className="business-pulse-card-title">{t("dashboard.busyHours")}</h3>
          {showHeatmap ? (
            <InsightsHeatmap rows={heatmapRows} />
          ) : (
            <p className="business-pulse-empty">{t("dashboard.noDataYet")}</p>
          )}
        </article>
      </div>
    </section>
  );
}
