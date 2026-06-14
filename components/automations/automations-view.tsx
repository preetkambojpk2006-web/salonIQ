"use client";

import { useT } from "@/lib/i18n/LanguageContext";

const AUTOMATION_KEYS = [
  {
    nameKey: "automations.reminderName",
    detailKey: "automations.reminderDetail",
    resultKey: "automations.reminderResult",
  },
  {
    nameKey: "automations.birthdayName",
    detailKey: "automations.birthdayDetail",
    resultKey: "automations.birthdayResult",
  },
  {
    nameKey: "automations.revisitName",
    detailKey: "automations.revisitDetail",
    resultKey: "automations.revisitResult",
  },
  {
    nameKey: "automations.reportName",
    detailKey: "automations.reportDetail",
    resultKey: "automations.reportResult",
  },
] as const;

export function AutomationsView() {
  const { t } = useT();

  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{t("automations.eyebrow")}</p>
            <h2>{t("automations.title")}</h2>
          </div>
          <button type="button" className="primary-button">
            {t("automations.create")}
          </button>
        </div>
        <div className="automation-list stagger-list">
          {AUTOMATION_KEYS.map((automation) => (
            <article key={automation.nameKey} className="automation-row">
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800 }}>
                  {t(automation.nameKey)}
                </h3>
                <p>{t(automation.detailKey)}</p>
                <p className="automation-stat">{t(automation.resultKey)}</p>
              </div>
              <button
                type="button"
                className="toggle"
                aria-label={`Toggle ${t(automation.nameKey)}`}
              >
                <span />
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
