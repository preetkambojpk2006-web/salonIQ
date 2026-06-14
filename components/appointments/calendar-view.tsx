"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { CalendarDayGrid, type GridBlockOptions } from "@/components/appointments/calendar-day-grid";
import { NewBookingForm } from "@/components/appointments/new-booking-form";
import { OnlinePendingRequests } from "@/components/appointments/online-pending-requests";
import { AppointmentDetailModal } from "@/components/appointments/appointment-detail-modal";
import { CascadePreviewModal } from "@/components/appointments/cascade-preview-modal";
import { EditTimeModal } from "@/components/appointments/edit-time-modal";
import { PaymentModal } from "@/components/appointments/payment-modal";
import { BookingWhatsAppModal } from "@/components/whatsapp/BookingWhatsAppModal";
import { DelayWhatsAppModal, type DelayAffectedEntry } from "@/components/whatsapp/DelayWhatsAppModal";
import { PaymentWhatsAppModal } from "@/components/whatsapp/PaymentWhatsAppModal";
import type { CascadePreview } from "@/lib/appointments/cascade";
import type { PaymentMethod } from "@/lib/payments/types";
import { EmptyState } from "@/components/ui/empty-state";
import { Toast } from "@/components/ui/toast";
import { WhatsAppCopyButtons } from "@/components/appointments/whatsapp-copy-buttons";
import {
  confirmAppointment,
  markNoShow,
  rejectAppointment,
} from "@/lib/appointments/actions";
import type { Appointment } from "@/lib/appointments/types";
import {
  isOnlinePendingAppointment,
  mergeAppointments,
} from "@/lib/appointments/utils";
import type { CustomerReliability } from "@/lib/customers/types";
import { formatTime12h } from "@/lib/format/time";
import { calendarDayInTimezone, SALON_TIMEZONE } from "@/lib/payments/date-utils";

type CalendarViewProps = {
  appointments: Appointment[];
  onlinePending?: Appointment[];
  businessName: string;
  googleReviewLink?: string | null;
  canManageFinance?: boolean;
  canEditAppointmentTime?: boolean;
  openBooking?: boolean;
  error?: string;
  showAddedToast?: boolean;
  addedAppointmentId?: string;
  showPaymentToast?: boolean;
};

type CascadeFlowState = {
  appointment: Appointment;
  preview: CascadePreview;
  newStart: Date;
  newEnd: Date;
};

function buildDelayAffected(
  preview: CascadePreview,
  appointment: Appointment
): DelayAffectedEntry[] {
  return [
    {
      id: preview.anchor.id,
      customer_name: preview.anchor.customer_name,
      customer_phone: appointment.customer_phone,
      service_name: preview.anchor.service_name,
      staff_name: preview.anchor.staff_name,
      old_start: preview.anchor.old_start,
      old_end: preview.anchor.old_end,
      new_start: preview.anchor.new_start,
      new_end: preview.anchor.new_end,
    },
    ...preview.shifted.map((row) => ({
      id: row.id,
      customer_name: row.customer_name,
      customer_phone: row.customer_phone,
      service_name: row.service_name,
      staff_name: row.staff_name,
      old_start: row.old_start,
      old_end: row.old_end,
      new_start: row.new_start,
      new_end: row.new_end,
    })),
  ];
}

function hasAnyCustomerPhone(entries: DelayAffectedEntry[]): boolean {
  return entries.some((entry) => Boolean(entry.customer_phone?.trim()));
}

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
  return calendarDayInTimezone(iso, SALON_TIMEZONE);
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
        marginBottom: 8,
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

function shouldShowReliabilityAlert(appointment: Appointment): boolean {
  return (
    (appointment.status === "pending" || appointment.status === "confirmed") &&
    (appointment.customer_reliability === "warning" ||
      appointment.customer_reliability === "blacklisted")
  );
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

function AppointmentSourceTag({ appointment }: { appointment: Appointment }) {
  if (appointment.status !== "pending") return null;

  if (isOnlinePendingAppointment(appointment)) {
    return (
      <span className="tag orange" style={{ marginBottom: 6, display: "inline-flex" }}>
        Online · Confirm karein
      </span>
    );
  }

  return (
    <span className="tag orange" style={{ marginBottom: 6, display: "inline-flex" }}>
      Pending
    </span>
  );
}

function AppointmentActions({
  appointment,
  businessName,
  onCompletePay,
  onCopied,
  canManageFinance = true,
  compact = false,
}: {
  appointment: Appointment;
  businessName: string;
  onCompletePay: () => void;
  onCopied: () => void;
  canManageFinance?: boolean;
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
    <div style={{ display: "grid", gap: 6 }}>
      <AppointmentSourceTag appointment={appointment} />
      <div className="flex flex-wrap gap-1.5 items-start">
      {appointment.status === "pending" ? (
        <>
          <form action={confirmAppointment}>
            <input type="hidden" name="appointment_id" value={appointment.id} />
            <PendingSubmitButton
              label="Confirm"
              className={`primary-button ${btnClass}`}
            />
          </form>
          <form action={rejectAppointment}>
            <input type="hidden" name="appointment_id" value={appointment.id} />
            <PendingSubmitButton
              label="Reject"
              className={`demo-button ${btnClass}`}
              style={{ minHeight: compact ? 32 : 40 }}
            />
          </form>
        </>
      ) : null}

      {appointment.status === "confirmed" && canManageFinance ? (
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
          <PendingSubmitButton
            label="No show"
            className="demo-button"
            style={{ minHeight: compact ? 32 : 40 }}
          />
        </form>
      ) : null}
      </div>
    </div>
  );
}

function blockTitle(appointment: Appointment): string {
  const name = appointment.customer_name ?? "Walk-in";
  const service = appointment.service_name ?? "Service";
  return `${name} - ${service}`;
}

const openDetailButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: 0,
  border: "none",
  background: "transparent",
  textAlign: "left",
  cursor: "pointer",
};

