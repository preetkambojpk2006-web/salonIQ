"use client";

import type { ReactNode } from "react";
import { CashUpiSplit } from "@/components/money/CashUpiSplit";
import { InventorySpendSummary } from "@/components/money/InventorySpendSummary";
import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n/LanguageContext";
import type { BrandSpendSummary, InventorySummary } from "@/lib/inventory/types";
import type { CashUpiSplit as CashUpiSplitData, MoneyDashboardStats } from "@/lib/payments/types";

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

type MoneyViewProps = {
  stats: MoneyDashboardStats;
  cashUpiSplit: CashUpiSplitData;
  showInventorySpend?: boolean;
  inventorySummary?: InventorySummary;
  brandSpend?: BrandSpendSummary[];
  staffPanels?: ReactNode;
};

export function MoneyView({
  stats,
  cashUpiSplit,
  showInventorySpend = false,
  inventorySummary,
  brandSpend = [],
  staffPanels,
}: MoneyViewProps) {
  const { t } = useT();

  const pendingPaymentContext =
    stats.pendingCount === 0
      ? t("money.pendingClear")
      : t("money.pendingCollect", { amount: formatInr(stats.pendingAmount) });

  const summaryCards = [
    {
      key: "today",
      className: "metric-card success",
      label: t("money.todayRevenue"),
      value: formatRs(stats.revenueToday),
      context: t("money.todayRevenueContext"),
    },
    {
      key: "week",
      className: "metric-card",
      label: t("money.thisWeek"),
      value: formatRs(stats.revenueWeek),
      context: t("money.weekContext"),
    },
    {
      key: "pending",
      className: "metric-card warning",
      label: t("money.pendingPayments"),
      value: formatRs(stats.pendingAmount),
      context: pendingPaymentContext,
    },
    {
      key: "profit",
      className: "metric-card",
      label: t("money.netProfitWeek"),
      value: formatRs(stats.netProfit),
      context: t("money.expensesComingSoon"),
    },
  ];

  const incomeBars = [
    { label: t("money.services"), value: stats.revenueWeek * 0.82 },
    { label: t("money.products"), value: stats.revenueWeek * 0.18 },
  ];

  const expenseBars = [
    { label: t("money.salaries"), value: 0 },
    { label: t("money.rent"), value: 0 },
    { label: t("money.products"), value: 0 },
  ];

  const maxIncome = Math.max(...incomeBars.map((b) => b.value), 1);
  const isEmptySalon =
    stats.revenueToday === 0 &&
    stats.revenueWeek === 0 &&
    stats.pendingCount === 0 &&
    cashUpiSplit.total === 0;

  if (isEmptySalon) {
    return (
      <div className="view-stack">
        <section className="panel">
          <EmptyState
            icon="money"
            title={t("money.emptyTitle")}
            description={t("money.emptyDescription")}
            actionLabel={t("money.emptyAction")}
            actionHref="/dashboard/calendar?booking=new"
          />
        </section>
      </div>
    );
  }

  const showProfitBreakdown = stats.revenueWeek > 0;

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

      <CashUpiSplit split={cashUpiSplit} />

      {showInventorySpend && inventorySummary ? (
        <InventorySpendSummary
          summary={inventorySummary}
          brandSpend={brandSpend}
        />
      ) : null}

      {staffPanels}

      {showProfitBreakdown ? (
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{t("money.plTitle")}</p>
            <h2>{t("money.incomeExpenses")}</h2>
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
      ) : null}
    </div>
  );
}
