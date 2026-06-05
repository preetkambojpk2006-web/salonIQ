import { aiInsightCards } from "@/lib/command-center/mock-modules";
import dynamic from "next/dynamic";
import { HeatmapSkeleton } from "@/components/ui/page-skeletons";

const InsightsHeatmap = dynamic(
  () =>
    import("@/components/insights/insights-heatmap").then((m) => m.InsightsHeatmap),
  {
    loading: () => <HeatmapSkeleton />,
    ssr: false,
  }
);

export default function InsightsPage() {
  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">AI business intelligence</p>
            <h2>Simple insights, direct actions</h2>
          </div>
        </div>
        <div className="insights-board stagger-list">
          {aiInsightCards.map((insight) => (
            <article key={insight.title} className="insight-card-ref">
              <span className="tag green">AI suggestion</span>
              <h3 style={{ marginTop: 12, fontSize: 17, fontWeight: 800 }}>
                {insight.title}
              </h3>
              <p className="text-body" style={{ marginTop: 8 }}>
                {insight.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Busy hours</p>
            <h2>Demand heatmap</h2>
          </div>
        </div>
        <InsightsHeatmap />
      </section>
    </div>
  );
}
