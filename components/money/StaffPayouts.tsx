"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Clock, MessageCircle } from "lucide-react";
import { Toast } from "@/components/ui/toast";
import { SettlementHistoryModal } from "@/components/money/SettlementHistoryModal";
import { settleStaffPayout } from "@/lib/staff/actions";
import type { StaffPayoutRow, StaffPayoutsSummary } from "@/lib/staff/types";
import { openWhatsAppReminder } from "@/lib/whatsapp/sendLink";
import { useT } from "@/lib/i18n/LanguageContext";

type StaffContact = {
  name: string;
  phone: string | null;
};

type StaffPayoutsProps = {
  payouts: StaffPayoutsSummary;
  staffContacts?: StaffContact[];
  salonName?: string;
  monthLabel?: string;
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

/** Plain grouped number (no ₹) — the message templates already include ₹. */
function formatAmount(amount: number): string {
  return amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function HistoryButton({
  staffName,
  onOpen,
}: {
  staffName: string;
  onOpen: (staffName: string) => void;
}) {
  const { t } = useT();

  return (
    <button
      type="button"
      onClick={() => onOpen(staffName)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minHeight: 36,
        padding: "0 12px",
        borderRadius: 10,
        border: `1px solid ${TOKENS.borderSubtle}`,
        background: "#fff",
        color: TOKENS.textDark,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      <Clock size={16} strokeWidth={1.5} aria-hidden />
      {t("staff.history")}
    </button>
  );
}

function ShareSalaryButton({
  row,
  phone,
  salonName,
  monthLabel,
}: {
  row: StaffPayoutRow;
  phone: string | null;
  salonName: string;
  monthLabel: string;
}) {
  const { t } = useT();

  const handleShare = () => {
    const deductions = row.fineOutstanding + row.advanceOutstanding;
    const message = t("whatsapp.salaryMessage", {
      staffName: row.staffName,
      month: monthLabel,
      commission: formatAmount(row.grossUnpaid),
      deductions: formatAmount(deductions),
      net: formatAmount(row.netPayable),
      salonName,
    });
    openWhatsAppReminder(phone, message);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minHeight: 36,
        padding: "0 12px",
        borderRadius: 10,
        border: `1px solid ${TOKENS.accentGreen}`,
        background: "#fff",
        color: TOKENS.accentGreen,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      <MessageCircle size={16} strokeWidth={1.5} aria-hidden />
      {t("staff.shareSalary")}
    </button>
  );
}

function PayoutBreakdown({ row }: { row: StaffPayoutRow }) {
  return (
    <div style={{ display: "grid", gap: 2, marginTop: 6 }}>
      <p style={{ margin: 0, fontSize: 12, color: TOKENS.textMuted }}>
        Commission: {formatInr(row.grossUnpaid)}
      </p>
      {row.fineOutstanding > 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: TOKENS.accentCoral }}>
          Fines: −{formatInr(row.fineOutstanding)}
        </p>
      ) : null}
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
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "success" });

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
        setToast({ show: true, message: result.error, variant: "error" });
        return;
      }

      setToast({
        show: true,
        message: `${row.staffName}: ${formatInr(result.grossUnpaid)} commission, ${formatInr(result.fineApplied)} fine, ${formatInr(result.advanceApplied)} advance adjust, net ${formatInr(result.netPaid)} ✓`,
        variant: "success",
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
        variant={toast.variant}
        onDismiss={() => setToast({ show: false, message: "", variant: "success" })}
      />
    </>
  );
}

export function StaffPayouts({
  payouts,
  staffContacts = [],
  salonName = "",
  monthLabel = "",
}: StaffPayoutsProps) {
  const { t } = useT();
  const [historyStaffName, setHistoryStaffName] = useState<string | null>(null);
  const {
    rows,
    totalGrossUnpaid,
    totalFineOutstanding,
    totalAdvanceOutstanding,
    totalNetPayable,
  } = payouts;

  const phoneByName = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const contact of staffContacts) {
      map.set(contact.name.trim().toLowerCase(), contact.phone);
    }
    return map;
  }, [staffContacts]);

  return (
    <>
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
        {t("money.outstandingCommission")}
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
          {t("money.allSettled")}
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
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                <SettleButton row={row} />
                <HistoryButton
                  staffName={row.staffName}
                  onOpen={setHistoryStaffName}
                />
                <ShareSalaryButton
                  row={row}
                  phone={phoneByName.get(row.staffName.trim().toLowerCase()) ?? null}
                  salonName={salonName}
                  monthLabel={monthLabel}
                />
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
          <span style={{ fontSize: 14, color: TOKENS.textMuted }}>{t("money.totalCommission")}</span>
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
          <span style={{ fontSize: 14, color: TOKENS.textMuted }}>{t("money.totalFines")}</span>
          <strong style={{ fontSize: 15, color: TOKENS.accentCoral }}>
            −{formatInr(totalFineOutstanding)}
          </strong>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 14, color: TOKENS.textMuted }}>{t("money.totalAdvance")}</span>
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
            {t("money.totalNetPayable")}
          </span>
          <strong style={{ fontSize: 18, fontWeight: 800, color: TOKENS.accentGreen }}>
            {formatInr(totalNetPayable)}
          </strong>
        </div>
      </div>
      </section>

      {historyStaffName ? (
        <SettlementHistoryModal
          staffName={historyStaffName}
          salonName={salonName}
          phone={phoneByName.get(historyStaffName.trim().toLowerCase()) ?? null}
          onClose={() => setHistoryStaffName(null)}
        />
      ) : null}
    </>
  );
}
