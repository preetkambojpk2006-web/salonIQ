"use client";

import { useCallback, useEffect, useRef } from "react";
import { AlertTriangle, Ban } from "lucide-react";
import { VibeCard } from "@/components/appointments/vibe-card";
import type { Appointment } from "@/lib/appointments/types";
import type { CustomerReliability } from "@/lib/customers/types";
import { formatTime12h } from "@/lib/format/time";
import { useT } from "@/lib/i18n/LanguageContext";

type AppointmentDetailModalProps = {
  appointment: Appointment;
  businessName: string;
  canEditTime?: boolean;
  onClose: () => void;
  onEditTime?: () => void;
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
        <AlertTriangle size={16} strokeWidth={2} className="shrink-0" aria-hidden />
      ) : (
        <Ban size={16} strokeWidth={2} className="shrink-0" aria-hidden />
      )}
      <span>
        {isWarning
          ? t("appointment.reliabilityWarning")
          : t("appointment.reliabilityBlacklist")}
      </span>
    </div>
  );
}

export function AppointmentDetailModal({
  appointment,
  businessName,
  canEditTime = false,
  onClose,
  onEditTime,
  actions,
}: AppointmentDetailModalProps) {
  const { t } = useT();
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

  const customer = appointment.customer_name ?? t("appointment.walkIn");
  const service = appointment.service_name ?? t("appointment.service");

  return (
    <dialog ref={dialogRef} className="payment-modal" onClose={onClose}>
      <div className="payment-modal-form">
        <div className="payment-modal-header">
          <div>
            <p className="eyebrow">{t("appointment.bookingDetail")}</p>
            <h3>
              {customer} · {service}
            </h3>
            <p className="payment-modal-meta">
              {formatTime12h(appointment.start_time)}
              {appointment.staff_name ? ` · ${appointment.staff_name}` : ""}
              {businessName ? ` · ${businessName}` : ""}
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
            aria-label={t("common.close")}
          >
            ✕
          </button>
        </div>

        {appointment.customer_reliability === "warning" ||
        appointment.customer_reliability === "blacklisted" ? (
          <ReliabilityAlert reliability={appointment.customer_reliability} />
        ) : null}

        <VibeCard notes={appointment.customer_notes} />

        {canEditTime &&
        onEditTime &&
        (appointment.status === "pending" || appointment.status === "confirmed") ? (
          <button
            type="button"
            className="demo-button"
            style={{ width: "100%", minHeight: 40, marginTop: 4 }}
            onClick={onEditTime}
          >
            {t("appointment.editTime")}
          </button>
        ) : null}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          {actions}
        </div>
      </div>
    </dialog>
  );
}
