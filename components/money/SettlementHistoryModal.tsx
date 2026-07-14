"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, MessageCircle, X } from "lucide-react";
import { getStaffSettlementHistory } from "@/lib/staff/actions";
import type { StaffSettlementRecord } from "@/lib/staff/types";
import { SALON_TIMEZONE } from "@/lib/payments/date-utils";
import { openWhatsAppReminder } from "@/lib/whatsapp/sendLink";
import { useT } from "@/lib/i18n/LanguageContext";

type SettlementHistoryModalProps = {
  staffName: string;
  salonName: string;
  phone: string | null;
  onClose: () => void;
};

const TOKENS = {
  bgPanel: "#F9F8F3",
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

function formatAmount(amount: number): string {
  return amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function formatSettlementDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: SALON_TIMEZONE,
  });
}

export function SettlementHistoryModal({
  staffName,
  salonName,
  phone,
  onClose,
}: SettlementHistoryModalProps) {
  const { t } = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<StaffSettlementRecord[]>([]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const rows = await getStaffSettlementHistory(staffName);
      if (!cancelled) {
        setRecords(rows);
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [staffName]);

  const handleClose = useCallback(() => {
    dialogRef.current?.close();
    onClose();
  }, [onClose]);

  const latest = records[0] ?? null;

  const handleShareLatest = () => {
    if (!latest) return;
    const deductions = latest.finesDeducted + latest.advancesDeducted;
    const message = t("whatsapp.settlementMessage", {
      staffName,
      date: formatSettlementDate(latest.settledAt),
      gross: formatAmount(latest.grossCommission),
      deductions: formatAmount(deductions),
      net: formatAmount(latest.netPaid),
      salonName,
    });
    openWhatsAppReminder(phone, message);
  };

  return (
    <dialog
      ref={dialogRef}
      className="payment-modal-dialog"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) handleClose();
      }}
    >
      <div
        style={{
          width: "min(100%, 520px)",
          borderRadius: 16,
          border: `1px solid ${TOKENS.borderSubtle}`,
          background: TOKENS.bgPanel,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ minWidth: 0 }}>
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
              {staffName}
            </p>
            <h2
              style={{
                margin: "4px 0 0",
                fontSize: 18,
                fontWeight: 800,
                color: TOKENS.textDark,
              }}
            >
              {t("staff.settlementHistory")}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label={t("common.close")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 10,
              border: `1px solid ${TOKENS.borderSubtle}`,
              background: "#fff",
              color: TOKENS.textDark,
              cursor: "pointer",
            }}
          >
            <X size={16} strokeWidth={1.5} aria-hidden />
          </button>
        </div>

        {loading ? (
          <p style={{ margin: 0, fontSize: 14, color: TOKENS.textMuted }}>
            {t("common.loading")}
          </p>
        ) : records.length === 0 ? (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: TOKENS.textMuted,
              lineHeight: 1.45,
            }}
          >
            {t("staff.noSettlements")}
          </p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {records.map((record) => {
              const deductions = record.finesDeducted + record.advancesDeducted;
              return (
                <article
                  key={record.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 16,
                    border: `1px solid ${TOKENS.borderSubtle}`,
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    <Clock size={16} strokeWidth={1.5} color={TOKENS.textMuted} aria-hidden />
                    <span style={{ fontSize: 13, fontWeight: 700, color: TOKENS.textDark }}>
                      {t("staff.settledOn", {
                        date: formatSettlementDate(record.settledAt),
                      })}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: 8,
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: TOKENS.textMuted }}>
                        {t("staff.grossCommission")}
                      </p>
                      <strong style={{ fontSize: 14, color: TOKENS.textDark }}>
                        {formatInr(record.grossCommission)}
                      </strong>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: TOKENS.textMuted }}>
                        {t("staff.deductions")}
                      </p>
                      <strong style={{ fontSize: 14, color: TOKENS.accentCoral }}>
                        {deductions > 0 ? `−${formatInr(deductions)}` : formatInr(0)}
                      </strong>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: TOKENS.textMuted }}>
                        {t("staff.netPaid")}
                      </p>
                      <strong style={{ fontSize: 14, color: TOKENS.accentGreen }}>
                        {formatInr(record.netPaid)}
                      </strong>
                    </div>
                  </div>
                  {record.note ? (
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: 12,
                        color: TOKENS.textMuted,
                        lineHeight: 1.4,
                      }}
                    >
                      {record.note}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}

        {latest ? (
          <button
            type="button"
            onClick={handleShareLatest}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              width: "100%",
              minHeight: 40,
              marginTop: 16,
              padding: "0 14px",
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
        ) : null}
      </div>
    </dialog>
  );
}
