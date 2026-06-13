"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";
import type { RewardType } from "@/lib/customers/loyalty-types";
import { updateLoyaltySettings } from "@/lib/settings/actions";

type LoyaltySettingsPanelProps = {
  initialRewardEnabled?: boolean;
  initialRewardType?: RewardType;
  initialRewardThreshold?: string;
  initialRewardDescription?: string;
};

export function LoyaltySettingsPanel({
  initialRewardEnabled = false,
  initialRewardType = "visits",
  initialRewardThreshold = "10",
  initialRewardDescription = "",
}: LoyaltySettingsPanelProps) {
  const router = useRouter();
  const [rewardEnabled, setRewardEnabled] = useState(initialRewardEnabled);
  const [rewardType, setRewardType] = useState<RewardType>(initialRewardType);
  const [rewardThreshold, setRewardThreshold] = useState(initialRewardThreshold);
  const [rewardDescription, setRewardDescription] = useState(
    initialRewardDescription
  );
  const [savingLoyalty, setSavingLoyalty] = useState(false);
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "success" });

  useEffect(() => {
    setRewardEnabled(initialRewardEnabled);
    setRewardType(initialRewardType);
    setRewardThreshold(initialRewardThreshold);
    setRewardDescription(initialRewardDescription);
  }, [
    initialRewardEnabled,
    initialRewardType,
    initialRewardThreshold,
    initialRewardDescription,
  ]);

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
      setToast({ show: true, message: result.error, variant: "error" });
      return;
    }

    setToast({
      show: true,
      message: "Loyalty settings save ho gayi ✓",
      variant: "success",
    });
    router.refresh();
  };

  return (
    <>
      <section className="panel" id="loyalty-settings-panel">
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

      <Toast
        message={toast.message}
        show={toast.show}
        variant={toast.variant}
        onDismiss={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </>
  );
}
