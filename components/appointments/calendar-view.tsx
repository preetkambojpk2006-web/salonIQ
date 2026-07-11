"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle } from "lucide-react";
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
import type { ReviewsSocialPrompts } from "@/lib/settings/reviews-social";
import type { CascadePreview } from "@/lib/appointments/cascade";
import type { PaymentMethod } from "@/lib/payments/types";
import { useBusinessRealtimeRefresh } from "@/lib/supabase/use-business-realtime";
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
import { formatTime12h } from "@/lib/format/time";
import { calendarDayInTimezone, SALON_TIMEZONE, todayCalendarDay, mondayOfWeekCalendarDay, addCalendarDays } from "@/lib/payments/date-utils";
import { useT } from "@/lib/i18n/LanguageContext";

type CalendarViewProps = {
  appointments: Appointment[];
  onlinePending?: Appointment[];
  businessId?: string | null;
  businessName: string;
  googleReviewLink?: string | null;
  reviewsSocial?: ReviewsSocialPrompts;
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

function formatDateHeading(
  iso: string,
  t: (key: string) => string
): string {
  const date = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return t("today.title");
  if (sameDay(date, tomorrow)) return t("today.tomorrow");

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

function safeDecodeError(error: string): string {
  try {
    return decodeURIComponent(error);
  } catch {
    return error;
  }
}

function PendingSubmitButton({
  label,
  pendingLabel,
  className,
  style,
}: {
  label: string;
  pendingLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { t } = useT();
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      style={style}
      disabled={pending}
    >
      {pending ? (pendingLabel ?? t("common.saving")) : label}
    </button>
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

  for (const list of Array.from(map.values())) {
    list.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  }

  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function filterAppointmentsForView(
  appointments: Appointment[],
  viewMode: "day" | "week" | "month"
): Appointment[] {
  const today = todayCalendarDay(SALON_TIMEZONE);

  if (viewMode === "day") {
    return appointments.filter(
      (appointment) => dateKey(appointment.start_time) === today
    );
  }

  if (viewMode === "week") {
    const weekStart = mondayOfWeekCalendarDay(SALON_TIMEZONE);
    const weekEnd = addCalendarDays(weekStart, 6, SALON_TIMEZONE);
    return appointments.filter((appointment) => {
      const key = dateKey(appointment.start_time);
      return key >= weekStart && key <= weekEnd;
    });
  }

  const monthPrefix = today.slice(0, 7);
  return appointments.filter((appointment) =>
    dateKey(appointment.start_time).startsWith(monthPrefix)
  );
}

function AppointmentSourceTag({ appointment }: { appointment: Appointment }) {
  const { t } = useT();
  if (appointment.status !== "pending") return null;

  if (isOnlinePendingAppointment(appointment)) {
    return (
      <span className="tag orange" style={{ marginBottom: 6, display: "inline-flex" }}>
        {t("calendar.onlineConfirm")}
      </span>
    );
  }

  return (
    <span className="tag orange" style={{ marginBottom: 6, display: "inline-flex" }}>
      {t("status.pending")}
    </span>
  );
}

function PaidStatusBadge({ isPaid }: { isPaid: boolean }) {
  const { t } = useT();

  if (isPaid) {
    return <span className="cal-paid-badge">{t("common.paid")}</span>;
  }

  return <span className="cal-pending-badge">{t("status.pending")}</span>;
}

type GridVariant = "completed" | "online" | "upcoming";

function gridVariant(appointment: Appointment): GridVariant {
  if (
    appointment.status === "completed" ||
    appointment.payment_status === "paid"
  ) {
    return "completed";
  }
  if (isOnlinePendingAppointment(appointment)) {
    return "online";
  }
  return "upcoming";
}

/** Compact single-line status badge used in the list rows. */
function StatusBadge({ appointment }: { appointment: Appointment }) {
  const { t } = useT();

  if (
    appointment.status === "completed" ||
    appointment.payment_status === "paid"
  ) {
    return <PaidStatusBadge isPaid={appointment.payment_status === "paid"} />;
  }

  if (appointment.status === "no_show") {
    return <span className="cal-status cal-status--muted">{t("status.noShow")}</span>;
  }

  if (appointment.status === "cancelled") {
    return (
      <span className="cal-status cal-status--muted">{t("status.cancelled")}</span>
    );
  }

  if (appointment.status === "pending") {
    if (isOnlinePendingAppointment(appointment)) {
      return <span className="cal-status cal-status--online">{t("calendar.online")}</span>;
    }
    return <span className="cal-status cal-status--pending">{t("calendar.pending")}</span>;
  }

  return (
    <span className="cal-status cal-status--confirmed">{t("status.confirmed")}</span>
  );
}

/** Top-right corner content inside a grid card. Informational only. */
function GridCardAside({
  appointment,
  businessName,
  onCopied,
}: {
  appointment: Appointment;
  businessName: string;
  onCopied: () => void;
}) {
  const { t } = useT();
  const variant = gridVariant(appointment);

  if (variant === "completed") {
    return (
      <div className="cal-card-aside" onClick={(event) => event.stopPropagation()}>
        <PaidStatusBadge isPaid={appointment.payment_status === "paid"} />
        <WhatsAppCopyButtons
          appointment={appointment}
          businessName={businessName}
          onCopied={onCopied}
          compact
          menuPlacement="top"
        />
      </div>
    );
  }

  if (variant === "online") {
    return (
      <div className="cal-card-aside">
        <span className="cal-status cal-status--online">{t("calendar.online")}</span>
      </div>
    );
  }

  return null;
}

function GridBookingCard({
  appointment,
  gridOptions,
  businessName,
  onCopied,
  onOpenDetail,
}: {
  appointment: Appointment;
  gridOptions: GridBlockOptions;
  businessName: string;
  onCopied: () => void;
  onOpenDetail: () => void;
}) {
  const variant = gridVariant(appointment);
  const serviceLabel = appointment.service_name ?? "Service";

  return (
    <div className={`cal-card cal-card--grid cal-card--${variant}`}>
      <div className="cal-card-row">
        <button
          type="button"
          className="cal-card-main"
          onClick={onOpenDetail}
          aria-label={`Open booking for ${appointment.customer_name ?? "customer"}`}
        >
          <div className="cal-card-text">
            <span className="cal-card-line cal-card-name">
              {appointment.customer_name ?? "Walk-in"}
            </span>
            {gridOptions.isCompact ? (
              <span className="cal-card-line cal-card-meta">
                {serviceLabel} · {gridOptions.timeLabel}
              </span>
            ) : (
              <>
                <span className="cal-card-line cal-card-service">
                  {serviceLabel}
                </span>
                <span className="cal-card-line cal-card-time">
                  {gridOptions.timeLabel}
                </span>
              </>
            )}
          </div>
        </button>

        <GridCardAside
          appointment={appointment}
          businessName={businessName}
          onCopied={onCopied}
        />
      </div>
    </div>
  );
}

/** Clean single-line list row: time · name · service · status. Opens modal. */
function AppointmentListRow({
  appointment,
  onOpenDetail,
}: {
  appointment: Appointment;
  onOpenDetail: () => void;
}) {
  const variant = gridVariant(appointment);
  const flagged =
    shouldShowReliabilityAlert(appointment) &&
    appointment.customer_reliability != null;

  return (
    <button
      type="button"
      className={`cal-list-row cal-list-row--${variant}`}
      onClick={onOpenDetail}
      aria-label={`Open booking for ${appointment.customer_name ?? "customer"}`}
    >
      <span className="cal-list-time">
        {formatTime12h(appointment.start_time)}
      </span>
      <span className="cal-list-body">
        {flagged ? (
          <AlertTriangle
            size={14}
            strokeWidth={1.5}
            className="cal-list-warn"
            aria-hidden
          />
        ) : null}
        <span className="cal-list-name">
          {appointment.customer_name ?? "Walk-in"}
        </span>
        <span className="cal-list-sep" aria-hidden>
          ·
        </span>
        <span className="cal-list-service">
          {appointment.service_name ?? "Service"}
        </span>
      </span>
      <StatusBadge appointment={appointment} />
    </button>
  );
}

function AppointmentActions({
  appointment,
  onCompletePay,
  onCopied,
  businessName,
  canManageFinance = true,
  compact = false,
  cornerActionsHandled = false,
}: {
  appointment: Appointment;
  onCompletePay: () => void;
  onCopied: () => void;
  businessName: string;
  canManageFinance?: boolean;
  compact?: boolean;
  /** When true, completed copy actions render on the card corner instead. */
  cornerActionsHandled?: boolean;
}) {
  const { t } = useT();
  const compactPrimaryClass = "primary-button";
  const compactSecondaryClass = "demo-button";

  if (appointment.status === "completed") {
    if (cornerActionsHandled) {
      return null;
    }

    return (
      <WhatsAppCopyButtons
        appointment={appointment}
        businessName={businessName}
        onCopied={onCopied}
        compact={compact}
      />
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
              label={t("common.confirm")}
              className={compactPrimaryClass}
            />
          </form>
          <form action={rejectAppointment}>
            <input type="hidden" name="appointment_id" value={appointment.id} />
            <PendingSubmitButton
              label={t("common.reject")}
              className={compactSecondaryClass}
              style={{ minHeight: 40 }}
            />
          </form>
        </>
      ) : null}

      {appointment.status === "pending" || appointment.status === "confirmed"
        ? canManageFinance && (
            <button
              type="button"
              className={compactPrimaryClass}
              onClick={onCompletePay}
            >
              {t("calendar.completePay")}
            </button>
          )
        : null}

      {appointment.status === "pending" || appointment.status === "confirmed" ? (
        <form action={markNoShow}>
          <input type="hidden" name="appointment_id" value={appointment.id} />
          <PendingSubmitButton
            label={t("status.noShow")}
            className={compactSecondaryClass}
            style={{ minHeight: 40 }}
          />
        </form>
      ) : null}
      </div>
    </div>
  );
}

const AppointmentBlock = memo(function AppointmentBlock({
  appointment,
  businessName,
  onCopied,
  onOpenDetail,
  gridOptions,
}: {
  appointment: Appointment;
  businessName: string;
  onCopied: () => void;
  onOpenDetail: () => void;
  gridOptions?: GridBlockOptions;
}) {
  if (gridOptions) {
    return (
      <GridBookingCard
        appointment={appointment}
        gridOptions={gridOptions}
        businessName={businessName}
        onCopied={onCopied}
        onOpenDetail={onOpenDetail}
      />
    );
  }

  return (
    <AppointmentListRow appointment={appointment} onOpenDetail={onOpenDetail} />
  );
});

export function CalendarView({
  appointments,
  onlinePending = [],
  businessId = null,
  businessName,
  googleReviewLink = null,
  reviewsSocial,
  canManageFinance = true,
  canEditAppointmentTime = false,
  openBooking = false,
  error,
  showAddedToast = false,
  addedAppointmentId,
  showPaymentToast = false,
}: CalendarViewProps) {
  const { t } = useT();
  const router = useRouter();

  useBusinessRealtimeRefresh({ businessId, tableSet: "calendar" });
  const [localAppointments, setLocalAppointments] = useState(appointments);
  const [localOnlinePending, setLocalOnlinePending] = useState(onlinePending);
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
  const [commissionWarningToast, setCommissionWarningToast] = useState(false);
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

  useEffect(() => {
    setLocalAppointments(appointments);
  }, [appointments]);

  useEffect(() => {
    setLocalOnlinePending(onlinePending);
  }, [onlinePending]);

  const mergedAppointments = useMemo(
    () => mergeAppointments(localAppointments, localOnlinePending),
    [localAppointments, localOnlinePending]
  );

  const onlinePendingIds = useMemo(
    () => new Set(localOnlinePending.map((appointment) => appointment.id)),
    [localOnlinePending]
  );

  const onlinePendingCount = localOnlinePending.length;

  const visibleAppointments = useMemo(() => {
    if (!onlinePendingOnly) return mergedAppointments;
    return localOnlinePending;
  }, [mergedAppointments, localOnlinePending, onlinePendingOnly]);

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

  const filteredAppointments = useMemo(
    () => filterAppointmentsForView(visibleAppointments, viewMode),
    [visibleAppointments, viewMode]
  );

  const grouped = useMemo(
    () => groupByDate(filteredAppointments),
    [filteredAppointments]
  );

  const handleOpenDetail = useCallback((appointment: Appointment) => {
    setDetailAppointment(appointment);
  }, []);

  const handleCompletePay = useCallback((appointment: Appointment) => {
    setDetailAppointment(null);
    setPayAppointment(appointment);
  }, []);

  const handleCopied = useCallback(() => setCopyToast(true), []);

  const handlePaymentSuccess = useCallback(
    (method: PaymentMethod, meta?: { commissionWarning?: boolean }) => {
      setPaymentToast(true);

      if (meta?.commissionWarning) {
        setCommissionWarningToast(true);
      }

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
      setTimeChangeToast(true);

      setLocalAppointments((current) =>
        current.map((row) => {
          if (row.id === preview.anchor.id) {
            return {
              ...row,
              start_time: preview.anchor.new_start,
              end_time: preview.anchor.new_end,
            };
          }
          const shifted = preview.shifted.find((item) => item.id === row.id);
          if (shifted) {
            return {
              ...row,
              start_time: shifted.new_start,
              end_time: shifted.new_end,
            };
          }
          return row;
        })
      );

      setLocalOnlinePending((current) =>
        current.map((row) => {
          if (row.id === preview.anchor.id) {
            return {
              ...row,
              start_time: preview.anchor.new_start,
              end_time: preview.anchor.new_end,
            };
          }
          const shifted = preview.shifted.find((item) => item.id === row.id);
          if (shifted) {
            return {
              ...row,
              start_time: shifted.new_start,
              end_time: shifted.new_end,
            };
          }
          return row;
        })
      );

      if (appointment) {
        setDetailAppointment({
          ...appointment,
          start_time: preview.anchor.new_start,
          end_time: preview.anchor.new_end,
        });
      }

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
      _onPay: () => void,
      gridOptions?: GridBlockOptions
    ) => (
      <AppointmentBlock
        appointment={appointment}
        businessName={businessName}
        onCopied={handleCopied}
        onOpenDetail={() => handleOpenDetail(appointment)}
        gridOptions={gridOptions}
      />
    ),
    [businessName, handleCopied, handleOpenDetail]
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
          <div className="panel-header calendar-toolbar">
            <div className="topbar-actions calendar-toolbar-actions">
              {onlinePendingCount > 0 ? (
                <button
                  type="button"
                  className={onlinePendingOnly ? "primary-button" : "demo-button"}
                  onClick={() => setOnlinePendingOnly((value) => !value)}
                  style={{ minHeight: 40 }}
                >
                  {t("calendar.onlinePending", {
                    count: String(onlinePendingCount),
                  })}
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
                {t("today.newBooking")}
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
              title={t("calendar.emptyTitle")}
              description={t("calendar.emptyDescription")}
              actionLabel={t("calendar.newBooking")}
              onAction={openNewBooking}
            />
          ) : visibleAppointments.length === 0 ? (
            <p className="text-body" style={{ color: "var(--muted)" }}>
              {t("calendar.noOnlinePending")}
            </p>
          ) : filteredAppointments.length === 0 ? (
            <div className="view-stack">
              {onlinePendingCount > 0 ? (
                <OnlinePendingRequests appointments={localOnlinePending} />
              ) : null}
              <p className="text-body" style={{ color: "var(--muted)" }}>
                {viewMode === "day"
                  ? t("calendar.noDayAppointments")
                  : viewMode === "week"
                    ? t("calendar.noWeekAppointments")
                    : t("calendar.noMonthAppointments")}
              </p>
            </div>
          ) : (
            <div className="view-stack">
              {onlinePendingCount > 0 ? (
                <OnlinePendingRequests appointments={localOnlinePending} />
              ) : null}

              {grouped.map(([key, dayAppointments]) => (
                <div key={key}>
                  <p className="eyebrow" style={{ marginBottom: 12 }}>
                    {formatDateHeading(dayAppointments[0].start_time, t)}
                    {viewMode === "month"
                      ? ` — ${dayAppointments.length} ${
                          dayAppointments.length === 1 ? "booking" : "bookings"
                        }`
                      : null}
                  </p>
                  <div className="appointment-list stagger-list" style={{ marginBottom: 16 }}>
                    {dayAppointments
                      .filter((appointment) => !onlinePendingIds.has(appointment.id))
                      .map((appointment) => (
                      <AppointmentBlock
                        key={appointment.id}
                        appointment={appointment}
                        businessName={businessName}
                        onCopied={handleCopied}
                        onOpenDetail={() => handleOpenDetail(appointment)}
                      />
                    ))}
                  </div>
                  {viewMode !== "month" ? (
                    <div className="hidden desktop:block">
                      <CalendarDayGrid
                        dayAppointments={dayAppointments}
                        onCompletePay={handleCompletePay}
                        renderBlock={renderGridBlock}
                      />
                    </div>
                  ) : null}
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
          reviewsSocial={reviewsSocial}
          onClose={handleCloseWhatsappPayment}
        />
      ) : null}

      <Toast
        message={t("calendar.bookingSaved")}
        show={bookingToast}
        onDismiss={() => setBookingToast(false)}
      />
      <Toast
        message={t("calendar.paymentSaved")}
        show={paymentToast}
        onDismiss={() => setPaymentToast(false)}
      />
      <Toast
        message={t("payment.commissionWarning")}
        show={commissionWarningToast}
        variant="warning"
        durationMs={7000}
        style={{ bottom: 148 }}
        onDismiss={() => setCommissionWarningToast(false)}
      />
      <Toast
        message={paymentErrorToast ?? ""}
        show={paymentErrorToast !== null}
        variant="error"
        durationMs={5000}
        onDismiss={() => setPaymentErrorToast(null)}
      />
      <Toast
        message={t("calendar.copied")}
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
        message={t("calendar.timeUpdated")}
        show={timeChangeToast}
        onDismiss={() => setTimeChangeToast(false)}
      />
    </>
  );
}
