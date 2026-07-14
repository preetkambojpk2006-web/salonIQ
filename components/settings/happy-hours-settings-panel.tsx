"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Toast } from "@/components/ui/toast";
import {
  createHappyHourRule,
  deleteHappyHourRule,
  toggleHappyHourRule,
} from "@/lib/happy-hours/actions";
import {
  DAY_OF_WEEK_KEYS,
  formatHappyHourTimeRange,
} from "@/lib/pricing/happy-hours";
import type { HappyHourRecord } from "@/lib/pricing/types";
import { useT } from "@/lib/i18n/LanguageContext";

type HappyHoursSettingsPanelProps = {
  initialRules?: HappyHourRecord[];
};

const fieldStyle: React.CSSProperties = {
  borderRadius: 10,
  borderColor: "#E0DAD0",
};

export function HappyHoursSettingsPanel({
  initialRules = [],
}: HappyHoursSettingsPanelProps) {
  const { t } = useT();
  const router = useRouter();
  const [rules, setRules] = useState(initialRules);
  const [dayOfWeek, setDayOfWeek] = useState("2");
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("16:00");
  const [discountPercent, setDiscountPercent] = useState("20");
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "success" });

  useEffect(() => {
    setRules(initialRules);
  }, [initialRules]);

  const handleCreate = () => {
    setError(null);
    const formData = new FormData();
    formData.set("day_of_week", dayOfWeek);
    formData.set("start_time", startTime);
    formData.set("end_time", endTime);
    formData.set("discount_percent", discountPercent);

    startTransition(async () => {
      const result = await createHappyHourRule(formData);
      if (!result.ok) {
        setError(result.error);
        setToast({ show: true, message: result.error, variant: "error" });
        return;
      }

      setShowAddForm(false);
      setToast({
        show: true,
        message: t("settings.happyHoursSaved"),
        variant: "success",
      });
      router.refresh();
    });
  };

  const handleToggle = (rule: HappyHourRecord) => {
    const formData = new FormData();
    formData.set("rule_id", rule.id);
    formData.set("is_active", rule.is_active ? "false" : "true");

    startTransition(async () => {
      const result = await toggleHappyHourRule(formData);
      if (!result.ok) {
        setToast({ show: true, message: result.error, variant: "error" });
        return;
      }
      router.refresh();
    });
  };

  const handleDelete = (ruleId: string) => {
    const formData = new FormData();
    formData.set("rule_id", ruleId);

    startTransition(async () => {
      const result = await deleteHappyHourRule(formData);
      if (!result.ok) {
        setToast({ show: true, message: result.error, variant: "error" });
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      <section className="panel" id="happy-hours-settings-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{t("settings.happyHoursEyebrow")}</p>
            <h2>{t("settings.happyHours")}</h2>
          </div>
          {!showAddForm ? (
            <button
              type="button"
              className="primary-button"
              style={{ minHeight: 36, borderRadius: 10 }}
              onClick={() => setShowAddForm(true)}
            >
              {t("settings.happyHoursAdd")}
            </button>
          ) : null}
        </div>

        {rules.length === 0 && !showAddForm ? (
          <p className="text-body" style={{ margin: 0, fontSize: 14, color: "#8A8A8A" }}>
            {t("settings.happyHoursEmpty")}
          </p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {rules.map((rule) => (
              <article
                key={rule.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: 16,
                  border: "1px solid #E0DAD0",
                  background: rule.is_active ? "#F9F8F3" : "#fff",
                  opacity: rule.is_active ? 1 : 0.65,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#1A1A1A",
                    }}
                  >
                    {t(DAY_OF_WEEK_KEYS[rule.day_of_week] ?? DAY_OF_WEEK_KEYS[0])}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8A8A8A" }}>
                    {formatHappyHourTimeRange(rule.start_time, rule.end_time)} ·{" "}
                    {rule.discount_percent}%
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#1A1A1A",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={rule.is_active}
                      disabled={isPending}
                      onChange={() => handleToggle(rule)}
                      style={{ width: 16, height: 16, accentColor: "#1FA873" }}
                    />
                    {t("common.active")}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDelete(rule.id)}
                    disabled={isPending}
                    aria-label={t("common.delete")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      border: "1px solid #E0DAD0",
                      background: "#fff",
                      color: "#8A8A8A",
                      cursor: isPending ? "wait" : "pointer",
                    }}
                  >
                    <Trash2 size={16} strokeWidth={1.5} aria-hidden />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {showAddForm ? (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 16,
              border: "1px solid #E0DAD0",
              background: "#F9F8F3",
              display: "grid",
              gap: 12,
              maxWidth: 520,
            }}
          >
            <div>
              <label htmlFor="happy-hour-day" className="field-label">
                {t("settings.happyHoursDay")}
              </label>
              <select
                id="happy-hour-day"
                className="input-field"
                value={dayOfWeek}
                onChange={(event) => setDayOfWeek(event.target.value)}
                style={fieldStyle}
              >
                {DAY_OF_WEEK_KEYS.map((key, index) => (
                  <option key={key} value={String(index)}>
                    {t(key)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="happy-hour-start" className="field-label">
                  {t("settings.happyHoursTime")} ({t("settings.happyHoursStart")})
                </label>
                <input
                  id="happy-hour-start"
                  type="time"
                  className="input-field"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  style={fieldStyle}
                />
              </div>
              <div>
                <label htmlFor="happy-hour-end" className="field-label">
                  {t("settings.happyHoursTime")} ({t("settings.happyHoursEnd")})
                </label>
                <input
                  id="happy-hour-end"
                  type="time"
                  className="input-field"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  style={fieldStyle}
                />
              </div>
            </div>

            <div>
              <label htmlFor="happy-hour-discount" className="field-label">
                {t("settings.happyHoursDiscount")}
              </label>
              <input
                id="happy-hour-discount"
                type="number"
                min={1}
                max={100}
                step={1}
                className="input-field"
                value={discountPercent}
                onChange={(event) => setDiscountPercent(event.target.value)}
                style={fieldStyle}
              />
            </div>

            {error ? (
              <p style={{ margin: 0, fontSize: 13, color: "#D94F4F" }}>{error}</p>
            ) : null}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="primary-button"
                style={{ minHeight: 44, borderRadius: 10 }}
                disabled={isPending}
                onClick={handleCreate}
              >
                {isPending ? t("common.saving") : t("common.save")}
              </button>
              <button
                type="button"
                className="btn-ghost-os"
                disabled={isPending}
                onClick={() => {
                  setShowAddForm(false);
                  setError(null);
                }}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <Toast
        message={toast.message}
        show={toast.show}
        variant={toast.variant}
        onDismiss={() => setToast({ show: false, message: "", variant: "success" })}
      />
    </>
  );
}