const AppointmentBlock = memo(function AppointmentBlock({
  appointment,
  businessName,
  onCompletePay,
  onCopied,
  onOpenDetail,
  canManageFinance = true,
  compact = false,
  gridOptions,
}: {
  appointment: Appointment;
  businessName: string;
  onCompletePay: () => void;
  onCopied: () => void;
  onOpenDetail: () => void;
  canManageFinance?: boolean;
  compact?: boolean;
  gridOptions?: GridBlockOptions;
}) {
  if (compact) {
    return (
      <div style={{ display: "grid", gap: 8, height: "100%" }}>
        {shouldShowReliabilityAlert(appointment) &&
        appointment.customer_reliability ? (
          <ReliabilityAlert reliability={appointment.customer_reliability} />
        ) : null}
        <button
          type="button"
          className="booking-block"
          style={{
            ...openDetailButtonStyle,
            height: gridOptions ? "100%" : undefined,
            display: "grid",
            alignContent: "start",
            gap: 4,
          }}
          onClick={onOpenDetail}
          aria-label={`Open booking for ${appointment.customer_name ?? "customer"}`}
        >
          {gridOptions ? (
            gridOptions.showTimes ? (
              <>
                <strong style={{ display: "block", lineHeight: 1.3 }}>
                  {blockTitle(appointment)}
                </strong>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#666" }}>
                  {gridOptions.timeLabel}
                </span>
              </>
            ) : (
              <strong style={{ display: "block", lineHeight: 1.3 }}>
                {gridOptions.serviceLabel}
              </strong>
            )
          ) : (
            blockTitle(appointment)
          )}
        </button>
        <AppointmentActions
          appointment={appointment}
          businessName={businessName}
          onCompletePay={onCompletePay}
          onCopied={onCopied}
          canManageFinance={canManageFinance}
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
      <button
        type="button"
        onClick={onOpenDetail}
        aria-label={`Open booking for ${appointment.customer_name ?? "customer"}`}
        style={{
          ...openDetailButtonStyle,
          color: "inherit",
          font: "inherit",
        }}
      >
        {shouldShowReliabilityAlert(appointment) &&
        appointment.customer_reliability ? (
          <ReliabilityAlert reliability={appointment.customer_reliability} />
        ) : null}
        <strong style={{ display: "block" }}>{blockTitle(appointment)}</strong>
        <p style={{ margin: "4px 0 0" }}>{staffLabel(appointment)}</p>
        {appointment.total_amount > 0 ? (
          <p style={{ margin: "4px 0 0" }}>{formatRs(appointment.total_amount)}</p>
        ) : null}
      </button>
      <AppointmentActions
        appointment={appointment}
        businessName={businessName}
        onCompletePay={onCompletePay}
        onCopied={onCopied}
        canManageFinance={canManageFinance}
        compact={compact}
      />
    </article>
  );
});

export function CalendarView({
  appointments,
  onlinePending = [],
  businessName,
  googleReviewLink = null,
  canManageFinance = true,
  canEditAppointmentTime = false,
  openBooking = false,
  error,
  showAddedToast = false,
  addedAppointmentId,
  showPaymentToast = false,
}: CalendarViewProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(openBooking);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(
    null
  );
  const [payAppointment, setPayAppointment] = useState<Appointment | null>(null);
  const [whatsappBooking, setWhatsappBooking] = useState<Appointment | null>(null);
  const [whatsappPayment, setWhatsappPayment] = useState<{
    appointment: Appointment;
    paymentMethod: PaymentMethod;
  } | null>(null);
  const [bookingToast, setBookingToast] = useState(showAddedToast);
  const [paymentToast, setPaymentToast] = useState(showPaymentToast);
  const [paymentErrorToast, setPaymentErrorToast] = useState<string | null>(
    null
  );
  const [copyToast, setCopyToast] = useState(false);
  const [bookingErrorToast, setBookingErrorToast] = useState<string | null>(
    error ? safeDecodeError(error) : null
  );
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [onlinePendingOnly, setOnlinePendingOnly] = useState(false);
  const [editTimeAppointment, setEditTimeAppointment] = useState<Appointment | null>(
    null
  );
  const [cascadeFlow, setCascadeFlow] = useState<CascadeFlowState | null>(null);
  const [delayAffected, setDelayAffected] = useState<DelayAffectedEntry[] | null>(
    null
  );
  const [timeChangeToast, setTimeChangeToast] = useState(false);

  const mergedAppointments = useMemo(
    () => mergeAppointments(appointments, onlinePending),
    [appointments, onlinePending]
  );

  const onlinePendingCount = onlinePending.length;

  const visibleAppointments = useMemo(() => {
    if (!onlinePendingOnly) return mergedAppointments;
    return onlinePending;
  }, [mergedAppointments, onlinePending, onlinePendingOnly]);

  useEffect(() => {
    setShowForm(openBooking);
  }, [openBooking]);

  useEffect(() => {
    if (!error) return;
    setBookingErrorToast(safeDecodeError(error));
  }, [error]);

  useEffect(() => {
    if (!showAddedToast) return;
    setShowForm(false);
    setBookingToast(true);

    if (addedAppointmentId) {
      const match = mergedAppointments.find((a) => a.id === addedAppointmentId);
      if (match) setWhatsappBooking(match);
    }

    const params = new URLSearchParams(window.location.search);
    params.delete("added");
    params.delete("appointment_id");
    const qs = params.toString();
    router.replace(qs ? `/dashboard/calendar?${qs}` : "/dashboard/calendar", {
      scroll: false,
    });
    router.refresh();
  }, [showAddedToast, addedAppointmentId, mergedAppointments, router]);

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

  const grouped = useMemo(() => groupByDate(visibleAppointments), [visibleAppointments]);

  const handleOpenDetail = useCallback((appointment: Appointment) => {
    setDetailAppointment(appointment);
  }, []);

  const handleCompletePay = useCallback((appointment: Appointment) => {
    setDetailAppointment(null);
    setPayAppointment(appointment);
  }, []);

  const handleCopied = useCallback(() => setCopyToast(true), []);

  const handlePaymentSuccess = useCallback(
    (method: PaymentMethod) => {
      setPaymentToast(true);

      if (payAppointment && (method === "cash" || method === "upi")) {
        setWhatsappPayment({ appointment: payAppointment, paymentMethod: method });
      }

      setPayAppointment(null);
      router.refresh();
    },
    [payAppointment, router]
  );

  const handlePaymentError = useCallback((message: string) => {
    setPaymentErrorToast(message);
  }, []);

  const handleCloseWhatsappBooking = useCallback(() => {
    setWhatsappBooking(null);
    router.refresh();
  }, [router]);

  const handleCloseWhatsappPayment = useCallback(() => {
    setWhatsappPayment(null);
    router.refresh();
  }, [router]);

  const handleOpenEditTime = useCallback(() => {
    if (!detailAppointment) return;
    setEditTimeAppointment(detailAppointment);
  }, [detailAppointment]);

  const handleEditTimeClose = useCallback(() => {
    setEditTimeAppointment(null);
  }, []);

  const handleTimePreview = useCallback(
    (preview: CascadePreview, newStart: Date, newEnd: Date) => {
      if (!editTimeAppointment) return;
      setEditTimeAppointment(null);
      setCascadeFlow({
        appointment: editTimeAppointment,
        preview,
        newStart,
        newEnd,
      });
    },
    [editTimeAppointment]
  );

  const handleCascadeClose = useCallback(() => {
    setCascadeFlow(null);
  }, []);

  const handleCascadeConfirm = useCallback(() => {
    // Reserved for parent-side side effects before apply completes.
  }, []);

  const handleCascadeConfirmed = useCallback(
    (preview: CascadePreview) => {
      const appointment = cascadeFlow?.appointment;
      setCascadeFlow(null);
      setDetailAppointment(null);
      setTimeChangeToast(true);
      router.refresh();

      if (!appointment) return;

      const affected = buildDelayAffected(preview, appointment);
      if (hasAnyCustomerPhone(affected)) {
        setDelayAffected(affected);
      }
    },
    [cascadeFlow?.appointment, router]
  );

  const handleCloseDelayNotify = useCallback(() => {
    setDelayAffected(null);
    router.refresh();
  }, [router]);

  const renderGridBlock = useCallback(
    (
      appointment: Appointment,
      onPay: () => void,
      gridOptions?: GridBlockOptions
    ) => (
      <AppointmentBlock
        appointment={appointment}
        businessName={businessName}
        onCompletePay={onPay}
        onCopied={handleCopied}
        onOpenDetail={() => handleOpenDetail(appointment)}
        canManageFinance={canManageFinance}
        compact
        gridOptions={gridOptions}
      />
    ),
    [businessName, canManageFinance, handleCopied, handleOpenDetail]
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
              {onlinePendingCount > 0 ? (
                <button
                  type="button"
                  className={onlinePendingOnly ? "primary-button" : "demo-button"}
                  onClick={() => setOnlinePendingOnly((value) => !value)}
                  style={{ minHeight: 40 }}
                >
                  Online pending ({onlinePendingCount})
                </button>
              ) : null}
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

          {mergedAppointments.length === 0 && onlinePendingCount === 0 ? (
            <EmptyState
              icon="calendar"
              title="Aaj koi booking nahi"
              description="Nayi booking banayein? Sirf ek minute lagega."
              actionLabel="Nayi booking"
              onAction={openNewBooking}
            />
          ) : visibleAppointments.length === 0 ? (
            <p className="text-body" style={{ color: "var(--muted)" }}>
              Koi online pending booking nahi. Filter hata kar saari bookings dekhein.
            </p>
          ) : (
            <div className="view-stack">
              {onlinePendingCount > 0 ? (
                <OnlinePendingRequests appointments={onlinePending} />
              ) : null}

              {grouped.map(([key, dayAppointments]) => (
                <div key={key}>
                  <p className="eyebrow" style={{ marginBottom: 12 }}>
                    {formatDateHeading(dayAppointments[0].start_time)}
                  </p>
                  <div className="appointment-list stagger-list" style={{ marginBottom: 16 }}>
                    {dayAppointments.map((appointment) => (
                      <AppointmentBlock
                        key={appointment.id}
                        appointment={appointment}
                        businessName={businessName}
                        onCompletePay={() => handleCompletePay(appointment)}
                        onCopied={handleCopied}
                        onOpenDetail={() => handleOpenDetail(appointment)}
                        canManageFinance={canManageFinance}
                      />
                    ))}
                  </div>
                  <div className="hidden desktop:block">
                    <CalendarDayGrid
                      dayAppointments={dayAppointments}
                      onCompletePay={handleCompletePay}
                      renderBlock={renderGridBlock}
                    />
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

      {detailAppointment ? (
        <AppointmentDetailModal
          appointment={detailAppointment}
          businessName={businessName}
          canEditTime={canEditAppointmentTime}
          onEditTime={handleOpenEditTime}
          onClose={() => setDetailAppointment(null)}
          actions={
            <AppointmentActions
              appointment={detailAppointment}
              businessName={businessName}
              onCompletePay={() => handleCompletePay(detailAppointment)}
              onCopied={handleCopied}
              canManageFinance={canManageFinance}
            />
          }
        />
      ) : null}

      {editTimeAppointment ? (
        <EditTimeModal
          appointment={editTimeAppointment}
          businessName={businessName}
          onClose={handleEditTimeClose}
          onPreview={handleTimePreview}
        />
      ) : null}

      {cascadeFlow ? (
        <CascadePreviewModal
          preview={cascadeFlow.preview}
          newStart={cascadeFlow.newStart}
          newEnd={cascadeFlow.newEnd}
          appointment={cascadeFlow.appointment}
          businessName={businessName}
          onClose={handleCascadeClose}
          onConfirm={handleCascadeConfirm}
          onConfirmed={handleCascadeConfirmed}
        />
      ) : null}

      {delayAffected ? (
        <DelayWhatsAppModal
          affected={delayAffected}
          salonName={businessName}
          onClose={handleCloseDelayNotify}
        />
      ) : null}

      {payAppointment ? (
        <PaymentModal
          appointment={payAppointment}
          onClose={() => setPayAppointment(null)}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      ) : null}

      {whatsappBooking ? (
        <BookingWhatsAppModal
          appointment={whatsappBooking}
          businessName={businessName}
          onClose={handleCloseWhatsappBooking}
        />
      ) : null}

      {whatsappPayment ? (
        <PaymentWhatsAppModal
          appointment={whatsappPayment.appointment}
          businessName={businessName}
          paymentMethod={whatsappPayment.paymentMethod}
          googleReviewLink={googleReviewLink}
          onClose={handleCloseWhatsappPayment}
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
      <Toast
        message={bookingErrorToast ?? ""}
        show={bookingErrorToast !== null}
        variant="error"
        durationMs={5000}
        onDismiss={() => setBookingErrorToast(null)}
      />
      <Toast
        message="Time update ho gaya! ✅"
        show={timeChangeToast}
        onDismiss={() => setTimeChangeToast(false)}
      />
    </>
  );
}
