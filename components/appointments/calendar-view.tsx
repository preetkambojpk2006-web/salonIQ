"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDayGrid } from "@/components/appointments/calendar-day-grid";
import { NewBookingForm } from "@/components/appointments/new-booking-form";
import { PaymentModal } from "@/components/appointments/payment-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Toast } from "@/components/ui/toast";
import { WhatsAppCopyButtons } from "@/components/appointments/whatsapp-copy-buttons";
import {
  confirmAppointment,
  markNoShow,
} from "@/lib/appointments/actions";
import type { Appointment } from "@/lib/appointments/types";
import { formatTime12h } from "@/lib/format/time";

type CalendarViewProps = {
  appointments: Appointment[];
  businessName: string;
  openBooking?: boolean;
  error?: string;
  showAddedToast?: boolean;
  showPaymentToast?: boolean;
};

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatDateHeading(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, tomorrow)) return "Tomorrow";

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function dateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function staffLabel(appointment: Appointment): string {
  return appointment.staff_name?.trim() || "Unassigned";
}

function safeDecodeError(error: string): string {
  try {
    return decodeURIComponent(error);
  } catch {
    return error;
  }
}

function groupByDate(appointments: Appointment[]): [string, Appointment[]][] {
  const map = new Map<string, Appointment[]>();

  for (const appointment of appointments) {
    const key = dateKey(appointment.start_time);
    const list = map.get(key) ?? [];
    list.push(appointment);
    map.set(key, list);
  }

  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function AppointmentActions({
  appointment,
  businessName,
  onCompletePay,
  onCopied,
  compact = false,
}: {
  appointment: Appointment;
  businessName: string;
  onCompletePay: () => void;
  onCopied: () => void;
  compact?: boolean;
}) {
  const btnClass = compact ? "" : "";

  if (appointment.status === "completed") {
    return (
      <div style={{ display: "grid", gap: 6 }}>
        <p className="text-xs font-medium text-muted">
          {appointment.payment_status === "paid" ? "Paid" : "Payment pending"}
        </p>
        <WhatsAppCopyButtons
          appointment={appointment}
          businessName={businessName}
          onCopied={onCopied}
          compact={compact}
        />
      </div>
    );
  }

  if (appointment.status === "cancelled" || appointment.status === "no_show") {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {appointment.status === "pending" ? (
        <form action={confirmAppointment}>
          <input type="hidden" name="appointment_id" value={appointment.id} />
          <button type="submit" className={`primary-button ${btnClass}`}>
            Confirm
          </button>
        </form>
      ) : null}

      {appointment.status === "confirmed" ? (
        <button
          type="button"
          className={`primary-button ${btnClass}`}
          onClick={onCompletePay}
        >
          Complete + Pay
        </button>
      ) : null}

      {appointment.status === "pending" || appointment.status === "confirmed" ? (
        <form action={markNoShow}>
          <input type="hidden" name="appointment_id" value={appointment.id} />
          <button
            type="submit"
            className="demo-button"
            style={{ minHeight: compact ? 32 : 40 }}
          >
            No show
          </button>
        </form>
      ) : null}
    </div>
  );
}

function blockTitle(appointment: Appointment): string {
  const name = appointment.customer_name ?? "Walk-in";
  const service = appointment.service_name ?? "Service";
  return `${name} - ${service}`;
}

const AppointmentBlock = memo(function AppointmentBlock({
  appointment,
  businessName,
  onCompletePay,
  onCopied,
  compact = false,
}: {
  appointment: Appointment;
  businessName: string;
  onCompletePay: () => void;
  onCopied: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <div className="booking-block">{blockTitle(appointment)}</div>
        <AppointmentActions
          appointment={appointment}
          businessName={businessName}
          onCompletePay={onCompletePay}
          onCopied={onCopied}
          compact
        />
      </div>
    );
  }

  return (
    <article className="appointment-row">
      <span className="appointment-time">
        {formatTime12h(appointment.start_time)}
      </span>
      <div>
        <strong>{blockTitle(appointment)}</strong>
        <p>{staffLabel(appointment)}</p>
        {appointment.total_amount > 0 ? (
          <p>{formatRs(appointment.total_amount)}</p>
        ) : null}
      </div>
      <AppointmentActions
        appointment={appointment}
        businessName={businessName}
        onCompletePay={onCompletePay}
        onCopied={onCopied}
        compact={compact}
      />
    </article>
  );
});

