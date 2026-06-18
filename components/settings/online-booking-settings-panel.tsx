"use client";

import { CalendarCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";
import { updateOnlineBookingSettings } from "@/lib/settings/actions";
import { useT } from "@/lib/i18n/LanguageContext";

type OnlineBookingSettingsPanelProps = {
  initialEnabled?: boolean;
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

export function OnlineBookingSettingsPanel({
  initialEnabled = true,
}: OnlineBookingSettingsPanelProps) {
  const { t } = useT();
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "success" });

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const handleSave = async () => {
    setSaving(true);

    const formData = new FormData();
    formData.set("online_booking_enabled", enabled ? "true" : "false");

    const result = await updateOnlineBookingSettings(formData);
    setSaving(false);

    if (!result.ok) {
      setToast({ show: true, message: result.error, variant: "error" });
      return;
    }

    setToast({
      show: true,
      message: t("settings.onlineBookingSaved"),
      variant: "success",
    });
    router.refresh();
  };

  return (
    <>
      <section className="panel" id="online-booking-settings-panel">
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
              <CalendarCheck size={16} strokeWidth={1.5} aria-hidden />
              {t("settings.onlineBookingTitle")}
            </h2>
          </div>
        </div>

        <div style={{ maxWidth: 520, display: "grid", gap: 14 }}>
          <SettingsToggle
            id="online-booking-enabled"
            label={t("settings.onlineBookingEnable")}
            checked={enabled}
            onChange={setEnabled}
          />

          <p className="text-body" style={{ margin: 0, fontSize: 13 }}>
            {enabled
              ? t("settings.onlineBookingHelpOn")
              : t("settings.onlineBookingHelpOff")}
          </p>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="primary-button"
            style={{ minHeight: 44, borderRadius: 10, justifySelf: "start" }}
          >
            {saving ? t("common.saving") : t("settings.saveOnlineBooking")}
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
