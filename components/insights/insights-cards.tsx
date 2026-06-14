import type { InsightCard } from "@/lib/insights/queries";

type InsightsCardsProps = {
  cards: InsightCard[];
};

export function InsightsCards({ cards }: InsightsCardsProps) {
  if (cards.length === 0) {
    return (
      <p className="text-body" style={{ color: "var(--muted)" }}>
        Abhi koi actionable insight nahi — bookings aur payments ke baad yahan
        suggestions dikhengi.
      </p>
    );
  }

  return (
    <div className="insights-board stagger-list">
      {cards.map((insight) => (
        <article key={insight.id} className="insight-card-ref">
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
  );
}
