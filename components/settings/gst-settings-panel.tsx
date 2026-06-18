"use client";

import { Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";
import { updateGstSettings } from "@/lib/settings/actions";
import { useT } from "@/lib/i18n/LanguageContext";

type GstSettingsPanelProps = {
  initialGstEnabled?: boolean;
  initialGstNumber?: string;
  initialGstRate?: string;
  initialGstInclusive?: boolean;
};

function SettingsToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <label
        htmlFor={id}
        style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", flex: 1 }}
      >
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className="toggle"
        onClick={() => onChange(!checked)}
        style={checked ? undefined : { background: "#D9D2C8" }}
      >
        <span style={checked ? undefined : { marginLeft: 0 }} />
      </button>
    </div>
  );
}

export function GstSettingsPanel({
  initialGstEnabled = false,
  initialGstNumber = "",
  initialGstRate = "18",
  initialGstInclusive = false,
}: GstSettingsPanelProps) {
  const { t } = useT();
  const router = useRouter();
  const [gstEnabled, setGstEnabled] = useState(initialGstEnabled);
  const [gstNumber, setGstNumber] = useState(initialGstNumber);
  const [gstRate, setGstRate] = useState(initialGstRate);
  const [gstInclusive, setGstInclusive] = useState(initialGstInclusive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "success" });

  useEffect(() => {
    setGstEnabled(initialGstEnabled);
    setGstNumber(initialGstNumber);
    setGstRate(initialGstRate);
    setGstInclusive(initialGstInclusive);
  }, [
    initialGstEnabled,
    initialGstNumber,
    initialGstRate,
    initialGstInclusive,
  ]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.set("gst_enabled", gstEnabled ? "true" : "false");
    formData.set("gst_number", gstNumber);
    formData.set("gst_rate", gstRate);
    formData.set("gst_inclusive", gstInclusive ? "true" : "false");

    const result = await updateGstSettings(formData);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      setToast({ show: true, message: result.error, variant: "error" });
      return;
    }

    setToast({
      show: true,
      message: t("settings.gstSaved"),
      variant: "success",
    });
    router.refresh();
  };

  return (
    <>
      <section className="panel" id="gst-settings-panel">
        <div className="panel-header">
          <div>
            <h2
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                margin: 0,
              }}
            >
              <Receipt size={16} strokeWidth={1.5} aria-hidden />
              {t("settings.gstTitle")}
            </h2>
          </div>
        </div>

        <div style={{ maxWidth: 520, display: "grid", gap: 14 }}>
          <SettingsToggle
            id="gst-enabled"
            label={t("settings.gstEnable")}
            checked={gstEnabled}
            onChange={setGstEnabled}
          />

          <div
            style={{
              display: "grid",
              gap: 14,
              overflow: "hidden",
              maxHeight: gstEnabled ? 480 : 0,
              opacity: gstEnabled ? 1 : 0,
              transition: "max-height 0.25s ease, opacity 0.2s ease",
              pointerEvents: gstEnabled ? "auto" : "none",
            }}
          >
            <div>
              <label htmlFor="gst-number" className="field-label">
                {t("settings.gstNumberLabel")}
              </label>
              <input
                id="gst-number"
                type="text"
                className="input-field"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder={t("settings.gstNumberPlaceholder")}
                autoComplete="off"
                style={{ borderRadius: 10, borderColor: "#E0DAD0" }}
              />
            </div>

            <div>
              <label htmlFor="gst-rate" className="field-label">
                {t("settings.gstRateLabel")}
              </label>
              <input
                id="gst-rate"
                type="number"
                min={0}
                max={100}
                step="0.01"
                className="input-field"
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                style={{ borderRadius: 10, borderColor: "#E0DAD0" }}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <SettingsToggle
                id="gst-inclusive"
                label={t("settings.gstInclusive")}
                checked={gstInclusive}
                onChange={setGstInclusive}
              />
              <p className="text-body" style={{ margin: 0, fontSize: 13 }}>
                {t("settings.gstInclusiveHelp")}
              </p>
            </div>
          </div>

          {error ? (
            <p style={{ margin: 0, fontSize: 13, color: "#D94F4F" }} role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="primary-button"
            style={{ minHeight: 44, borderRadius: 10, justifySelf: "start" }}
          >
            {saving ? t("common.saving") : t("settings.saveGst")}
          </button>
        </div>
      </section>

      <Toast
        message={toast.message}
        show={toast.show}
        variant={toast.variant}
        onDismiss={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </>
  );
}
