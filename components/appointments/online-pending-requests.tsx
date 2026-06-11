"use client";

import { useFormStatus } from "react-dom";
import type { Appointment } from "@/lib/appointments/types";
import {
  confirmAppointment,
  rejectAppointment,
} from "@/lib/appointments/actions";
import { formatTime12hInSalon } from "@/lib/format/time";
import { calendarDayInTimezone } from "@/lib/payments/date-utils";

function PendingSubmitButton({
  label,
  pendingLabel = "Saving…",
  className,
  style,
}: {
  label: string;
  pendingLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      style={style}
      disabled={pending}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function formatDateLabel(iso: string): string {
  const day = calendarDayInTimezone(iso);
  const today = calendarDayInTimezone(new Date());
  const tomorrow = calendarDayInTimezone(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  );

  if (day === today) return "Today";
  if (day === tomorrow) return "Tomorrow";

  return new Date(iso).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

type OnlinePendingRequestsProps = {
  appointments: Appointment[];
  compact?: boolean;
};

export function OnlinePendingRequests({
  appointments,
  compact = false,
}: OnlinePendingRequestsProps) {
  if (appointments.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        marginBottom: compact ? 0 : 8,
        padding: 16,
        borderRadius: 16,
        border: "1px solid #1FA873",
        background: "#D4E8DD",
      }}
    >
      <p
        className="eyebrow"
        style={{ marginBottom: 4, color: "#1A1A1A" }}
      >
        Online booking requests ({appointments.length})
      </p>
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 13,
          color: "#8A8A8A",
        }}
      >
        In requests ko confirm ya reject karein — customer ko wait kar rahe hain.
      </p>
      <div className="appointment-list stagger-list">
        {appointments.map((appointment) => (
          <article key={appointment.id} className="appointment-row">
            <span className="appointment-time">
              {formatTime12hInSalon(appointment.start_time)}
            </span>
            <div>
              <span
                className="tag orange"
                style={{ marginBottom: 6, display: "inline-flex" }}
              >
                Online · Confirm karein
              </span>
              <strong style={{ display: "block" }}>
                {appointment.customer_name ?? "Walk-in"} —{" "}
                {appointment.service_name ?? "Service"}
              </strong>
              <p style={{ margin: "4px 0 0" }}>
                {formatDateLabel(appointment.start_time)} ·{" "}
                {appointment.staff_name?.trim() || "Unassigned"}
              </p>
              {appointment.total_amount > 0 ? (
                <p style={{ margin: "4px 0 0" }}>
                  {formatRs(appointment.total_amount)}
                </p>
              ) : null}
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <div className="flex flex-wrap gap-1.5 items-start">
                <form action={confirmAppointment}>
                  <input
                    type="hidden"
                    name="appointment_id"
                    value={appointment.id}
                  />
                  <PendingSubmitButton label="Confirm" className="primary-button" />
                </form>
                <form action={rejectAppointment}>
                  <input
                    type="hidden"
                    name="appointment_id"
                    value={appointment.id}
                  />
                  <PendingSubmitButton
                    label="Reject"
                    className="demo-button"
                    style={{ minHeight: 40 }}
                  />
                </form>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
