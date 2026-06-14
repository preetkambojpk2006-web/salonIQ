import type { TodayMetrics } from "@/lib/dashboard/today-queries";
import { useT } from "@/lib/i18n/LanguageContext";

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

type SummaryGridProps = {
  metrics: TodayMetrics;
  showFinance?: boolean;
};

export function SummaryGrid({ metrics, showFinance = true }: SummaryGridProps) {
  const { t } = useT();

  const cards = [
    {
      key: "revenue",
      className: "metric-card success",
      label: t("today.metricRevenue"),
      value: formatRs(metrics.revenueToday),
      context: metrics.revenueContext,
    },
    {
      key: "bookings",
      className: "metric-card",
      label: t("today.metricBookings"),
      value: String(metrics.bookingsToday),
      context: metrics.bookingsContext,
    },
    {
      key: "pending",
      className: "metric-card warning",
      label: t("today.metricPending"),
      value: formatRs(metrics.pendingAmount),
      context: metrics.pendingContext,
    },
    {
      key: "repeat",
      className: "metric-card",
      label: t("today.metricRepeat"),
      value: metrics.totalCustomers === 0 ? "—" : `${metrics.repeatPercent}%`,
      context: metrics.repeatContext,
    },
  ].filter((card) => {
    if (!showFinance && (card.key === "revenue" || card.key === "pending")) {
      return false;
    }
    return true;
  });

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
