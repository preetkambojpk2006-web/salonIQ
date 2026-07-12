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
    meta?: { commissionWarning?: boolean; inventoryWarnings?: string[] }
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
  const [splitMode, setSplitMode] = useState(false);
  const [cashInput, setCashInput] = useState("0");
  const [upiInput, setUpiInput] = useState("0");
  const bookingAmount = initialAmountValue(appointment);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    setAmountInput(bookingAmount);
    setAmountError(null);
    setSplitMode(false);
    setCashInput("0");
    setUpiInput("0");
  }, [appointment.id, bookingAmount]);

  const handleClose = useCallback(() => {
    if (isSaving) return;
    dialogRef.current?.close();
    onClose();
  }, [isSaving, onClose]);

  const normalizedAmount = parseAmountInput(amountInput);
  const cashValue = parseAmountInput(cashInput);
  const upiValue = parseAmountInput(upiInput);
  const splitMatches =
    normalizedAmount > 0 && cashValue + upiValue === normalizedAmount;

  const enterSplit = () => {
    setAmountError(null);
    setCashInput(String(normalizedAmount));
    setUpiInput("0");
    setSplitMode(true);
  };

  const exitSplit = () => {
    setSplitMode(false);
    setAmountError(null);
  };

  const handleCashChange = (value: string) => {
    setCashInput(value);
    const remaining = normalizedAmount - parseAmountInput(value);
    setUpiInput(String(remaining > 0 ? remaining : 0));
  };

  const handleUpiChange = (value: string) => {
    setUpiInput(value);
    const remaining = normalizedAmount - parseAmountInput(value);
    setCashInput(String(remaining > 0 ? remaining : 0));
  };

  const handlePay = async (method: PaymentMethod) => {
    const isPaid = method === "cash" || method === "upi" || method === "split";

    setAmountError(null);
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.set("appointment_id", appointment.id);
      formData.set("method", method);

      if (isPaid) {
        formData.set("amount", String(normalizedAmount));
      }

      if (method === "split") {
        formData.set("cash_amount", String(cashValue));
        formData.set("upi_amount", String(upiValue));
      }

      const result = await recordAppointmentPayment(formData);

      if (!result.ok) {
        onError(result.error);
        return;
      }

      onSuccess(method, {
        commissionWarning: result.commissionWarning === true,
        inventoryWarnings: result.inventoryWarnings,
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
                  disabled={isSaving || splitMode}
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

        {splitMode ? (
          <div className="payment-modal-split">
            <div className="payment-modal-split-fields">
              <label className="payment-modal-amount-field">
                <span className="payment-modal-amount-label">
                  {t("payment.cashAmount")}
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
                    value={cashInput}
                    disabled={isSaving}
                    onChange={(event) => handleCashChange(event.target.value)}
                    onBlur={() => setCashInput(String(cashValue))}
                    aria-label={t("payment.cashAmount")}
                  />
                </span>
              </label>
              <label className="payment-modal-amount-field">
                <span className="payment-modal-amount-label">
                  {t("payment.upiAmount")}
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
                    value={upiInput}
                    disabled={isSaving}
                    onChange={(event) => handleUpiChange(event.target.value)}
                    onBlur={() => setUpiInput(String(upiValue))}
                    aria-label={t("payment.upiAmount")}
                  />
                </span>
              </label>
            </div>

            <p
              className="payment-modal-meta"
              style={{ marginTop: 4, fontWeight: 600 }}
            >
              {t("payment.splitTotal", { total: String(normalizedAmount) })}
            </p>

            {!splitMatches ? (
              <p
                className="alert-danger"
                role="alert"
                style={{ marginTop: 8, marginBottom: 0 }}
              >
                {t("payment.splitMismatch", { total: String(normalizedAmount) })}
              </p>
            ) : null}

            <div className="payment-modal-actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="payment-btn-mint"
                disabled={isSaving || !splitMatches}
                onClick={() => handlePay("split")}
              >
                {isSaving ? (
                  t("common.saving")
                ) : (
                  <span className="payment-btn-label">
                    <Check size={16} strokeWidth={1.5} aria-hidden />
                    {t("payment.confirmSplit")}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="payment-btn-ghost"
                disabled={isSaving}
                onClick={exitSplit}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        ) : (
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
              disabled={isSaving}
              onClick={enterSplit}
            >
              {t("payment.split")}
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
        )}
      </div>
    </dialog>
  );
}
