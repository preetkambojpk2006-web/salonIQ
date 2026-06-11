"use client";

import { Fragment, memo, useMemo } from "react";
import type { Appointment } from "@/lib/appointments/types";
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
];

function staffLabel(appointment: Appointment): string {
  return appointment.staff_name?.trim() || "Unassigned";
}

function appointmentHourInSalon(iso: string): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TIMEZONE,
    hour: "numeric",
    hour12: false,
  }).format(new Date(iso));

  return Number.parseInt(hour, 10);
}

function nearestSlotHour(hour: number): number {
  const exact = TIME_SLOTS.find((s) => s.hour === hour);
  if (exact) return exact.hour;

  return TIME_SLOTS.reduce((prev, cur) =>
    Math.abs(cur.hour - hour) < Math.abs(prev.hour - hour) ? cur : prev
  ).hour;
}

type CalendarDayGridProps = {
  dayAppointments: Appointment[];
  onCompletePay: (appointment: Appointment) => void;
  renderBlock: (
    appointment: Appointment,
    onCompletePay: () => void
  ) => React.ReactNode;
};

function CalendarDayGridInner({
  dayAppointments,
  onCompletePay,
  renderBlock,
}: CalendarDayGridProps) {
  const staffColumns = useMemo(() => {
    const names = new Set<string>();
    for (const a of dayAppointments) {
      names.add(staffLabel(a));
    }
    if (names.size === 0) {
      return ["Unassigned"];
    }
    return Array.from(names).sort();
  }, [dayAppointments]);

  const cellMap = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    const columnIndex = new Map(staffColumns.map((name, index) => [name, index]));

    for (const a of dayAppointments) {
      const label = staffLabel(a);
      const col = columnIndex.get(label) ?? 0;

      const hour = appointmentHourInSalon(a.start_time);
      const slot = nearestSlotHour(hour);
      const key = `${slot}-${col}`;
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }

    return map;
  }, [dayAppointments, staffColumns]);

  return (
    <div
      className="calendar-grid"
      style={{
        gridTemplateColumns: `86px repeat(${staffColumns.length}, minmax(160px, 1fr))`,
      }}
    >
      <div className="calendar-cell header">Time</div>
      {staffColumns.map((name) => (
        <div key={name} className="calendar-cell header">
          {name}
        </div>
      ))}

      {TIME_SLOTS.map((slot) => (
        <Fragment key={slot.hour}>
          <div className="calendar-cell time">{slot.label}</div>
          {staffColumns.map((name, colIndex) => {
            const items = cellMap.get(`${slot.hour}-${colIndex}`) ?? [];
            return (
              <div key={`${slot.hour}-${name}`} className="calendar-cell">
                {items.map((appointment) => (
                  <div key={appointment.id}>
                    {renderBlock(appointment, () => onCompletePay(appointment))}
                  </div>
                ))}
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

export const CalendarDayGrid = memo(CalendarDayGridInner);
