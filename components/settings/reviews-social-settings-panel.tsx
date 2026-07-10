"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";
import { updateReviewsSocialSettings } from "@/lib/settings/actions";
import { useT } from "@/lib/i18n/LanguageContext";

type ReviewsSocialSettingsPanelProps = {
  initialReviewPromptEnabled?: boolean;
  initialGoogleReviewUrl?: string;
  initialInstagramPromptEnabled?: boolean;
  initialInstagramUrl?: string;
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

export function ReviewsSocialSettingsPanel({
  initialReviewPromptEnabled = false,
  initialGoogleReviewUrl = "",
  initialInstagramPromptEnabled = false,
  initialInstagramUrl = "",
}: ReviewsSocialSettingsPanelProps) {
  const { t } = useT();
  const router = useRouter();
  const [reviewPromptEnabled, setReviewPromptEnabled] = useState(
    initialReviewPromptEnabled
  );
  const [googleReviewUrl, setGoogleReviewUrl] = useState(initialGoogleReviewUrl);
  const [instagramPromptEnabled, setInstagramPromptEnabled] = useState(
    initialInstagramPromptEnabled
  );
  const [instagramUrl, setInstagramUrl] = useState(initialInstagramUrl);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "success" });

  useEffect(() => {
    setReviewPromptEnabled(initialReviewPromptEnabled);
    setGoogleReviewUrl(initialGoogleReviewUrl);
    setInstagramPromptEnabled(initialInstagramPromptEnabled);
    setInstagramUrl(initialInstagramUrl);
  }, [
    initialReviewPromptEnabled,
    initialGoogleReviewUrl,
    initialInstagramPromptEnabled,
    initialInstagramUrl,
  ]);

  const handleSave = async () => {
    setSaving(true);

    const formData = new FormData();
    formData.set(
      "review_prompt_enabled",
      reviewPromptEnabled ? "true" : "false"
    );
    formData.set("google_review_url", googleReviewUrl);
    formData.set(
      "instagram_prompt_enabled",
      instagramPromptEnabled ? "true" : "false"
    );
    formData.set("instagram_url", instagramUrl);

    const result = await updateReviewsSocialSettings(formData);
    setSaving(false);

    if (!result.ok) {
      setToast({ show: true, message: result.error, variant: "error" });
      return;
    }

    setToast({
      show: true,
      message: t("settings.reviewsSocialSaved"),
      variant: "success",
    });
    router.refresh();
  };

  return (
    <>
      <section className="panel" id="reviews-social-settings-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{t("settings.reviewsSocialEyebrow")}</p>
            <h2
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                margin: 0,
              }}
            >
              <Star size={16} strokeWidth={1.5} aria-hidden />
              {t("settings.reviewsSocialTitle")}
            </h2>
          </div>
        </div>

        <div style={{ maxWidth: 520, display: "grid", gap: 16 }}>
          <p className="text-body" style={{ margin: 0, fontSize: 14 }}>
            {t("settings.reviewsSocialIntro")}
          </p>

          <SettingsToggle
            id="review-prompt-enabled"
            label={t("settings.reviewPromptEnable")}
            checked={reviewPromptEnabled}
            onChange={setReviewPromptEnabled}
          />
          <div>
            <label htmlFor="google-review-url" className="field-label">
              {t("settings.googleReviewUrlLabel")}
            </label>
            <input
              id="google-review-url"
              type="url"
              className="input-field"
              value={googleReviewUrl}
              onChange={(e) => setGoogleReviewUrl(e.target.value)}
              placeholder={t("settings.googleReviewUrlPlaceholder")}
              style={{ borderRadius: 10, borderColor: "#E0DAD0" }}
            />
          </div>

          <SettingsToggle
            id="instagram-prompt-enabled"
            label={t("settings.instagramPromptEnable")}
            checked={instagramPromptEnabled}
            onChange={setInstagramPromptEnabled}
          />
          <div>
            <label htmlFor="instagram-url" className="field-label">
              {t("settings.instagramUrlLabel")}
            </label>
            <input
              id="instagram-url"
              type="url"
              className="input-field"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder={t("settings.instagramUrlPlaceholder")}
              style={{ borderRadius: 10, borderColor: "#E0DAD0" }}
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="primary-button"
            style={{ minHeight: 44, borderRadius: 10, justifySelf: "start" }}
          >
            {saving ? t("common.saving") : t("settings.saveReviewsSocial")}
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
