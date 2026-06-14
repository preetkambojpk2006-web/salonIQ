"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Toast } from "@/components/ui/toast";
import { recordStaffAdvance } from "@/lib/staff/actions";
import type { StaffAdvance } from "@/lib/staff/types";
import { useT } from "@/lib/i18n/LanguageContext";

type StaffOption = {
  id: string;
  name: string;
};

type StaffAdvancesProps = {
  advances: StaffAdvance[];
  staffMembers: StaffOption[];
};

const TOKENS = {
  bgMain: "#EDE8DF",
  textDark: "#1A1A1A",
  textMuted: "#8A8A8A",
  borderSubtle: "#E0DAD0",
  accentGreen: "#1FA873",
};

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatAdvanceDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function StaffAdvances({
  advances = [],
  staffMembers = [],
}: StaffAdvancesProps) {
  const { t } = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [staffId, setStaffId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "success" });

  const activeStaff = useMemo(
    () => [...staffMembers].sort((a, b) => a.name.localeCompare(b.name)),
    [staffMembers]
  );

  const selectedStaff = activeStaff.find((member) => member.id === staffId) ?? null;

  const handleSubmit = () => {
    setError(null);

    if (!selectedStaff) {
      setError(t("money.chooseStaffError"));
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t("money.validAmountError"));
      return;
    }

    const formData = new FormData();
    formData.set("staff_name", selectedStaff.name);
    formData.set("staff_id", selectedStaff.id);
    formData.set("amount", String(parsedAmount));
    if (note.trim()) {
      formData.set("note", note.trim());
    }

    startTransition(async () => {
      const result = await recordStaffAdvance(formData);
      if (!result.ok) {
        setError(result.error);
        setToast({ show: true, message: result.error, variant: "error" });
        return;
      }

      setAmount("");
      setNote("");
      setToast({
        show: true,
        message: t("money.advanceRecorded", {
          name: selectedStaff.name,
          amount: formatInr(parsedAmount),
        }),
        variant: "success",
      });
      router.refresh();
    });
  };

  return (
    <div className="staff-advances-panel">
      <section
        style={{
          borderRadius: 16,
          border: `1px solid ${TOKENS.borderSubtle}`,
          background: TOKENS.bgMain,
          padding: 18,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 600,
            color: TOKENS.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Staff advances
        </p>
        <h2
          style={{
            margin: "4px 0 0",
            fontSize: 18,
            fontWeight: 800,
            color: TOKENS.textDark,
          }}
        >
          {t("money.advancesTitle")}
        </h2>
        <p
          style={{
            margin: "8px 0 14px",
            fontSize: 13,
            color: TOKENS.textMuted,
            lineHeight: 1.45,
          }}
        >
          {t("money.advancesIntro")}
        </p>

        {activeStaff.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: TOKENS.textMuted }}>
            {t("money.addStaffBefore")}{" "}
            <a href="/dashboard/services" style={{ color: TOKENS.accentGreen, fontWeight: 700 }}>
              Services & Staff
            </a>{" "}
            {t("money.addStaffAfter")}
          </p>
        ) : (
          <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span className="field-label">Staff</span>
              <select
                className="input-field"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                style={{ borderRadius: 10, borderColor: TOKENS.borderSubtle }}
              >
                <option value="">{t("money.chooseStaff")}</option>
                {activeStaff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span className="field-label">Amount (₹)</span>
              <input
                type="number"
                min={1}
                step="1"
                className="input-field"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 2000"
                style={{ borderRadius: 10, borderColor: TOKENS.borderSubtle }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span className="field-label">Note (optional)</span>
              <input
                type="text"
                className="input-field"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Diwali advance"
                style={{ borderRadius: 10, borderColor: TOKENS.borderSubtle }}
              />
            </label>

            {error ? (
              <p style={{ margin: 0, fontSize: 13, color: "#D94F4F" }} role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="primary-button"
              style={{
                minHeight: 44,
                borderRadius: 10,
                justifySelf: "start",
                opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending ? t("common.saving") : t("money.recordAdvance")}
            </button>
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <h3
            style={{
              margin: "0 0 10px",
              fontSize: 14,
              fontWeight: 800,
              color: TOKENS.textDark,
            }}
          >
            Advance history
          </h3>

          {advances.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14, color: TOKENS.textMuted }}>
              {t("money.noAdvances")}
            </p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {advances.map((advance) => (
                <article
                  key={advance.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${TOKENS.borderSubtle}`,
                    background: "#fff",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 700,
                        color: TOKENS.textDark,
                      }}
                    >
                      {advance.staff_name}
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 12,
                        color: TOKENS.textMuted,
                      }}
                    >
                      {formatAdvanceDate(advance.given_at)}
                      {advance.note ? ` · ${advance.note}` : ""}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <strong
                      style={{
                        display: "block",
                        fontSize: 15,
                        fontWeight: 800,
                        color: TOKENS.textDark,
                      }}
                    >
                      {formatInr(advance.amount)}
                    </strong>
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: 4,
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        background:
                          advance.status === "outstanding" ? "#F5E6A8" : "#E8E4DC",
                        color:
                          advance.status === "outstanding" ? "#7A5C00" : "#5C5C5C",
                      }}
                    >
                      {advance.status === "outstanding" ? "Outstanding" : "Settled"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Toast
        message={toast.message}
        show={toast.show}
        variant={toast.variant}
        onDismiss={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}

export default StaffAdvances;
