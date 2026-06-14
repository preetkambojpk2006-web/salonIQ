"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { MessageActions } from "@/components/whatsapp/MessageActions";
import { formatTime12hInSalon } from "@/lib/format/time";
import { SALON_TIMEZONE } from "@/lib/payments/date-utils";
import { delayNotification } from "@/lib/whatsapp/templates";

export type DelayAffectedEntry = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  service_name: string | null;
  staff_name: string | null;
  old_start: string;
  old_end: string;
  new_start: string;
  new_end: string;
};

type DelayWhatsAppModalProps = {
  affected: DelayAffectedEntry[];
  salonName: string;
  onClose: () => void;
};

function formatAppointmentDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    timeZone: SALON_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DelayCustomerCard({
  entry,
  salonName,
}: {
  entry: DelayAffectedEntry;
  salonName: string;
}) {
  const phone = entry.customer_phone?.trim() ?? "";
  const customer = entry.customer_name ?? "Customer";
  const service = entry.service_name ?? "Service";

  const message = useMemo(
    () =>
      delayNotification({
        customerName: customer,
        salonName,
        serviceName: service,
        staffName: entry.staff_name ?? "Team",
        oldDateStr: formatAppointmentDate(entry.old_start),
        oldTimeStr: formatTime12hInSalon(entry.old_start),
        newDateStr: formatAppointmentDate(entry.new_start),
        newTimeStr: formatTime12hInSalon(entry.new_start),
      }),
    [customer, entry.new_start, entry.old_start, entry.staff_name, salonName, service]
  );

  return (
    <div
      style={{
        padding: "14px",
        borderRadius: 12,
        border: "1px solid #E0DAD0",
        background: "#EDE8DF",
      }}
    >
      <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#1A1A1A" }}>
        {customer} · {service}
      </p>

      <textarea
        readOnly
        value={message}
        rows={8}
        className="mt-3 w-full resize-none rounded-xl border border-[#E0DAD0] bg-white/70 p-3 text-sm leading-relaxed text-[#1A1A1A]"
        aria-label={`Delay message for ${customer}`}
      />

      {phone ? (
        <div className="mt-3">
          <MessageActions phone={phone} message={message} />
        </div>
      ) : (
        <p className="payment-modal-meta" style={{ marginTop: 12 }}>
          Phone nahi hai, manually batayein.
        </p>
      )}
    </div>
  );
}

export function DelayWhatsAppModal({
  affected,
  salonName,
  onClose,
}: DelayWhatsAppModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

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
            <h3>Customers ko batao — Time badal gaya</h3>
            <p className="payment-modal-meta">
              Har customer ko delay message copy ya WhatsApp se bhej sakte ho.
            </p>
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

        <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
          {affected.map((entry) => (
            <DelayCustomerCard key={entry.id} entry={entry} salonName={salonName} />
          ))}
        </div>

        <div className="payment-modal-actions">
          <button type="button" className="payment-btn-mint" onClick={handleClose}>
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
}
