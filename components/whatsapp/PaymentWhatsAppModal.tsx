"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Instagram, Receipt, Star, X } from "lucide-react";
import { InvoiceModal } from "@/components/invoice/invoice-modal";
import { MessageActions } from "@/components/whatsapp/MessageActions";
import type { Appointment } from "@/lib/appointments/types";
import type { PaymentMethod } from "@/lib/payments/types";
import {
  hasReviewsSocialPrompts,
  showGoogleReviewPrompt,
  showInstagramPrompt,
  type ReviewsSocialPrompts,
} from "@/lib/settings/reviews-social";
import { googleReviewRequest, invoice } from "@/lib/whatsapp/templates";
import { useT } from "@/lib/i18n/LanguageContext";

type PaymentWhatsAppModalProps = {
  appointment: Appointment;
  businessName: string;
  paymentMethod: PaymentMethod;
  googleReviewLink?: string | null;
  reviewsSocial?: ReviewsSocialPrompts;
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

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number | null;
  onChange: (rating: number) => void;
  label: string;
}) {
  return (
    <div>
      <p
        style={{
          margin: "0 0 10px",
          fontSize: 13,
          fontWeight: 600,
          color: "#8A8A8A",
        }}
      >
        {label}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {[1, 2, 3, 4, 5].map((rating) => {
          const selected = value !== null && rating <= value;

          return (
            <button
              key={rating}
              type="button"
              aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
              onClick={() => onChange(rating)}
              style={{
                display: "grid",
                placeItems: "center",
                minWidth: 44,
                minHeight: 44,
                padding: 0,
                border: 0,
                borderRadius: 10,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <Star
                size={16}
                strokeWidth={1.5}
                fill={selected ? "#1FA873" : "none"}
                color={selected ? "#1FA873" : "#8A8A8A"}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PaymentWhatsAppModal({
  appointment,
  businessName,
  paymentMethod,
  googleReviewLink,
  reviewsSocial,
  onClose,
}: PaymentWhatsAppModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { t } = useT();
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const reviewLink = googleReviewLink?.trim() ?? "";

  const social = reviewsSocial ?? {
    reviewPromptEnabled: false,
    googleReviewUrl: null,
    reviewFilterEnabled: true,
    instagramPromptEnabled: false,
    instagramUrl: null,
  };

  const showGoogleButton = showGoogleReviewPrompt(social);
  const showInstagramButton = showInstagramPrompt(social);
  const showSocialSection = hasReviewsSocialPrompts(social);
  const useStarFilter =
    showGoogleButton &&
    social.reviewFilterEnabled &&
    Boolean(social.googleReviewUrl?.trim());
  const showDirectGoogleButton =
    showGoogleButton &&
    Boolean(social.googleReviewUrl?.trim()) &&
    !social.reviewFilterEnabled;
  const showGoogleAfterHighRating =
    useStarFilter && selectedRating !== null && selectedRating >= 4;
  const showLowRatingFollowUp =
    useStarFilter && selectedRating !== null && selectedRating <= 3;

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

  const followUpMessage = useMemo(
    () =>
      t("whatsapp.reviewFollowUpMessage", {
        customerName: appointment.customer_name ?? "Customer",
        salonName: businessName,
      }),
    [appointment.customer_name, businessName, t]
  );

  const phone = appointment.customer_phone ?? "";

  const handleClose = useCallback(() => {
    dialogRef.current?.close();
    onClose();
  }, [onClose]);

  return (
    <>
      <dialog ref={dialogRef} className="payment-modal" onClose={onClose}>
        <div className="payment-modal-form">
          <div className="payment-modal-header">
            <div>
              <p className="eyebrow">{t("whatsapp.eyebrow")}</p>
              <h3>{t("whatsapp.paymentInvoiceTitle")}</h3>
              {!phone ? (
                <p className="payment-modal-meta">{t("whatsapp.noPhoneCopy")}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="payment-modal-close"
              aria-label={t("common.close")}
            >
              <X size={16} strokeWidth={1.5} aria-hidden />
            </button>
          </div>

          <button
            type="button"
            className="invoice-btn-outline"
            style={{ width: "100%", marginTop: 16 }}
            onClick={() => setShowInvoice(true)}
          >
            <Receipt size={16} strokeWidth={1.5} aria-hidden />
            {t("invoice.viewInvoice")}
          </button>

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
                borderRadius: 16,
                border: "1px solid #E0DAD0",
                background: "#F9F8F3",
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

          {showSocialSection ? (
            <div
              style={{
                marginTop: 18,
                padding: "14px 16px",
                borderRadius: 16,
                border: "1px solid #E0DAD0",
                background: "#F9F8F3",
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
                {t("payment.reviewsSocialHeading")}
              </p>
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  marginTop: 12,
                }}
              >
                {showGoogleButton && social.googleReviewUrl ? (
                  <>
                    {useStarFilter ? (
                      <StarRating
                        value={selectedRating}
                        onChange={setSelectedRating}
                        label={t("payment.rateExperience")}
                      />
                    ) : null}
                    {showGoogleAfterHighRating || showDirectGoogleButton ? (
                      <a
                        href={social.googleReviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="payment-btn-mint"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          textDecoration: "none",
                          borderRadius: 10,
                        }}
                      >
                        <Star size={16} strokeWidth={1.5} aria-hidden />
                        {t("payment.openGoogleReview")}
                        <ExternalLink size={16} strokeWidth={1.5} aria-hidden />
                      </a>
                    ) : null}
                    {showLowRatingFollowUp ? (
                      <div style={{ display: "grid", gap: 10 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: "#8A8A8A",
                            lineHeight: 1.45,
                          }}
                        >
                          {t("payment.reviewFollowUpNote")}
                        </p>
                        <MessageActions
                          phone={phone}
                          message={followUpMessage}
                          copyLabel={t("whatsapp.copyMessage")}
                          sendLabel={t("payment.messageCustomerFollowUp")}
                        />
                      </div>
                    ) : null}
                  </>
                ) : null}
                {showInstagramButton && social.instagramUrl ? (
                  <a
                    href={social.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="payment-btn-mint"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      textDecoration: "none",
                      borderRadius: 10,
                    }}
                  >
                    <Instagram size={16} strokeWidth={1.5} aria-hidden />
                    {t("payment.openInstagram")}
                    <ExternalLink size={16} strokeWidth={1.5} aria-hidden />
                  </a>
                ) : null}
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

      {showInvoice ? (
        <InvoiceModal
          appointment={appointment}
          businessName={businessName}
          paymentMethod={paymentMethod}
          onClose={() => setShowInvoice(false)}
        />
      ) : null}
    </>
  );
}
