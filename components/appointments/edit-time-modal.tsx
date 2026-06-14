"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "@/components/ui/toast";
import { effectiveEndTime } from "@/lib/appointments/cascade";
import type { CascadePreview } from "@/lib/appointments/cascade";
import { previewAppointmentTimeChange } from "@/lib/appointments/actions";
import type { Appointment } from "@/lib/appointments/types";
import {
  calendarDayInTimezone,
  SALON_TIMEZONE,
} from "@/lib/payments/date-utils";
import { useT } from "@/lib/i18n/LanguageContext";

type EditTimeModalProps = {
  appointment: Appointment;
  businessName: string;
  onClose: () => void;
  onPreview: (preview: CascadePreview, newStart: Date, newEnd: Date) => void;
};

type TimeMode = "end" | "duration";

function istTimeInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "10:00";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SALON_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "10";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

function formatIstDateLabel(iso: string): string {
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

function buildIstInstant(istDay: string, timeHHmm: string): Date {
  return new Date(`${istDay}T${timeHHmm}:00+05:30`);
}

function durationMinutes(startIso: string, endIso: string): number {
  const start = new Date(startIso);
  const end = effectiveEndTime(
    start,
    endIso ? new Date(endIso) : null
  );
  return Math.max(15, Math.round((end.getTime() - start.getTime()) / (60 * 1000)));
}

export function EditTimeModal({
  appointment,
  businessName,
  onClose,
  onPreview,
}: EditTimeModalProps) {
  const { t } = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const istDay = useMemo(
    () => calendarDayInTimezone(appointment.start_time, SALON_TIMEZONE),
    [appointment.start_time]
  );

  const defaultEndIso = useMemo(() => {
    const start = new Date(appointment.start_time);
    return effectiveEndTime(
      start,
      appointment.end_time ? new Date(appointment.end_time) : null
    ).toISOString();
  }, [appointment.end_time, appointment.start_time]);

  const [startTime, setStartTime] = useState(() =>
    istTimeInputValue(appointment.start_time)
  );
  const [endTime, setEndTime] = useState(() => istTimeInputValue(defaultEndIso));
  const [durationMins, setDurationMins] = useState(() =>
    durationMinutes(appointment.start_time, appointment.end_time ?? "")
  );
  const [timeMode, setTimeMode] = useState<TimeMode>("end");
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

  const resolveEndInstant = useCallback(
    (start: Date): Date => {
      if (timeMode === "end") {
        return buildIstInstant(istDay, endTime);
      }
      return new Date(start.getTime() + durationMins * 60 * 1000);
    },
    [durationMins, endTime, istDay, timeMode]
  );

  const handleSubmit = useCallback(async () => {
    if (!startTime.trim()) {
      setErrorToast(t("editTime.errorStartRequired"));
      return;
    }

    if (timeMode === "end" && !endTime.trim()) {
      setErrorToast(t("editTime.errorEndRequired"));
      return;
    }

    if (timeMode === "duration" && (!durationMins || durationMins < 15)) {
      setErrorToast(t("editTime.errorDurationMin"));
      return;
    }

    const newStart = buildIstInstant(istDay, startTime);
    const newEnd = resolveEndInstant(newStart);

    if (Number.isNaN(newStart.getTime()) || Number.isNaN(newEnd.getTime())) {
      setErrorToast(t("editTime.errorInvalidTime"));
      return;
    }

    if (newEnd.getTime() <= newStart.getTime()) {
      setErrorToast(t("editTime.errorEndAfterStart"));
      return;
    }

    setLoading(true);
    try {
      const result = await previewAppointmentTimeChange(
        appointment.id,
        newStart.toISOString(),
        newEnd.toISOString()
      );

      if (!result.ok) {
        setErrorToast(result.error);
        return;
      }

      onPreview(result.preview, newStart, newEnd);
    } catch {
      setErrorToast(t("editTime.errorPreviewFailed"));
    } finally {
      setLoading(false);
    }
  }, [
    appointment.id,
    durationMins,
    endTime,
    istDay,
    onPreview,
    resolveEndInstant,
    startTime,
    timeMode,
    t,
  ]);

  const customer = appointment.customer_name ?? t("appointment.walkIn");
  const service = appointment.service_name ?? t("appointment.service");

  return (
    <>
      <dialog ref={dialogRef} className="payment-modal" onClose={onClose}>
        <div className="payment-modal-form">
          <div className="payment-modal-header">
            <div>
              <p className="eyebrow">{t("editTime.eyebrow")}</p>
              <h3>{t("editTime.title")}</h3>
              <p className="payment-modal-meta">
                {customer} · {service}
                {businessName ? ` · ${businessName}` : ""}
              </p>
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

          <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
            <div>
              <p className="field-label">{t("editTime.dateLocked")}</p>
              <p
                style={{
                  margin: "6px 0 0",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #E0DAD0",
                  background: "#EDE8DF",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#1A1A1A",
                }}
              >
                {formatIstDateLabel(appointment.start_time)}
              </p>
              <p className="text-xs text-muted" style={{ marginTop: 6 }}>
                {t("editTime.sameDayNote")}
              </p>
            </div>

            <div>
              <label htmlFor="edit-start-time" className="field-label">
                {t("editTime.startTime")} <span className="text-coral">*</span>
              </label>
              <input
                id="edit-start-time"
                type="time"
                required
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="input-field"
                disabled={loading}
              />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <p className="field-label" style={{ margin: 0 }}>
                  {timeMode === "end"
                    ? t("editTime.endTime")
                    : t("editTime.durationMinutes")}{" "}
                  <span className="text-coral">*</span>
                </p>
                <button
                  type="button"
                  className="demo-button"
                  style={{ minHeight: 32, fontSize: 12, padding: "4px 10px" }}
                  onClick={() =>
                    setTimeMode((mode) => (mode === "end" ? "duration" : "end"))
                  }
                  disabled={loading}
                >
                  {timeMode === "end"
                    ? t("editTime.durationMode")
                    : t("editTime.endTimeMode")}
                </button>
              </div>

              {timeMode === "end" ? (
                <input
                  id="edit-end-time"
                  type="time"
                  required
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  className="input-field"
                  disabled={loading}
                />
              ) : (
                <input
                  id="edit-duration"
                  type="number"
                  min={15}
                  step={15}
                  required
                  value={durationMins}
                  onChange={(event) =>
                    setDurationMins(Math.max(15, Number(event.target.value) || 15))
                  }
                  className="input-field"
                  disabled={loading}
                />
              )}
            </div>
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
              onClick={() => void handleSubmit()}
              disabled={loading}
            >
              {loading ? t("editTime.previewLoading") : t("editTime.preview")}
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
