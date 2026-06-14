"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n/LanguageContext";

export function ServicesOnboardingPrompt() {
  const { t } = useT();

  return (
    <div className="view-stack">
      <section className="panel">
        <EmptyState
          icon="calendar"
          title={t("services.setupTitle")}
          description={t("services.completeOnboarding")}
          actionLabel={t("services.setupAction")}
          actionHref="/onboarding"
        />
      </section>
    </div>
  );
}
