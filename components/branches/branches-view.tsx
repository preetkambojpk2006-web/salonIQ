"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n/LanguageContext";

type Branch = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
};

type BranchesViewProps = {
  business: { id: string; name: string } | null;
  branches: Branch[];
};

export function BranchesView({ business, branches }: BranchesViewProps) {
  const { t } = useT();

  if (!business) {
    return (
      <div className="view-stack">
        <section className="panel">
          <EmptyState
            icon="calendar"
            title={t("branches.setupIncomplete")}
            description={t("branches.completeOnboarding")}
            actionLabel={t("branches.openOnboarding")}
            actionHref="/onboarding"
          />
        </section>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="view-stack">
        <section className="panel">
          <EmptyState
            icon="calendar"
            title={t("branches.noBranches")}
            description={t("branches.noBranchesDesc")}
            actionLabel={t("branches.openSettings")}
            actionHref="/dashboard/settings"
          />
        </section>
      </div>
    );
  }

  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{t("branches.eyebrow")}</p>
            <h2>{t("branches.yours")}</h2>
          </div>
        </div>
        <div className="branch-grid stagger-list">
          {branches.map((branch) => (
            <article key={branch.id} className="branch-card">
              <span className="tag green">{t("common.active")}</span>
              <p style={{ marginTop: 10, fontWeight: 800, fontSize: 15 }}>
                {branch.name}
              </p>
              {branch.address ? (
                <p className="text-body" style={{ marginTop: 6, fontSize: 14 }}>
                  {branch.address}
                </p>
              ) : null}
              {branch.phone ? (
                <p className="text-body" style={{ marginTop: 4, fontSize: 14 }}>
                  {branch.phone}
                </p>
              ) : null}
            </article>
          ))}
        </div>
        <p className="text-body" style={{ marginTop: 16, fontSize: 14 }}>
          {t("branches.settingsHintBefore")}{" "}
          <Link href="/dashboard/settings" style={{ color: "#1FA873", fontWeight: 700 }}>
            Settings
          </Link>{" "}
          {t("branches.settingsHintAfter")}
        </p>
      </section>
    </div>
  );
}