export function CalendarView({
  appointments,
  businessName,
  openBooking = false,
  error,
  showAddedToast = false,
  showPaymentToast = false,
}: CalendarViewProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(openBooking);
  const [payAppointment, setPayAppointment] = useState<Appointment | null>(null);
  const [bookingToast, setBookingToast] = useState(showAddedToast);
  const [paymentToast, setPaymentToast] = useState(showPaymentToast);
  const [paymentErrorToast, setPaymentErrorToast] = useState<string | null>(
    null
  );
  const [copyToast, setCopyToast] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");

  useEffect(() => {
    setShowForm(openBooking);
  }, [openBooking]);

  useEffect(() => {
    if (!showAddedToast) return;
    setBookingToast(true);
    const params = new URLSearchParams(window.location.search);
    params.delete("added");
    const qs = params.toString();
    router.replace(qs ? `/dashboard/calendar?${qs}` : "/dashboard/calendar", {
      scroll: false,
    });
  }, [showAddedToast, router]);

  useEffect(() => {
    if (!showPaymentToast) return;
    setPaymentToast(true);
    const params = new URLSearchParams(window.location.search);
    params.delete("paid");
    const qs = params.toString();
    router.replace(qs ? `/dashboard/calendar?${qs}` : "/dashboard/calendar", {
      scroll: false,
    });
  }, [showPaymentToast, router]);

  const grouped = useMemo(() => groupByDate(appointments), [appointments]);

  const handleCompletePay = useCallback((appointment: Appointment) => {
    setPayAppointment(appointment);
  }, []);

  const handleCopied = useCallback(() => setCopyToast(true), []);

  const handlePaymentSuccess = useCallback(() => {
    setPaymentToast(true);
    router.refresh();
  }, [router]);

  const handlePaymentError = useCallback((message: string) => {
    setPaymentErrorToast(message);
  }, []);

  const renderGridBlock = useCallback(
    (appointment: Appointment, onPay: () => void) => (
      <AppointmentBlock
        appointment={appointment}
        businessName={businessName}
        onCompletePay={onPay}
        onCopied={handleCopied}
        compact
      />
    ),
    [businessName, handleCopied]
  );

  const openNewBooking = () => {
    router.push("/dashboard/calendar?booking=new", { scroll: false });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    router.replace("/dashboard/calendar", { scroll: false });
  };

  return (
    <>
      <div className="view-stack">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Smart appointment system</p>
              <h2>Daily staff calendar</h2>
            </div>
            <div className="topbar-actions">
              <div className="segmented">
                {(["day", "week", "month"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={viewMode === mode ? "active" : undefined}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              <button type="button" className="primary-button" onClick={openNewBooking}>
                New booking
              </button>
            </div>
          </div>

          {error && !showForm ? (
            <p className="text-body" role="alert" style={{ color: "var(--coral)" }}>
              {safeDecodeError(error)}
            </p>
          ) : null}

          {appointments.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="Aaj koi booking nahi"
              description="Nayi booking banayein? Sirf ek minute lagega."
              actionLabel="Nayi booking"
              onAction={openNewBooking}
            />
          ) : (
            <div className="view-stack">
              {grouped.map(([key, dayAppointments]) => (
                <div key={key}>
                  <p className="eyebrow" style={{ marginBottom: 12 }}>
                    {formatDateHeading(dayAppointments[0].start_time)}
                  </p>
                  <div className="hidden desktop:block">
                    <CalendarDayGrid
                      dayAppointments={dayAppointments}
                      onCompletePay={handleCompletePay}
                      renderBlock={renderGridBlock}
                    />
                  </div>
                  <div className="appointment-list stagger-list desktop:hidden">
                    {dayAppointments.map((appointment) => (
                      <AppointmentBlock
                        key={appointment.id}
                        appointment={appointment}
                        businessName={businessName}
                        onCompletePay={() => handleCompletePay(appointment)}
                        onCopied={handleCopied}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showForm ? (
        <NewBookingForm onClose={closeForm} error={openBooking ? error : undefined} />
      ) : null}

      {payAppointment ? (
        <PaymentModal
          appointment={payAppointment}
          onClose={() => setPayAppointment(null)}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      ) : null}

      <Toast
        message="Booking saved"
        show={bookingToast}
        onDismiss={() => setBookingToast(false)}
      />
      <Toast
        message="Payment saved! ✅"
        show={paymentToast}
        onDismiss={() => setPaymentToast(false)}
      />
      <Toast
        message={paymentErrorToast ?? ""}
        show={paymentErrorToast !== null}
        variant="error"
        durationMs={5000}
        onDismiss={() => setPaymentErrorToast(null)}
      />
      <Toast
        message="Copied!"
        show={copyToast}
        onDismiss={() => setCopyToast(false)}
      />
    </>
  );
}
