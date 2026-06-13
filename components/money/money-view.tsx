import type { ReactNode } from "react";
import { CashUpiSplit } from "@/components/money/CashUpiSplit";
import { EmptyState } from "@/components/ui/empty-state";
import type { CashUpiSplit as CashUpiSplitData, MoneyDashboardStats } from "@/lib/payments/types";

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function pendingPaymentContext(amount: number, count: number): string {
  if (count === 0) {
    return "Aaj ka saara hisaab clear hai!";
  }
  return `${formatInr(amount)} collect karna baaki hai`;
}

type MoneyViewProps = {
  stats: MoneyDashboardStats;
  cashUpiSplit: CashUpiSplitData;
  staffPanels?: ReactNode;
};

export function MoneyView({
  stats,
  cashUpiSplit,
  staffPanels,
}: MoneyViewProps) {
  const summaryCards = [
    {
      key: "today",
      className: "metric-card success",
      label: "Today's revenue",
      value: formatRs(stats.revenueToday),
      context: "Aaj ki paid collections",
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
      context: pendingPaymentContext(stats.pendingAmount, stats.pendingCount),
    },
    {
      key: "profit",
      className: "metric-card",
      label: "Net profit (week)",
      value: formatRs(stats.netProfit),
      context: "Expenses tracking jald aayega",
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
  const isEmptySalon =
    stats.revenueToday === 0 &&
    stats.revenueWeek === 0 &&
    stats.pendingCount === 0 &&
    cashUpiSplit.total === 0;

  return (
    <div className="view-stack">
      {isEmptySalon ? (
        <section className="panel">
          <EmptyState
            icon="money"
            title="Abhi koi payment record nahi hai"
            description="Calendar se booking complete karein aur Cash ya UPI select karein — revenue yahan auto dikhegi."
            actionLabel="Pehli booking add karein"
            actionHref="/dashboard/calendar?booking=new"
          />
        </section>
      ) : null}

      <div className="summary-grid stagger-metrics">
        {summaryCards.map((card) => (
          <article key={card.key} className={card.className}>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.context}</span>
          </article>
        ))}
      </div>

      <CashUpiSplit split={cashUpiSplit} />

      {staffPanels}

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

    </div>
  );
}
