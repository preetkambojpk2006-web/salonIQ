"use client";

import { useState } from "react";
import { Toast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n/LanguageContext";
import type { Locale } from "@/lib/i18n";
import { updateUiLanguage } from "@/lib/settings/actions";

export function LanguageSettingsPanel() {
  const { t, locale, setLocale } = useT();
  const [saving, setSaving] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const handleSelect = async (nextLocale: Locale) => {
    if (nextLocale === locale || saving) return;

    setLocale(nextLocale);

    setSaving(true);
    const result = await updateUiLanguage(nextLocale);
    setSaving(false);

    if (!result.ok) {
      setErrorToast(result.error);
    }
  };

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">App</p>
            <h2>{t("settings.language")}</h2>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSelect("hi")}
            className={locale === "hi" ? "primary-button" : "demo-button"}
            style={{ minHeight: 40, borderRadius: 10 }}
          >
            {t("settings.languageHi")}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSelect("en")}
            className={locale === "en" ? "primary-button" : "demo-button"}
            style={{ minHeight: 40, borderRadius: 10 }}
          >
            {t("settings.languageEn")}
          </button>
        </div>
      </section>

      <Toast
        message={errorToast ?? ""}
        show={errorToast !== null}
        variant="error"
        durationMs={5000}
        onDismiss={() => setErrorToast(null)}
      />
    </>
  );
}
