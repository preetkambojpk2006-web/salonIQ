"use client";

import { memo, useMemo } from "react";
import type { Appointment } from "@/lib/appointments/types";
import { effectiveEndTime } from "@/lib/appointments/cascade";
import { formatTime12hInSalon } from "@/lib/format/time";
import { SALON_TIMEZONE } from "@/lib/payments/date-utils";

const TIME_SLOTS = [
  { hour: 10, label: "10 AM" },
  { hour: 11, label: "11 AM" },
  { hour: 12, label: "12 PM" },
  { hour: 13, label: "1 PM" },
  { hour: 14, label: "2 PM" },
  { hour: 15, label: "3 PM" },
  { hour: 16, label: "4 PM" },
  { hour: 17, label: "5 PM" },
  { hour: 18, label: "6 PM" },
  { hour: 19, label: "7 PM" },
  { hour: 20, label: "8 PM" },
];

/** Matches `.calendar-cell { min-height: 74px }` in globals.css — one hour row */
const SLOT_HEIGHT_PX = 74;
const GRID_START_HOUR = TIME_SLOTS[0]?.hour ?? 10;
const GRID_BOTTOM_PADDING_PX = 20;
const MIN_BLOCK_HEIGHT_PX = SLOT_HEIGHT_PX / 2;
const SHORT_BLOCK_HEIGHT_PX = MIN_BLOCK_HEIGHT_PX;

export type GridBlockOptions = {
  showTimes: boolean;
  timeLabel: string;
  serviceLabel: string;
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

function minutesFromGridStart(iso: string): number {
  const { hour, minute } = appointmentStartParts(iso);
  return (hour - GRID_START_HOUR) * 60 + minute;
}

function durationMinutes(startIso: string, endIso: string | null): number {
  const start = new Date(startIso);
  const end = effectiveEndTime(start, endIso ? new Date(endIso) : null);
  return Math.max(30, (end.getTime() - start.getTime()) / (60 * 1000));
}

function blockLayout(appointment: Appointment): {
  topPx: number;
  heightPx: number;
  gridOptions: GridBlockOptions;
} {
  const topPx = (minutesFromGridStart(appointment.start_time) / 60) * SLOT_HEIGHT_PX;
  const durationMins = durationMinutes(
    appointment.start_time,
    appointment.end_time
  );
  const heightPx = Math.max(
    MIN_BLOCK_HEIGHT_PX,
    (durationMins / 60) * SLOT_HEIGHT_PX
  );
  const end = effectiveEndTime(
    new Date(appointment.start_time),
    appointment.end_time ? new Date(appointment.end_time) : null
  );
  const showTimes = heightPx > SHORT_BLOCK_HEIGHT_PX;
  const serviceLabel = appointment.service_name?.trim() || "Service";

  return {
    topPx: Math.max(0, topPx),
    heightPx,
    gridOptions: {
      showTimes,
      timeLabel: `${formatTime12hInSalon(appointment.start_time)} – ${formatTime12hInSalon(end.toISOString())}`,
      serviceLabel,
    },
  };
}

type CalendarDayGridProps = {
  dayAppointments: Appointment[];
  onCompletePay: (appointment: Appointment) => void;
  renderBlock: (
    appointment: Appointment,
    onCompletePay: () => void,
    gridOptions?: GridBlockOptions
  ) => React.ReactNode;
};

function CalendarDayGridInner({
  dayAppointments,
  onCompletePay,
  renderBlock,
}: CalendarDayGridProps) {
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

  const gridHeightPx = TIME_SLOTS.length * SLOT_HEIGHT_PX + GRID_BOTTOM_PADDING_PX;
  const bodyRowStart = 2;
  const bodyRowEnd = bodyRowStart + TIME_SLOTS.length;

  return (
    <div
      className="calendar-grid"
      style={{
        gridTemplateColumns: `86px repeat(${staffColumns.length}, minmax(160px, 1fr))`,
        gridTemplateRows: `46px repeat(${TIME_SLOTS.length}, ${SLOT_HEIGHT_PX}px)`,
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

      {TIME_SLOTS.map((slot, index) => (
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
          {TIME_SLOTS.map((slot, index) => (
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
            const layout = blockLayout(appointment);

            return (
              <div
                key={appointment.id}
                style={{
                  position: "absolute",
                  left: 8,
                  right: 8,
                  top: layout.topPx + 4,
                  minHeight: Math.max(MIN_BLOCK_HEIGHT_PX, layout.heightPx - 8),
                  height: "auto",
                  zIndex: 1,
                  overflow: "visible",
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
