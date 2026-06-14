"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n/LanguageContext";
import type { InsightCard } from "@/lib/insights/types";

type InsightsCardsProps = {
  cards: InsightCard[];
};

export function InsightsCards({ cards }: InsightsCardsProps) {
  const { t } = useT();

  if (cards.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        title={t("insights.emptyTitle")}
        description={t("insights.empty")}
        actionLabel={t("insights.emptyAction")}
        actionHref="/dashboard/calendar?booking=new"
      />
    );
  }

  return (
    <div className="insights-board stagger-list">
      {cards.map((insight) => (
        <article key={insight.id} className="insight-card-ref">
          <span className="tag green">{t("insights.aiSuggestion")}</span>
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
