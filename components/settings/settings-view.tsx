"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookingLinkCard } from "@/components/booking/BookingLinkCard";
import { WalkinQrCard } from "@/components/walkin/WalkinQrCard";
import { Toast } from "@/components/ui/toast";
import {
  changePassword,
  updateBusinessSettings,
} from "@/lib/settings/actions";
import { useT } from "@/lib/i18n/LanguageContext";

type SettingsViewProps = {
  initialName: string;
  initialPhone: string;
  initialEmail: string;
  initialOpeningHours: string;
  initialGoogleReviewLink: string;
  initialDailyRevenueTarget?: string;
  attendancePanel?: ReactNode;
  loyaltyPanel?: ReactNode;
  gstPanel?: ReactNode;
  languagePanel?: ReactNode;
  bookingSlug?: string | null;
  salonName: string;
};

export function SettingsView({
  initialName,
  initialPhone,
  initialEmail,
  initialOpeningHours,
  initialGoogleReviewLink,
  initialDailyRevenueTarget = "",
  attendancePanel,
  loyaltyPanel,
  gstPanel,
  languagePanel,
  bookingSlug = null,
  salonName,
}: SettingsViewProps) {
  const { t } = useT();
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [openingHours, setOpeningHours] = useState(initialOpeningHours);
  const [googleReviewLink, setGoogleReviewLink] = useState(initialGoogleReviewLink);
  const [dailyRevenueTarget, setDailyRevenueTarget] = useState(
    initialDailyRevenueTarget
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "success" });

  useEffect(() => {
    setName(initialName);
    setPhone(initialPhone);
    setEmail(initialEmail);
    setOpeningHours(initialOpeningHours);
    setGoogleReviewLink(initialGoogleReviewLink);
    setDailyRevenueTarget(initialDailyRevenueTarget);
  }, [
    initialName,
    initialPhone,
    initialEmail,
    initialOpeningHours,
    initialGoogleReviewLink,
    initialDailyRevenueTarget,
  ]);

  const showToast = (message: string, variant: "success" | "error") => {
    setToast({ show: true, message, variant });
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setError(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("phone", phone);
    formData.set("email", email);
    formData.set("opening_hours", openingHours);
    formData.set("google_review_link", googleReviewLink);
    formData.set("daily_revenue_target", dailyRevenueTarget);

    const result = await updateBusinessSettings(formData);
    setSavingProfile(false);

    if (!result.ok) {
      setError(result.error);
      showToast(result.error, "error");
      return;
    }

    showToast(t("settings.savedToast"), "success");
    router.refresh();
  };

  const handleChangePassword = async () => {
    setSavingPassword(true);
    setError(null);

    const formData = new FormData();
    formData.set("new_password", newPassword);
    formData.set("confirm_password", confirmPassword);

    const result = await changePassword(formData);
    setSavingPassword(false);

    if (!result.ok) {
      setError(result.error);
      showToast(result.error, "error");
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    showToast(t("settings.passwordUpdatedToast"), "success");
  };

  return (
    <>
      <div className="view-stack">
        {bookingSlug ? (
          <BookingLinkCard slug={bookingSlug} salonName={salonName} />
        ) : null}

        {bookingSlug ? (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">{t("settings.walkinQueueEyebrow")}</p>
                <h2>{t("settings.qrCodeHeading")}</h2>
              </div>
            </div>
            <WalkinQrCard slug={bookingSlug} businessName={salonName} />
          </section>
        ) : null}

        {attendancePanel}
        {loyaltyPanel}
        {gstPanel}
        {languagePanel}

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t("settings.salonSettingsEyebrow")}</p>
              <h2>{t("settings.salonDetailsHeading")}</h2>
            </div>
          </div>

          <div style={{ maxWidth: 520, display: "grid", gap: 14 }}>
            <div>
              <label htmlFor="salon-name" className="field-label">
                {t("settings.salonNameLabel")}
              </label>
              <input
                id="salon-name"
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Glow Studio"
                style={{ borderRadius: 10, borderColor: "#E0DAD0" }}
              />
            </div>

            <div>
              <label htmlFor="salon-phone" className="field-label">
                {t("settings.phoneLabel")}
              </label>
              <input
                id="salon-phone"
                type="tel"
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={{ borderRadius: 10, borderColor: "#E0DAD0" }}
              />
            </div>

            <div>
              <label htmlFor="salon-email" className="field-label">
                {t("settings.emailLabel")}
              </label>
              <input
                id="salon-email"
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@salon.com"
                style={{ borderRadius: 10, borderColor: "#E0DAD0" }}
              />
            </div>

            <div>
              <label htmlFor="opening-hours" className="field-label">
                {t("settings.openingHoursLabel")}
              </label>
              <textarea
                id="opening-hours"
                className="input-field"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="Mon–Sat, 10am – 8pm"
                rows={2}
                style={{ borderRadius: 10, borderColor: "#E0DAD0", resize: "vertical" }}
              />
            </div>

            <div>
              <label htmlFor="google-review-link" className="field-label">
                {t("settings.googleReviewLabel")}
              </label>
              <p className="text-body" style={{ margin: "6px 0 8px", fontSize: 14 }}>
                {t("settings.reviewRequestHelp")}
              </p>
              <input
                id="google-review-link"
                type="url"
                className="input-field"
                value={googleReviewLink}
                onChange={(e) => setGoogleReviewLink(e.target.value)}
                placeholder="https://g.page/r/..."
                style={{ borderRadius: 10, borderColor: "#E0DAD0" }}
              />
            </div>

            <div>
              <label htmlFor="daily-revenue-target" className="field-label">
                {t("settings.revenueTargetLabel")}
              </label>
              <p className="text-body" style={{ margin: "6px 0 8px", fontSize: 14 }}>
                {t("settings.revenueTargetHelp")}
              </p>
              <input
                id="daily-revenue-target"
                type="number"
                min={0}
                step="1"
                className="input-field"
                value={dailyRevenueTarget}
                onChange={(e) => setDailyRevenueTarget(e.target.value)}
                placeholder="e.g. 5000"
                style={{ borderRadius: 10, borderColor: "#E0DAD0" }}
              />
            </div>

            {error ? (
              <p style={{ margin: 0, fontSize: 13, color: "#D94F4F" }}>{error}</p>
            ) : null}

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="primary-button"
              style={{ minHeight: 44, borderRadius: 10, justifySelf: "start" }}
            >
              {savingProfile ? t("common.saving") : t("settings.saveSalonDetails")}
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t("settings.securityEyebrow")}</p>
              <h2>{t("settings.changePasswordHeading")}</h2>
            </div>
          </div>

          <div style={{ maxWidth: 520, display: "grid", gap: 14 }}>
            <div>
              <label htmlFor="new-password" className="field-label">
                {t("settings.newPassword")}
              </label>
              <input
                id="new-password"
                type="password"
                className="input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                style={{ borderRadius: 10, borderColor: "#E0DAD0" }}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="field-label">
                {t("settings.confirmPassword")}
              </label>
              <input
                id="confirm-password"
                type="password"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                style={{ borderRadius: 10, borderColor: "#E0DAD0" }}
              />
            </div>
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="primary-button"
              style={{ minHeight: 44, borderRadius: 10, justifySelf: "start" }}
            >
              {savingPassword ? t("settings.updating") : t("settings.updatePassword")}
            </button>
          </div>
        </section>
      </div>

      <Toast
        message={toast.message}
        show={toast.show}
        variant={toast.variant}
        onDismiss={() => setToast((t) => ({ ...t, show: false }))}
      />
    </>
  );
}
