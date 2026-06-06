"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { recordAppointmentPayment } from "@/lib/payments/actions";
import type { Appointment } from "@/lib/appointments/types";
import type { PaymentMethod } from "@/lib/payments/types";

type PaymentModalProps = {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: (method: PaymentMethod) => void;
  onError: (message: string) => void;
};

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function PaymentModal({
  appointment,
  onClose,
  onSuccess,
  onError,
}: PaymentModalProps) {
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
        err instanceof Error ? err.message : "Could not save payment.";
      onError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const amount = appointment.total_amount > 0 ? appointment.total_amount : 0;
  const customer = appointment.customer_name ?? "Customer";

  return (
    <dialog ref={dialogRef} className="payment-modal" onClose={onClose}>
      <div className="payment-modal-form">
        <div className="payment-modal-header">
          <div>
            <p className="eyebrow">Payment</p>
            <h3>Complete & collect</h3>
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
            aria-label="Close"
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
            {isSaving ? "Saving…" : "Cash ✓"}
          </button>
          <button
            type="button"
            className="payment-btn-mint"
            disabled={isSaving}
            onClick={() => handlePay("upi")}
          >
            {isSaving ? "Saving…" : "UPI ✓"}
          </button>
          <button
            type="button"
            className="payment-btn-ghost"
            disabled={isSaving}
            onClick={() => handlePay("pending")}
          >
            {isSaving ? "Saving…" : "Mark Pending"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
