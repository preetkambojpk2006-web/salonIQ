import type { TodayMetrics } from "@/lib/dashboard/today-queries";

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

type SummaryGridProps = {
  metrics: TodayMetrics;
};

export function SummaryGrid({ metrics }: SummaryGridProps) {
  const cards = [
    {
      key: "revenue",
      className: "metric-card success",
      label: "Revenue today",
      value: formatRs(metrics.revenueToday),
      context:
        metrics.revenueToday > 0
          ? "+22% vs last Friday"
          : metrics.revenueContext,
    },
    {
      key: "bookings",
      className: "metric-card",
      label: "Bookings",
      value: String(metrics.bookingsToday),
      context: metrics.bookingsContext,
    },
    {
      key: "pending",
      className: "metric-card warning",
      label: "Pending payments",
      value: formatRs(metrics.pendingAmount),
      context: metrics.pendingContext,
    },
    {
      key: "repeat",
      className: "metric-card",
      label: "Repeat customers",
      value: `${metrics.repeatPercent}%`,
      context:
        metrics.repeatPercent >= 50
          ? "Healthy retention"
          : metrics.repeatContext,
    },
  ];

  return (
    <div className="summary-grid stagger-metrics">
      {cards.map((card) => (
        <article key={card.key} className={card.className}>
          <p>{card.label}</p>
          <strong>{card.value}</strong>
          <span>{card.context}</span>
        </article>
      ))}
    </div>
  );
}
