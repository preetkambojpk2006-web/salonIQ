"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { settleStaffPayout } from "@/lib/staff/actions";
import type { StaffPayoutsSummary } from "@/lib/staff/types";

type StaffPayoutsProps = {
  payouts: StaffPayoutsSummary;
};

const TOKENS = {
  bgMain: "#EDE8DF",
  textDark: "#1A1A1A",
  textMuted: "#8A8A8A",
  borderSubtle: "#E0DAD0",
  accentGreen: "#1FA873",
  accentGreenSoft: "#D4E8DD",
  accentBeige: "#E8D9C0",
};

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function SettleButton({ staffName }: { staffName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSettle = () => {
    setError(null);
    const formData = new FormData();
    formData.set("staff_name", staffName);

    startTransition(async () => {
      const result = await settleStaffPayout(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button
        type="button"
        onClick={handleSettle}
        disabled={isPending}
        style={{
          minHeight: 36,
          padding: "0 14px",
          borderRadius: 10,
          border: 0,
          background: TOKENS.accentGreen,
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          cursor: isPending ? "wait" : "pointer",
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? "Settling…" : "Settle"}
      </button>
      {error ? (
        <span style={{ fontSize: 11, color: "#D94F4F", maxWidth: 120, textAlign: "right" }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function StaffPayouts({ payouts }: StaffPayoutsProps) {
  const { rows, totalUnpaid } = payouts;

  return (
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
        Staff payouts
      </p>
      <h2
        style={{
          margin: "4px 0 0",
          fontSize: 18,
          fontWeight: 800,
          color: TOKENS.textDark,
        }}
      >
        Baaki commission
      </h2>

      {rows.length === 0 ? (
        <p
          style={{
            margin: "14px 0 0",
            fontSize: 14,
            color: TOKENS.textMuted,
            lineHeight: 1.45,
          }}
        >
          Sab staff commission settle ho chuka hai.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {rows.map((row) => (
            <article
              key={row.staffName}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 16,
                border: `1px solid ${TOKENS.borderSubtle}`,
                background: "#fff",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: TOKENS.textDark,
                  }}
                >
                  {row.staffName}
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 13,
                    color: TOKENS.textMuted,
                  }}
                >
                  Unpaid commission
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <strong
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: TOKENS.accentGreen,
                  }}
                >
                  {formatInr(row.unpaidAmount)}
                </strong>
                <SettleButton staffName={row.staffName} />
              </div>
            </article>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: `1px solid ${TOKENS.borderSubtle}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: TOKENS.textDark }}>
          Kul baaki
        </span>
        <strong style={{ fontSize: 18, fontWeight: 800, color: TOKENS.textDark }}>
          {formatInr(totalUnpaid)}
        </strong>
      </div>
    </section>
  );
}
