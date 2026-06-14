"use client";

import { useT } from "@/lib/i18n/LanguageContext";

export function ServicesOnboardingPrompt() {
  const { t } = useT();

  return (
    <div className="view-stack">
      <section className="panel">
        <p className="text-body">{t("services.completeOnboarding")}</p>
      </section>
    </div>
  );
}
