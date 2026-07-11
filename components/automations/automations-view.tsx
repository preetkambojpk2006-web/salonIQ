"use client";

import { Zap } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageContext";

export function AutomationsView() {
  const { t } = useT();

  return (
    <div className="view-stack">
      <section className="panel">
        <div className="coming-soon-card">
          <div className="coming-soon-icon" aria-hidden>
            <Zap size={16} strokeWidth={1.5} />
          </div>
          <h2 className="coming-soon-title">{t("automations.comingSoonTitle")}</h2>
          <p className="coming-soon-subtitle">
            {t("automations.comingSoonSubtitle")}
          </p>
        </div>
      </section>
    </div>
  );
}
