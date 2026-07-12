"use client";

import { memo, useMemo } from "react";
import type { Appointment } from "@/lib/appointments/types";
import { effectiveEndTime } from "@/lib/appointments/cascade";
import type { BookingHours } from "@/lib/booking/opening-hours";
import { parseInternalBookingHours } from "@/lib/booking/opening-hours";
import { buildCalendarHourRows } from "@/lib/booking/slots";
import { formatTime12hInSalon } from "@/lib/format/time";
import { SALON_TIMEZONE } from "@/lib/payments/date-utils";

/** Matches `.calendar-cell { min-height: 74px }` in globals.css — one hour row */
const SLOT_HEIGHT_PX = 74;
const GRID_BOTTOM_PADDING_PX = 20;
/** Minimum readable card height in the grid (customer + service + time). */
const CARD_MIN_HEIGHT_PX = 64;
/** Below this block height, merge service + time on one line. */
const GRID_COMPACT_MAX_HEIGHT_PX = 88;

export type GridBlockOptions = {
  timeLabel: string;
  heightPx: number;
  isCompact: boolean;
};

function staffLabel(appointment: Appointment): string {
  return appointment.staff_name?.trim() || "Unassigned";
}

function appointmentStartParts(iso: string): { hour: number; minute: number } {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number.parseInt(
    parts.find((part) => part.type === "hour")?.value ?? "0",
    10
  );
  const minute = Number.parseInt(
    parts.find((part) => part.type === "minute")?.value ?? "0",
    10
  );

  return { hour, minute };
}

function minutesFromGridStart(
  iso: string,
  gridStartHour: number
): number {
  const { hour, minute } = appointmentStartParts(iso);
  return (hour - gridStartHour) * 60 + minute;
}

function durationMinutes(startIso: string, endIso: string | null): number {
  const start = new Date(startIso);
  const end = effectiveEndTime(start, endIso ? new Date(endIso) : null);
  return Math.max(30, (end.getTime() - start.getTime()) / (60 * 1000));
}

function blockLayout(
  appointment: Appointment,
  gridStartHour: number
): {
  topPx: number;
  heightPx: number;
  gridOptions: GridBlockOptions;
} {
  const topPx =
    (minutesFromGridStart(appointment.start_time, gridStartHour) / 60) *
    SLOT_HEIGHT_PX;
  const durationMins = durationMinutes(
    appointment.start_time,
    appointment.end_time
  );
  const rawHeightPx = (durationMins / 60) * SLOT_HEIGHT_PX;
  const heightPx = Math.max(CARD_MIN_HEIGHT_PX, rawHeightPx);
  const end = effectiveEndTime(
    new Date(appointment.start_time),
    appointment.end_time ? new Date(appointment.end_time) : null
  );
  const isCompact = heightPx < GRID_COMPACT_MAX_HEIGHT_PX;

  return {
    topPx: Math.max(0, topPx),
    heightPx,
    gridOptions: {
      timeLabel: `${formatTime12hInSalon(appointment.start_time)} – ${formatTime12hInSalon(end.toISOString())}`,
      heightPx,
      isCompact,
    },
  };
}

type CalendarDayGridProps = {
  dayAppointments: Appointment[];
  bookingHours?: BookingHours;
  onCompletePay: (appointment: Appointment) => void;
  renderBlock: (
    appointment: Appointment,
    onCompletePay: () => void,
    gridOptions?: GridBlockOptions
  ) => React.ReactNode;
};

function CalendarDayGridInner({
  dayAppointments,
  bookingHours,
  onCompletePay,
  renderBlock,
}: CalendarDayGridProps) {
  const resolvedHours = bookingHours ?? parseInternalBookingHours(null);
  const timeSlots = useMemo(
    () => buildCalendarHourRows(resolvedHours),
    [resolvedHours]
  );
  const gridStartHour = resolvedHours.openHour;

  const staffColumns = useMemo(() => {
    const names = new Set<string>();
    for (const appointment of dayAppointments) {
      names.add(staffLabel(appointment));
    }
    if (names.size === 0) {
      return ["Unassigned"];
    }
    return Array.from(names).sort();
  }, [dayAppointments]);

  const appointmentsByStaff = useMemo(() => {
    const map = new Map<string, Appointment[]>();

    for (const appointment of dayAppointments) {
      const label = staffLabel(appointment);
      const list = map.get(label) ?? [];
      list.push(appointment);
      map.set(label, list);
    }

    for (const list of Array.from(map.values())) {
      list.sort((a: Appointment, b: Appointment) =>
        a.start_time.localeCompare(b.start_time)
      );
    }

    return map;
  }, [dayAppointments]);

  const gridHeightPx = timeSlots.length * SLOT_HEIGHT_PX + GRID_BOTTOM_PADDING_PX;
  const bodyRowStart = 2;
  const bodyRowEnd = bodyRowStart + timeSlots.length;

  return (
    <div
      className="calendar-grid"
      style={{
        gridTemplateColumns: `86px repeat(${staffColumns.length}, minmax(160px, 1fr))`,
        gridTemplateRows: `46px repeat(${timeSlots.length}, ${SLOT_HEIGHT_PX}px)`,
        paddingBottom: GRID_BOTTOM_PADDING_PX,
      }}
    >
      <div className="calendar-cell header" style={{ gridColumn: 1, gridRow: 1 }}>
        Time
      </div>
      {staffColumns.map((name, index) => (
        <div
          key={name}
          className="calendar-cell header"
          style={{ gridColumn: index + 2, gridRow: 1 }}
        >
          {name}
        </div>
      ))}

      {timeSlots.map((slot, index) => (
        <div
          key={slot.hour}
          className="calendar-cell time"
          style={{ gridColumn: 1, gridRow: bodyRowStart + index }}
        >
          {slot.label}
        </div>
      ))}

      {staffColumns.map((name, colIndex) => (
        <div
          key={name}
          className="calendar-cell"
          style={{
            gridColumn: colIndex + 2,
            gridRow: `${bodyRowStart} / ${bodyRowEnd}`,
            position: "relative",
            minHeight: gridHeightPx,
            height: gridHeightPx,
            padding: 0,
            overflow: "visible",
            background: "#fff",
          }}
        >
          {timeSlots.map((slot, index) => (
            <div
              key={slot.hour}
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: index * SLOT_HEIGHT_PX,
                height: SLOT_HEIGHT_PX,
                borderBottom: "1px solid var(--line)",
                pointerEvents: "none",
              }}
            />
          ))}

          {(appointmentsByStaff.get(name) ?? []).map((appointment) => {
            const layout = blockLayout(appointment, gridStartHour);

            return (
              <div
                key={appointment.id}
                className="cal-grid-slot"
                style={{
                  top: layout.topPx + 4,
                  minHeight: CARD_MIN_HEIGHT_PX,
                  height: Math.max(CARD_MIN_HEIGHT_PX, layout.heightPx - 8),
                }}
              >
                {renderBlock(
                  appointment,
                  () => onCompletePay(appointment),
                  layout.gridOptions
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export const CalendarDayGrid = memo(CalendarDayGridInner);
