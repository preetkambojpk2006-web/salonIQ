"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { MessageActions } from "@/components/whatsapp/MessageActions";
import type { Appointment } from "@/lib/appointments/types";
import type { PaymentMethod } from "@/lib/payments/types";
import { googleReviewRequest, invoice } from "@/lib/whatsapp/templates";
import { useT } from "@/lib/i18n/LanguageContext";

type PaymentWhatsAppModalProps = {
  appointment: Appointment;
  businessName: string;
  paymentMethod: PaymentMethod;
  googleReviewLink?: string | null;
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
  googleReviewLink,
  onClose,
}: PaymentWhatsAppModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { t } = useT();
  const reviewLink = googleReviewLink?.trim() ?? "";

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

  const reviewMessage = useMemo(() => {
    if (!reviewLink) return "";
    return googleReviewRequest({
      customerName: appointment.customer_name ?? "Customer",
      salonName: businessName,
      googleReviewLink: reviewLink,
    });
  }, [appointment.customer_name, businessName, reviewLink]);

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
            <p className="eyebrow">{t("whatsapp.eyebrow")}</p>
            <h3>{t("whatsapp.paymentInvoiceTitle")}</h3>
            {!phone ? (
              <p className="payment-modal-meta">
                {t("whatsapp.noPhoneCopy")}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="payment-modal-close"
            aria-label={t("common.close")}
          >
            ✕
          </button>
        </div>

        <textarea
          readOnly
          value={message}
          rows={10}
          className="mt-5 w-full resize-none rounded-xl border border-[#E0DAD0] bg-[#EDE8DF]/40 p-3 text-sm leading-relaxed text-[#1A1A1A]"
          aria-label={t("whatsapp.invoiceMsgAria")}
        />

        <div className="mt-4">
          <MessageActions phone={phone} message={message} />
        </div>

        {reviewLink ? (
          <div
            style={{
              marginTop: 18,
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid #E0DAD0",
              background: "#E8D9C0",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color: "#1A1A1A",
              }}
            >
              {t("whatsapp.googleReviewTitle")}
            </p>
            <p
              style={{
                margin: "6px 0 12px",
                fontSize: 13,
                color: "#8A8A8A",
                lineHeight: 1.4,
              }}
            >
              {t("whatsapp.googleReviewHint")}
            </p>
            <textarea
              readOnly
              value={reviewMessage}
              rows={7}
              className="w-full resize-none rounded-xl border border-[#E0DAD0] bg-white/80 p-3 text-sm leading-relaxed text-[#1A1A1A]"
              aria-label={t("whatsapp.reviewMsgAria")}
            />
            <div className="mt-3">
              <MessageActions
                phone={phone}
                message={reviewMessage}
                copyLabel={t("whatsapp.copyReview")}
                sendLabel={t("whatsapp.sendReview")}
              />
            </div>
          </div>
        ) : null}

        <div className="payment-modal-actions">
          <button type="button" className="payment-btn-ghost" onClick={handleClose}>
            {t("common.close")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
