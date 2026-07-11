"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Ban, Check, X } from "lucide-react";
import { recordAppointmentPayment } from "@/lib/payments/actions";
import type { Appointment } from "@/lib/appointments/types";
import { VibeCard } from "@/components/appointments/vibe-card";
import type { CustomerReliability } from "@/lib/customers/types";
import type { PaymentMethod } from "@/lib/payments/types";
import { useT } from "@/lib/i18n/LanguageContext";

type PaymentModalProps = {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: (
    method: PaymentMethod,
    meta?: { commissionWarning?: boolean }
  ) => void;
  onError: (message: string) => void;
};

function initialAmountValue(appointment: Appointment): string {
  const raw = appointment.total_amount;
  if (!Number.isFinite(raw) || raw < 0) return "0";
  return String(Math.round(raw));
}

function parseAmountInput(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
}

function ReliabilityAlert({
  reliability,
}: {
  reliability: CustomerReliability;
}) {
  const { t } = useT();
  if (reliability === "good") return null;

  const isWarning = reliability === "warning";

  return (
    <div
      role="status"
      style={{
        width: "100%",
        marginBottom: 12,
        padding: "8px 12px",
        borderRadius: 10,
        border: `1px solid ${isWarning ? "#C9A96E" : "#D94F4F"}`,
        background: isWarning ? "#E8D9C0" : "#FCE8E8",
        fontSize: 13,
        fontWeight: 600,
        color: "#1A1A1A",
        lineHeight: 1.4,
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      {isWarning ? (
        <AlertTriangle size={16} strokeWidth={1.5} className="shrink-0" aria-hidden />
      ) : (
        <Ban size={16} strokeWidth={1.5} className="shrink-0" aria-hidden />
      )}
      <span>
        {isWarning
          ? t("appointment.reliabilityWarning")
          : t("appointment.reliabilityBlacklist")}
      </span>
    </div>
  );
}

export function PaymentModal({
  appointment,
  onClose,
  onSuccess,
  onError,
}: PaymentModalProps) {
  const { t } = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState(() =>
    initialAmountValue(appointment)
  );
  const bookingAmount = initialAmountValue(appointment);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    setAmountInput(bookingAmount);
    setAmountError(null);
  }, [appointment.id, bookingAmount]);

  const handleClose = useCallback(() => {
    if (isSaving) return;
    dialogRef.current?.close();
    onClose();
  }, [isSaving, onClose]);

  const normalizedAmount = parseAmountInput(amountInput);

  const handlePay = async (method: PaymentMethod) => {
    const isPaid = method === "cash" || method === "upi";

    setAmountError(null);
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.set("appointment_id", appointment.id);
      formData.set("method", method);

      if (isPaid) {
        formData.set("amount", String(normalizedAmount));
      }

      const result = await recordAppointmentPayment(formData);

      if (!result.ok) {
        onError(result.error);
        return;
      }

      onSuccess(method, {
        commissionWarning: result.commissionWarning === true,
      });
      dialogRef.current?.close();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("payment.saveError");
      onError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const canMarkPending =
    appointment.payment_status !== "paid" && appointment.status !== "completed";
  const customer = appointment.customer_name ?? t("appointment.customer");

  return (
    <dialog ref={dialogRef} className="payment-modal" onClose={onClose}>
      <div className="payment-modal-form">
        {appointment.customer_reliability === "warning" ||
        appointment.customer_reliability === "blacklisted" ? (
          <ReliabilityAlert reliability={appointment.customer_reliability} />
        ) : null}

        <VibeCard
          notes={appointment.notes}
          customerNotes={appointment.customer_notes}
        />

        <div className="payment-modal-header">
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="eyebrow">{t("payment.title")}</p>
            <h3>{t("payment.completeCollect")}</h3>
            <p className="payment-modal-meta">
              {customer}
              {appointment.service_name ? ` · ${appointment.service_name}` : ""}
            </p>

            <label className="payment-modal-amount-field">
              <span className="payment-modal-amount-label">
                {t("payment.amountLabel")}
              </span>
              <span className="payment-modal-amount-control">
                <span className="payment-modal-amount-symbol" aria-hidden>
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className="payment-modal-amount-input"
                  value={amountInput}
                  disabled={isSaving}
                  onChange={(event) => setAmountInput(event.target.value)}
                  onBlur={() => {
                    setAmountInput(String(parseAmountInput(amountInput)));
                  }}
                  aria-label={t("payment.amountLabel")}
                />
              </span>
            </label>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="payment-modal-close"
            aria-label={t("common.close")}
            disabled={isSaving}
          >
            <X size={16} strokeWidth={1.5} aria-hidden />
          </button>
        </div>

        {amountError ? (
          <p className="alert-danger" role="alert" style={{ marginBottom: 12 }}>
            {amountError}
          </p>
        ) : null}

        <div className="payment-modal-actions">
          <button
            type="button"
            className="payment-btn-mint"
            disabled={isSaving}
            onClick={() => handlePay("cash")}
          >
            {isSaving ? (
              t("common.saving")
            ) : (
              <span className="payment-btn-label">
                <Check size={16} strokeWidth={1.5} aria-hidden />
                {t("payment.cash")}
              </span>
            )}
          </button>
          <button
            type="button"
            className="payment-btn-mint"
            disabled={isSaving}
            onClick={() => handlePay("upi")}
          >
            {isSaving ? (
              t("common.saving")
            ) : (
              <span className="payment-btn-label">
                <Check size={16} strokeWidth={1.5} aria-hidden />
                {t("payment.upi")}
              </span>
            )}
          </button>
          <button
            type="button"
            className="payment-btn-ghost"
            disabled={isSaving || !canMarkPending}
            onClick={() => handlePay("pending")}
          >
            {isSaving ? t("common.saving") : t("payment.markPending")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
