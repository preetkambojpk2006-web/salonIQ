import { InsightsView } from "@/components/insights/insights-view";
import { getInsightsDashboardData } from "@/lib/insights/queries";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const data = await getInsightsDashboardData();

  return (
    <InsightsView
      cards={data.cards}
      heatmapRows={data.heatmapRows}
      showHeatmap={data.showHeatmap}
    />
  );
}
