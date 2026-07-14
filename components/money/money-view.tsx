"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CsvDownloadButton } from "@/components/export/csv-download-button";
import { CashUpiSplit } from "@/components/money/CashUpiSplit";
import { InventorySpendSummary } from "@/components/money/InventorySpendSummary";
import { EmptyState } from "@/components/ui/empty-state";
import { csvFilename } from "@/lib/export/csv-filename";
import {
  buildPaymentCsvRows,
  PAYMENT_CSV_HEADERS,
} from "@/lib/export/payments-csv";
import { formatInr } from "@/lib/format/currency";
import { useT } from "@/lib/i18n/LanguageContext";
import { useBusinessRealtimeRefresh } from "@/lib/supabase/use-business-realtime";
import { MONEY_RANGES, type MoneyRange } from "@/lib/payments/date-utils";
import type { BrandSpendSummary, InventorySummary } from "@/lib/inventory/types";
import type {
  CashUpiSplit as CashUpiSplitData,
  MoneyDashboardStats,
  PaymentExportRow,
} from "@/lib/payments/types";

type MoneyViewProps = {
  businessId?: string | null;
  range?: MoneyRange;
  stats: MoneyDashboardStats;
  cashUpiSplit: CashUpiSplitData;
  paymentsForExport?: PaymentExportRow[];
  showInventorySpend?: boolean;
  inventorySummary?: InventorySummary;
  brandSpend?: BrandSpendSummary[];
  staffPanels?: ReactNode;
};

const RANGE_LABEL_KEYS: Record<MoneyRange, string> = {
  today: "money.rangeToday",
  week: "money.rangeWeek",
  month: "money.rangeMonth",
  "3months": "money.range3Months",
  "6months": "money.range6Months",
};

function MoneyRangePicker({ range }: { range: MoneyRange }) {
  const { t } = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className="segmented"
      role="group"
      aria-label={t("money.rangeLabel")}
      style={{ alignSelf: "flex-start", opacity: isPending ? 0.7 : 1 }}
    >
      {MONEY_RANGES.map((option) => (
        <button
          key={option}
          type="button"
          className={range === option ? "active" : undefined}
          aria-pressed={range === option}
          onClick={() =>
            startTransition(() =>
              router.push(`/dashboard/money?range=${option}`, { scroll: false })
            )
          }
        >
          {t(RANGE_LABEL_KEYS[option])}
        </button>
      ))}
    </div>
  );
}

function MoneyToolbar({
  range,
  paymentsForExport,
}: {
  range: MoneyRange;
  paymentsForExport: PaymentExportRow[];
}) {
  const { t } = useT();

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <MoneyRangePicker range={range} />
      <CsvDownloadButton
        label={t("money.exportCsv")}
        filename={csvFilename("payments")}
        headers={PAYMENT_CSV_HEADERS}
        rows={buildPaymentCsvRows(paymentsForExport)}
      />
    </div>
  );
}

export function MoneyView({
  businessId = null,
  range = "week",
  stats,
  cashUpiSplit,
  paymentsForExport = [],
  showInventorySpend = false,
  inventorySummary,
  brandSpend = [],
  staffPanels,
}: MoneyViewProps) {
  const { t } = useT();

  useBusinessRealtimeRefresh({ businessId, tableSet: "money" });

  const rangeLabel = t(RANGE_LABEL_KEYS[range]);

  const pendingPaymentContext =
    stats.pendingCount === 0
      ? t("money.pendingClear")
      : t("money.pendingCollect", { amount: formatInr(stats.pendingAmount) });

  const summaryCards = [
    {
      key: "today",
      className: "metric-card success",
      label: t("money.todayRevenue"),
      value: formatInr(stats.revenueToday),
      context: t("money.todayRevenueContext"),
    },
    {
      key: "range",
      className: "metric-card",
      label: rangeLabel,
      value: formatInr(stats.revenueRange),
      context: t("money.rangeContext"),
    },
    {
      key: "pending",
      className: "metric-card warning",
      label: t("money.pendingPayments"),
      value: formatInr(stats.pendingAmount),
      context: pendingPaymentContext,
    },
    {
      key: "profit",
      className: "metric-card",
      label: t("money.netProfit"),
      value: formatInr(stats.netProfit),
      context: t("money.expensesComingSoon"),
    },
  ];

  const incomeBars = [
    { label: t("money.services"), value: stats.revenueRange * 0.82 },
    { label: t("money.products"), value: stats.revenueRange * 0.18 },
  ];

  const expenseBars = [
    { label: t("money.salaries"), value: 0 },
    { label: t("money.rent"), value: 0 },
    { label: t("money.products"), value: 0 },
  ];

  const maxIncome = Math.max(...incomeBars.map((b) => b.value), 1);
  const hasRealExpenseData = stats.expensesPlaceholder > 0;
  const isEmptySalon =
    stats.revenueToday === 0 &&
    stats.revenueRange === 0 &&
    stats.pendingCount === 0 &&
    cashUpiSplit.total === 0;

  if (isEmptySalon) {
    return (
      <div className="view-stack view-stack-fill">
        <MoneyToolbar range={range} paymentsForExport={paymentsForExport} />
        <section className="panel empty-state-panel">
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

  const showProfitBreakdown = stats.revenueRange > 0 && hasRealExpenseData;

  return (
    <div className="view-stack">
      <MoneyToolbar range={range} paymentsForExport={paymentsForExport} />
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
                  <span>{formatInr(bar.value)}</span>
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
                  <span>{formatInr(bar.value)}</span>
                </header>
                <div className="bar-track">
                  <span style={{ width: bar.value > 0 ? "40%" : "4%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      ) : stats.revenueRange > 0 ? (
        <section className="panel">
          <div className="coming-soon-card">
            <p className="coming-soon-subtitle">{t("money.plComingSoon")}</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
