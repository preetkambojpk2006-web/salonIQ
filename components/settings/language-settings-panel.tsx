"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Toast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n/LanguageContext";
import type { Locale } from "@/lib/i18n";
import { updateUiLanguage } from "@/lib/settings/actions";

type LanguageSettingsPanelProps = {
  initialLocale: Locale;
};

export function LanguageSettingsPanel({
  initialLocale,
}: LanguageSettingsPanelProps) {
  const { t, setLocale } = useT();
  const router = useRouter();
  const [selected, setSelected] = useState<Locale>(initialLocale);
  const [saving, setSaving] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  useEffect(() => {
    setSelected(initialLocale);
  }, [initialLocale]);

  const handleSelect = async (locale: Locale) => {
    if (locale === selected || saving) return;

    setSaving(true);
    const result = await updateUiLanguage(locale);
    setSaving(false);

    if (!result.ok) {
      setErrorToast(result.error);
      return;
    }

    setSelected(locale);
    setLocale(locale);
    router.refresh();
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
            className={selected === "hi" ? "primary-button" : "demo-button"}
            style={{ minHeight: 40, borderRadius: 10 }}
          >
            {t("settings.languageHi")}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSelect("en")}
            className={selected === "en" ? "primary-button" : "demo-button"}
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
