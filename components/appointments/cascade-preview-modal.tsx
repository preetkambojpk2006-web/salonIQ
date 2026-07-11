"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Ban } from "lucide-react";
import { Toast } from "@/components/ui/toast";
import type { CascadePreview } from "@/lib/appointments/cascade";
import { applyAppointmentTimeCascade } from "@/lib/appointments/actions";
import type { Appointment } from "@/lib/appointments/types";
import { formatTime12hInSalon } from "@/lib/format/time";
import { useT } from "@/lib/i18n/LanguageContext";

type CascadePreviewModalProps = {
  preview: CascadePreview;
  newStart: Date;
  newEnd: Date;
  appointment: Appointment;
  businessName: string;
  onClose: () => void;
  onConfirm: () => void;
  onConfirmed: (preview: CascadePreview) => void;
};

function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatTime12hInSalon(startIso)} – ${formatTime12hInSalon(endIso)}`;
}

function ShiftTableRow({
  customer,
  service,
  oldStart,
  oldEnd,
  newStart,
  newEnd,
}: {
  customer: string;
  service: string;
  oldStart: string;
  oldEnd: string;
  newStart: string;
  newEnd: string;
}) {
  return (
    <tr>
      <td style={{ padding: "8px 0", verticalAlign: "top" }}>
        <strong>{customer}</strong>
        <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{service}</div>
      </td>
      <td style={{ padding: "8px 0 8px 12px", verticalAlign: "top", whiteSpace: "nowrap" }}>
        {formatTimeRange(oldStart, oldEnd)}
      </td>
      <td style={{ padding: "8px 0 8px 12px", verticalAlign: "top", color: "#1FA873", fontWeight: 700 }}>
        → {formatTimeRange(newStart, newEnd)}
      </td>
    </tr>
  );
}

export function CascadePreviewModal({
  preview,
  newStart,
  newEnd,
  appointment,
  businessName,
  onClose,
  onConfirm,
  onConfirmed,
}: CascadePreviewModalProps) {
  const { t } = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  const handleClose = useCallback(() => {
    dialogRef.current?.close();
    onClose();
  }, [onClose]);

  const handleApply = useCallback(async () => {
    if (preview.has_hard_error) return;

    setLoading(true);
    onConfirm();

    try {
      const result = await applyAppointmentTimeCascade(
        appointment.id,
        newStart.toISOString(),
        newEnd.toISOString()
      );

      if (!result.ok) {
        setErrorToast(result.error);
        return;
      }

      onConfirmed(result.preview);
    } catch {
      setErrorToast(t("cascade.saveFailed"));
    } finally {
      setLoading(false);
    }
  }, [
    appointment.id,
    newEnd,
    newStart,
    onConfirm,
    onConfirmed,
    preview.has_hard_error,
    t,
  ]);

  const anchorCustomer = preview.anchor.customer_name ?? t("appointment.walkIn");
  const anchorService = preview.anchor.service_name ?? t("appointment.service");

  return (
    <>
      <dialog ref={dialogRef} className="payment-modal" onClose={onClose}>
        <div className="payment-modal-form">
          <div className="payment-modal-header">
            <div>
              <p className="eyebrow">{t("cascade.eyebrow")}</p>
              <h3>{t("cascade.title")}</h3>
              <p className="payment-modal-meta">{businessName}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="payment-modal-close"
              aria-label={t("common.close")}
              disabled={loading}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #E0DAD0",
                background: "#EDE8DF",
              }}
            >
              <p className="field-label" style={{ marginBottom: 8 }}>
                {t("cascade.anchor")}
              </p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <tbody>
                  <ShiftTableRow
                    customer={anchorCustomer}
                    service={anchorService}
                    oldStart={preview.anchor.old_start}
                    oldEnd={preview.anchor.old_end}
                    newStart={preview.anchor.new_start}
                    newEnd={preview.anchor.new_end}
                  />
                </tbody>
              </table>
            </div>

            {preview.shifted.length > 0 ? (
              <div>
                <p className="field-label" style={{ marginBottom: 8 }}>
                  {t("cascade.willShift")}
                </p>
                <div
                  style={{
                    overflowX: "auto",
                    borderRadius: 12,
                    border: "1px solid #E0DAD0",
                    background: "#fff",
                    padding: "4px 14px",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <tbody>
                      {preview.shifted.map((row) => (
                        <ShiftTableRow
                          key={row.id}
                          customer={row.customer_name ?? t("appointment.walkIn")}
                          service={row.service_name ?? t("appointment.service")}
                          oldStart={row.old_start}
                          oldEnd={row.old_end}
                          newStart={row.new_start}
                          newEnd={row.new_end}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-body" style={{ color: "var(--muted)" }}>
                {t("cascade.noShift")}
              </p>
            )}

            {preview.warnings.length > 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {preview.warnings.map((warning) => (
                  <div
                    key={warning}
                    role="status"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #C9A96E",
                      background: "#E8D9C0",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1A1A1A",
                      lineHeight: 1.4,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <AlertTriangle size={16} strokeWidth={1.5} className="shrink-0" aria-hidden />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {preview.has_hard_error ? (
              <div
                role="alert"
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #D94F4F",
                  background: "#FCE8E8",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1A1A1A",
                  lineHeight: 1.4,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <Ban size={16} strokeWidth={1.5} className="shrink-0" aria-hidden />
                <span>{t("cascade.blocked")}</span>
              </div>
            ) : null}
          </div>

          <div className="payment-modal-actions">
            <button
              type="button"
              className="payment-btn-ghost"
              onClick={handleClose}
              disabled={loading}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="payment-btn-mint"
              onClick={() => void handleApply()}
              disabled={loading || preview.has_hard_error}
            >
              {loading ? t("cascade.saving") : t("cascade.confirmApply")}
            </button>
          </div>
        </div>
      </dialog>

      <Toast
        message={errorToast ?? ""}
        show={errorToast !== null}
        variant="error"
        durationMs={5000}
        onDismiss={() => setErrorToast(null)}
      />
    </>
  );
}
