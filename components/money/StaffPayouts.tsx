"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Toast } from "@/components/ui/toast";
import { settleStaffPayout } from "@/lib/staff/actions";
import type { StaffPayoutRow, StaffPayoutsSummary } from "@/lib/staff/types";

type StaffPayoutsProps = {
  payouts: StaffPayoutsSummary;
};

const TOKENS = {
  bgMain: "#EDE8DF",
  textDark: "#1A1A1A",
  textMuted: "#8A8A8A",
  borderSubtle: "#E0DAD0",
  accentGreen: "#1FA873",
  accentCoral: "#D94F4F",
};

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function PayoutBreakdown({ row }: { row: StaffPayoutRow }) {
  return (
    <div style={{ display: "grid", gap: 2, marginTop: 6 }}>
      <p style={{ margin: 0, fontSize: 12, color: TOKENS.textMuted }}>
        Commission: {formatInr(row.grossUnpaid)}
      </p>
      {row.advanceOutstanding > 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: TOKENS.accentCoral }}>
          Advance: −{formatInr(row.advanceOutstanding)}
        </p>
      ) : null}
      <p
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 700,
          color: TOKENS.accentGreen,
        }}
      >
        Net: {formatInr(row.netPayable)}
      </p>
    </div>
  );
}

function SettleButton({ row }: { row: StaffPayoutRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: "" });

  const canSettle = row.grossUnpaid > 0;

  const handleSettle = () => {
    if (!canSettle) return;

    setError(null);
    const formData = new FormData();
    formData.set("staff_name", row.staffName);

    startTransition(async () => {
      const result = await settleStaffPayout(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setToast({
        show: true,
        message: `${row.staffName}: ${formatInr(result.grossUnpaid)} commission, ${formatInr(result.advanceApplied)} advance adjust, net ${formatInr(result.netPaid)} ✓`,
      });
      router.refresh();
    });
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
          flexShrink: 0,
        }}
      >
        {canSettle ? (
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
        ) : (
          <span style={{ fontSize: 12, color: TOKENS.textMuted }}>Advance only</span>
        )}
        {error ? (
          <span
            style={{
              fontSize: 11,
              color: TOKENS.accentCoral,
              maxWidth: 140,
              textAlign: "right",
            }}
          >
            {error}
          </span>
        ) : null}
      </div>

      <Toast
        message={toast.message}
        show={toast.show}
        variant="success"
        onDismiss={() => setToast({ show: false, message: "" })}
      />
    </>
  );
}

export function StaffPayouts({ payouts }: StaffPayoutsProps) {
  const {
    rows,
    totalGrossUnpaid,
    totalAdvanceOutstanding,
    totalNetPayable,
  } = payouts;

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
          Sab staff commission settle ho chuka hai aur koi outstanding advance nahi hai.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {rows.map((row) => (
            <article
              key={row.staffName}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 16,
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
                  {row.staffName}
                </p>
                <PayoutBreakdown row={row} />
              </div>
              <SettleButton row={row} />
            </article>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: `1px solid ${TOKENS.borderSubtle}`,
          display: "grid",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 14, color: TOKENS.textMuted }}>Kul commission</span>
          <strong style={{ fontSize: 15, color: TOKENS.textDark }}>
            {formatInr(totalGrossUnpaid)}
          </strong>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 14, color: TOKENS.textMuted }}>Kul advance</span>
          <strong style={{ fontSize: 15, color: TOKENS.accentCoral }}>
            −{formatInr(totalAdvanceOutstanding)}
          </strong>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: TOKENS.textDark }}>
            Kul net payable
          </span>
          <strong style={{ fontSize: 18, fontWeight: 800, color: TOKENS.accentGreen }}>
            {formatInr(totalNetPayable)}
          </strong>
        </div>
      </div>
    </section>
  );
}
