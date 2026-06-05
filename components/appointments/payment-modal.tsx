"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { recordAppointmentPayment } from "@/lib/payments/actions";
import type { Appointment } from "@/lib/appointments/types";
import type { PaymentMethod } from "@/lib/payments/types";

type PaymentModalProps = {
  appointment: Appointment;
  onClose: () => void;
};

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function PaymentMethodButton({
  method,
  label,
  variant = "mint",
}: {
  method: PaymentMethod;
  label: string;
  variant?: "mint" | "ghost";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="method"
      value={method}
      disabled={pending}
      className={
        variant === "mint"
          ? "payment-btn-mint"
          : "payment-btn-ghost"
      }
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

export function PaymentModal({ appointment, onClose }: PaymentModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  const amount = appointment.total_amount > 0 ? appointment.total_amount : 0;
  const customer = appointment.customer_name ?? "Customer";

  return (
    <dialog
      ref={dialogRef}
      className="payment-modal"
      onClose={onClose}
    >
      <form action={recordAppointmentPayment} className="payment-modal-form">
        <input type="hidden" name="appointment_id" value={appointment.id} />

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
            onClick={onClose}
            className="payment-modal-close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="payment-modal-actions">
          <PaymentMethodButton method="cash" label="Cash ✓" />
          <PaymentMethodButton method="upi" label="UPI ✓" />
          <PaymentMethodButton
            method="pending"
            label="Mark Pending"
            variant="ghost"
          />
        </div>
      </form>
    </dialog>
  );
}
