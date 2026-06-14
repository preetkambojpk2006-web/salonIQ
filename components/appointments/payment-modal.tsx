"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { recordAppointmentPayment } from "@/lib/payments/actions";
import type { Appointment } from "@/lib/appointments/types";
import { VibeCard } from "@/components/appointments/vibe-card";
import type { CustomerReliability } from "@/lib/customers/types";
import type { PaymentMethod } from "@/lib/payments/types";
import { useT } from "@/lib/i18n/LanguageContext";

type PaymentModalProps = {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: (method: PaymentMethod) => void;
  onError: (message: string) => void;
};

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
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
      }}
    >
      {isWarning
        ? t("appointment.reliabilityWarning")
        : t("appointment.reliabilityBlacklist")}
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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  const handleClose = useCallback(() => {
    if (isSaving) return;
    dialogRef.current?.close();
    onClose();
  }, [isSaving, onClose]);

  const handlePay = async (method: PaymentMethod) => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.set("appointment_id", appointment.id);
      formData.set("method", method);

      const result = await recordAppointmentPayment(formData);

      if (!result.ok) {
        onError(result.error);
        return;
      }

      onSuccess(method);
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

  const amount = appointment.total_amount > 0 ? appointment.total_amount : 0;
  const customer = appointment.customer_name ?? t("appointment.customer");

  return (
    <dialog ref={dialogRef} className="payment-modal" onClose={onClose}>
      <div className="payment-modal-form">
        {appointment.customer_reliability === "warning" ||
        appointment.customer_reliability === "blacklisted" ? (
          <ReliabilityAlert reliability={appointment.customer_reliability} />
        ) : null}

        <VibeCard notes={appointment.customer_notes} />

        <div className="payment-modal-header">
          <div>
            <p className="eyebrow">{t("payment.title")}</p>
            <h3>{t("payment.completeCollect")}</h3>
            <p className="payment-modal-meta">
              {customer}
              {appointment.service_name ? ` · ${appointment.service_name}` : ""}
            </p>
            <p className="payment-modal-amount">{formatRs(amount)}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="payment-modal-close"
            aria-label={t("common.close")}
            disabled={isSaving}
          >
            ✕
          </button>
        </div>

        <div className="payment-modal-actions">
          <button
            type="button"
            className="payment-btn-mint"
            disabled={isSaving}
            onClick={() => handlePay("cash")}
          >
            {isSaving ? t("common.saving") : t("payment.cash")}
          </button>
          <button
            type="button"
            className="payment-btn-mint"
            disabled={isSaving}
            onClick={() => handlePay("upi")}
          >
            {isSaving ? t("common.saving") : t("payment.upi")}
          </button>
          <button
            type="button"
            className="payment-btn-ghost"
            disabled={isSaving}
            onClick={() => handlePay("pending")}
          >
            {isSaving ? t("common.saving") : t("payment.markPending")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
