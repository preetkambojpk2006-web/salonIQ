"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { MessageActions } from "@/components/whatsapp/MessageActions";
import type { Appointment } from "@/lib/appointments/types";
import { formatTime12h } from "@/lib/format/time";
import { bookingConfirmation } from "@/lib/whatsapp/templates";
import { useT } from "@/lib/i18n/LanguageContext";

type BookingWhatsAppModalProps = {
  appointment: Appointment;
  businessName: string;
  onClose: () => void;
};

function formatAppointmentDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function BookingWhatsAppModal({
  appointment,
  businessName,
  onClose,
}: BookingWhatsAppModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { t } = useT();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  const message = useMemo(
    () =>
      bookingConfirmation({
        customerName: appointment.customer_name ?? "Customer",
        salonName: businessName,
        serviceName: appointment.service_name ?? "Service",
        dateStr: formatAppointmentDate(appointment.start_time),
        timeStr: formatTime12h(appointment.start_time),
        staffName: appointment.staff_name ?? undefined,
        branchAddress: appointment.branch_address ?? undefined,
      }),
    [appointment, businessName]
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
            <p className="eyebrow">{t("whatsapp.eyebrow")}</p>
            <h3>{t("whatsapp.bookingConfirmTitle")}</h3>
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
          aria-label={t("whatsapp.bookingMsgAria")}
        />

        <div className="mt-4">
          <MessageActions phone={phone} message={message} />
        </div>

        <div className="payment-modal-actions">
          <button type="button" className="payment-btn-ghost" onClick={handleClose}>
            {t("common.close")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
