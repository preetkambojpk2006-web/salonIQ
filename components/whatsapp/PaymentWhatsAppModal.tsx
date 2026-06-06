"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { MessageActions } from "@/components/whatsapp/MessageActions";
import type { Appointment } from "@/lib/appointments/types";
import type { PaymentMethod } from "@/lib/payments/types";
import { invoice } from "@/lib/whatsapp/templates";

type PaymentWhatsAppModalProps = {
  appointment: Appointment;
  businessName: string;
  paymentMethod: PaymentMethod;
  onClose: () => void;
};

function formatInvoiceDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function invoiceNumberFromId(id: string): string {
  return id.replace(/-/g, "").slice(-8).toUpperCase();
}

export function PaymentWhatsAppModal({
  appointment,
  businessName,
  paymentMethod,
  onClose,
}: PaymentWhatsAppModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  const message = useMemo(
    () =>
      invoice({
        customerName: appointment.customer_name ?? "Customer",
        salonName: businessName,
        serviceName: appointment.service_name ?? "Service",
        amount: appointment.total_amount > 0 ? appointment.total_amount : 0,
        paymentMethod,
        dateStr: formatInvoiceDate(),
        invoiceNumber: invoiceNumberFromId(appointment.id),
      }),
    [appointment, businessName, paymentMethod]
  );

  const phone = appointment.customer_phone ?? "";

  const handleClose = useCallback(() => {
    dialogRef.current?.close();
    onClose();
  }, [onClose]);

  return (
    <dialog ref={dialogRef} className="payment-modal" onClose={onClose}>
      <div className="payment-modal-form">
        <div className="payment-modal-header">
          <div>
            <p className="eyebrow">WhatsApp</p>
            <h3>Payment saved — send invoice on WhatsApp?</h3>
            {!phone ? (
              <p className="payment-modal-meta">
                Customer phone nahi mila — copy karke manually bhej sakte ho.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="payment-modal-close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <textarea
          readOnly
          value={message}
          rows={10}
          className="mt-5 w-full resize-none rounded-xl border border-[#E0DAD0] bg-[#EDE8DF]/40 p-3 text-sm leading-relaxed text-[#1A1A1A]"
          aria-label="WhatsApp invoice message"
        />

        <div className="mt-4">
          <MessageActions phone={phone} message={message} />
        </div>

        <div className="payment-modal-actions">
          <button type="button" className="payment-btn-ghost" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}
