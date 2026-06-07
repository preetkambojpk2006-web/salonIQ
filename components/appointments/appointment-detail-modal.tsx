"use client";

import { useCallback, useEffect, useRef } from "react";
import { VibeCard } from "@/components/appointments/vibe-card";
import type { Appointment } from "@/lib/appointments/types";
import type { CustomerReliability } from "@/lib/customers/types";
import { formatTime12h } from "@/lib/format/time";

type AppointmentDetailModalProps = {
  appointment: Appointment;
  onClose: () => void;
  actions: React.ReactNode;
};

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function ReliabilityAlert({
  reliability,
}: {
  reliability: CustomerReliability;
}) {
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
        ? "⚠️ Yeh customer pehle no-show kar chuka hai. Confirm karein."
        : "🚫 Yeh customer baar baar no-show karta hai. Booking lena carefully."}
    </div>
  );
}

export function AppointmentDetailModal({
  appointment,
  onClose,
  actions,
}: AppointmentDetailModalProps) {
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

  const customer = appointment.customer_name ?? "Walk-in";
  const service = appointment.service_name ?? "Service";

  return (
    <dialog ref={dialogRef} className="payment-modal" onClose={onClose}>
      <div className="payment-modal-form">
        <div className="payment-modal-header">
          <div>
            <p className="eyebrow">Booking detail</p>
            <h3>
              {customer} · {service}
            </h3>
            <p className="payment-modal-meta">
              {formatTime12h(appointment.start_time)}
              {appointment.staff_name ? ` · ${appointment.staff_name}` : ""}
            </p>
            {appointment.total_amount > 0 ? (
              <p className="payment-modal-amount">
                {formatRs(appointment.total_amount)}
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

        {appointment.customer_reliability === "warning" ||
        appointment.customer_reliability === "blacklisted" ? (
          <ReliabilityAlert reliability={appointment.customer_reliability} />
        ) : null}

        <VibeCard notes={appointment.customer_notes} />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          {actions}
        </div>
      </div>
    </dialog>
  );
}
