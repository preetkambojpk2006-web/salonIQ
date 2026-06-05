import type { MoneyDashboardStats } from "@/lib/payments/types";

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

type MoneyViewProps = {
  stats: MoneyDashboardStats;
};

export function MoneyView({ stats }: MoneyViewProps) {
  const summaryCards = [
    {
      key: "today",
      className: "metric-card success",
      label: "Today's revenue",
      value: formatRs(stats.revenueToday),
      context: "Paid collections today",
    },
    {
      key: "week",
      className: "metric-card",
      label: "This week",
      value: formatRs(stats.revenueWeek),
      context: "Monday se aaj tak",
    },
    {
      key: "pending",
      className: "metric-card warning",
      label: "Pending payments",
      value: formatRs(stats.pendingAmount),
      context:
        stats.pendingCount === 0
          ? "Sab clear hai"
          : `${stats.pendingCount} payment baaki`,
    },
    {
      key: "profit",
      className: "metric-card",
      label: "Net profit (week)",
      value: formatRs(stats.netProfit),
      context: "Expenses placeholder — jald add hoga",
    },
  ];

  const incomeBars = [
    { label: "Services", value: stats.revenueWeek * 0.82 },
    { label: "Products", value: stats.revenueWeek * 0.18 },
  ];

  const expenseBars = [
    { label: "Salaries", value: 0 },
    { label: "Rent", value: 0 },
    { label: "Products", value: 0 },
  ];

  const maxIncome = Math.max(...incomeBars.map((b) => b.value), 1);

  return (
    <div className="view-stack">
      <div className="summary-grid stagger-metrics">
        {summaryCards.map((card) => (
          <article key={card.key} className={card.className}>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.context}</span>
          </article>
        ))}
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Real-time P&L</p>
            <h2>Income and expenses</h2>
          </div>
        </div>
        <div className="finance-layout">
          <div className="bar-list">
            {incomeBars.map((bar) => (
              <div key={bar.label} className="bar-row">
                <header>
                  <span>{bar.label}</span>
                  <span>{formatRs(bar.value)}</span>
                </header>
                <div className="bar-track">
                  <span
                    style={{ width: `${(bar.value / maxIncome) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="bar-list expenses">
            {expenseBars.map((bar) => (
              <div key={bar.label} className="bar-row">
                <header>
                  <span>{bar.label}</span>
                  <span>{formatRs(bar.value)}</span>
                </header>
                <div className="bar-track">
                  <span style={{ width: bar.value > 0 ? "40%" : "4%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Payment methods</p>
            <h2>Cash vs UPI</h2>
          </div>
        </div>
        <div
          className="summary-grid stagger-metrics"
          style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
        >
          <article className="metric-card">
            <p>Cash</p>
            <strong>{stats.cashCount}</strong>
            <span>payments</span>
          </article>
          <article className="metric-card success">
            <p>UPI</p>
            <strong>{stats.upiCount}</strong>
            <span>payments</span>
          </article>
          <article className="metric-card warning">
            <p>Pending</p>
            <strong>{stats.pendingMethodCount}</strong>
            <span>to collect</span>
          </article>
        </div>
      </section>
    </div>
  );
}
