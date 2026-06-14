"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";
import { updateAttendanceSettings } from "@/lib/settings/actions";
import { useT } from "@/lib/i18n/LanguageContext";

type AttendanceSettingsPanelProps = {
  initialLateFineAmount?: string;
};

export function AttendanceSettingsPanel({
  initialLateFineAmount = "100",
}: AttendanceSettingsPanelProps) {
  const { t } = useT();
  const router = useRouter();
  const [lateFineAmount, setLateFineAmount] = useState(initialLateFineAmount);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "success" });

  useEffect(() => {
    setLateFineAmount(initialLateFineAmount);
  }, [initialLateFineAmount]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.set("late_fine_amount", lateFineAmount);

    const result = await updateAttendanceSettings(formData);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      setToast({ show: true, message: result.error, variant: "error" });
      return;
    }

    setToast({
      show: true,
      message: t("settings.lateFineSaved"),
      variant: "success",
    });
    router.refresh();
  };

  return (
    <>
      <section className="panel" id="attendance-settings-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{t("attendance.title")}</p>
            <h2>{t("settings.lateFine")}</h2>
          </div>
        </div>

        <div style={{ maxWidth: 520, display: "grid", gap: 14 }}>
          <div>
            <label htmlFor="late-fine-amount" className="field-label">
              {t("settings.lateFineLabel")}
            </label>
            <p className="text-body" style={{ margin: "6px 0 8px", fontSize: 14 }}>
              {t("settings.lateFineHelp")}
            </p>
            <input
              id="late-fine-amount"
              type="number"
              min={0}
              step="1"
              className="input-field"
              value={lateFineAmount}
              onChange={(e) => setLateFineAmount(e.target.value)}
              placeholder="100"
              style={{ borderRadius: 10, borderColor: "#E0DAD0" }}
            />
          </div>

          {error ? (
            <p style={{ margin: 0, fontSize: 13, color: "#D94F4F" }}>{error}</p>
          ) : null}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="primary-button"
            style={{ minHeight: 44, borderRadius: 10, justifySelf: "start" }}
          >
            {saving ? t("common.saving") : t("settings.saveLateFine")}
          </button>
        </div>
      </section>

      <Toast
        message={toast.message}
        show={toast.show}
        variant={toast.variant}
        onDismiss={() => setToast((t) => ({ ...t, show: false }))}
      />
    </>
  );
}
