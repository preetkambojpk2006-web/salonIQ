"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookingLinkCard } from "@/components/booking/BookingLinkCard";
import { WalkinQrCard } from "@/components/walkin/WalkinQrCard";
import { Toast } from "@/components/ui/toast";
import type { RewardType } from "@/lib/customers/loyalty-types";
import {
  changePassword,
  updateBusinessSettings,
  updateLoyaltySettings,
} from "@/lib/settings/actions";

type SettingsViewProps = {
  initialName: string;
  initialPhone: string;
  initialEmail: string;
  initialOpeningHours: string;
  initialGoogleReviewLink: string;
  initialDailyRevenueTarget?: string;
  initialRewardEnabled?: boolean;
  initialRewardType?: RewardType;
  initialRewardThreshold?: string;
  initialRewardDescription?: string;
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
  initialRewardEnabled = false,
  initialRewardType = "visits",
  initialRewardThreshold = "10",
  initialRewardDescription = "",
  bookingSlug = null,
  salonName,
}: SettingsViewProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [openingHours, setOpeningHours] = useState(initialOpeningHours);
  const [googleReviewLink, setGoogleReviewLink] = useState(initialGoogleReviewLink);
  const [dailyRevenueTarget, setDailyRevenueTarget] = useState(
    initialDailyRevenueTarget
  );
  const [rewardEnabled, setRewardEnabled] = useState(initialRewardEnabled);
  const [rewardType, setRewardType] = useState<RewardType>(initialRewardType);
  const [rewardThreshold, setRewardThreshold] = useState(initialRewardThreshold);
  const [rewardDescription, setRewardDescription] = useState(
    initialRewardDescription
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLoyalty, setSavingLoyalty] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null);
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
    setRewardEnabled(initialRewardEnabled);
    setRewardType(initialRewardType);
    setRewardThreshold(initialRewardThreshold);
    setRewardDescription(initialRewardDescription);
  }, [
    initialName,
    initialPhone,
    initialEmail,
    initialOpeningHours,
    initialGoogleReviewLink,
    initialDailyRevenueTarget,
    initialRewardEnabled,
    initialRewardType,
    initialRewardThreshold,
    initialRewardDescription,
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

    showToast("Settings save ho gayi ✓", "success");
    router.refresh();
  };

  const handleSaveLoyalty = async () => {
    setSavingLoyalty(true);
    setLoyaltyError(null);

    const formData = new FormData();
    formData.set("reward_enabled", rewardEnabled ? "true" : "false");
    formData.set("reward_type", rewardType);
    formData.set("reward_threshold", rewardThreshold);
    formData.set("reward_description", rewardDescription);

    const result = await updateLoyaltySettings(formData);
    setSavingLoyalty(false);

    if (!result.ok) {
      setLoyaltyError(result.error);
      showToast(result.error, "error");
      return;
    }

    showToast("Loyalty settings save ho gayi ✓", "success");
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
    showToast("Password update ho gaya ✓", "success");
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
                <p className="eyebrow">Walk-in queue</p>
                <h2>QR code</h2>
              </div>
            </div>
            <WalkinQrCard slug={bookingSlug} businessName={salonName} />
          </section>
        ) : null}

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Customer loyalty</p>
              <h2>Repeat customers ko reward</h2>
            </div>
          </div>

          <p className="text-body" style={{ margin: "0 0 16px", fontSize: 14 }}>
            Regular customers ko visit ya spend ke hisaab se reward do — progress
            customer card par dikhega aur WhatsApp se bhi bhej sakte ho.
          </p>

          <div style={{ maxWidth: 520, display: "grid", gap: 14 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={rewardEnabled}
                onChange={(e) => setRewardEnabled(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "#1FA873" }}
              />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>
                Loyalty reward on karein
              </span>
            </label>

            <fieldset
              style={{
                margin: 0,
                padding: 0,
                border: "none",
                display: "grid",
                gap: 8,
                opacity: rewardEnabled ? 1 : 0.55,
              }}
              disabled={!rewardEnabled}
            >
              <legend className="field-label" style={{ marginBottom: 4 }}>
                Reward kaise milega?
              </legend>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  cursor: rewardEnabled ? "pointer" : "not-allowed",
                }}
              >
                <input
                  type="radio"
                  name="reward_type"
                  value="visits"
                  checked={rewardType === "visits"}
                  onChange={() => setRewardType("visits")}
                />
                Kitni visits ke baad (e.g. har 10 visits par)
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  cursor: rewardEnabled ? "pointer" : "not-allowed",
                }}
              >
                <input
                  type="radio"
                  name="reward_type"
                  value="spend"
                  checked={rewardType === "spend"}
                  onChange={() => setRewardType("spend")}
                />
                Kitna kharch (₹) ke baad (e.g. ₹5000 spend par)
              </label>
            </fieldset>

            <div style={{ opacity: rewardEnabled ? 1 : 0.55 }}>
              <label htmlFor="reward-threshold" className="field-label">
                {rewardType === "visits"
                  ? "Kitni visits par reward?"
                  : "Kitne ₹ kharch par reward?"}
              </label>
              <input
                id="reward-threshold"
                type="number"
                min={1}
                step={rewardType === "visits" ? 1 : 100}
                className="input-field"
                value={rewardThreshold}
                onChange={(e) => setRewardThreshold(e.target.value)}
                disabled={!rewardEnabled}
                placeholder={rewardType === "visits" ? "e.g. 10" : "e.g. 5000"}
                style={{ borderRadius: 10, borderColor: "#E0DAD0" }}
              />
            </div>

            <div style={{ opacity: rewardEnabled ? 1 : 0.55 }}>
              <label htmlFor="reward-description" className="field-label">
                Customer ko kya milega?
              </label>
              <p className="text-body" style={{ margin: "6px 0 8px", fontSize: 14 }}>
                Yeh customer card aur WhatsApp message mein dikhega.
              </p>
              <input
                id="reward-description"
                type="text"
                className="input-field"
                value={rewardDescription}
                onChange={(e) => setRewardDescription(e.target.value)}
                disabled={!rewardEnabled}
                placeholder="e.g. Free Haircut"
                style={{ borderRadius: 10, borderColor: "#E0DAD0" }}
              />
            </div>

            {loyaltyError ? (
              <p style={{ margin: 0, fontSize: 13, color: "#D94F4F" }} role="alert">
                {loyaltyError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleSaveLoyalty}
              disabled={savingLoyalty}
              className="primary-button"
              style={{ minHeight: 44, borderRadius: 10, justifySelf: "start" }}
            >
              {savingLoyalty ? "Saving…" : "Loyalty settings save karein"}
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Salon settings</p>
              <h2>Salon details</h2>
            </div>
          </div>

          <div style={{ maxWidth: 520, display: "grid", gap: 14 }}>
            <div>
              <label htmlFor="salon-name" className="field-label">
                Salon name
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
                Phone
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
                Email
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
                Opening hours
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
                Google Review Link
              </label>
              <p className="text-body" style={{ margin: "6px 0 8px", fontSize: 14 }}>
                Payment ke baad customers ko review request bhej sakte hain.
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
                Aaj ka revenue target (₹)
              </label>
              <p className="text-body" style={{ margin: "6px 0 8px", fontSize: 14 }}>
                Today dashboard par progress bar is target ke against dikhega. Khali
                chhodne par target off rahega.
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
              {savingProfile ? "Saving…" : "Save salon details"}
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Security</p>
              <h2>Change password</h2>
            </div>
          </div>

          <div style={{ maxWidth: 520, display: "grid", gap: 14 }}>
            <div>
              <label htmlFor="new-password" className="field-label">
                Naya password
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
                Password confirm karein
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
              {savingPassword ? "Updating…" : "Update password"}
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
