"use client";

import { Fragment, memo, useMemo } from "react";
import type { Appointment } from "@/lib/appointments/types";

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
];

const DEMO_STAFF = ["Aarav", "Meera", "Imran", "Priya"];

function staffLabel(appointment: Appointment): string {
  return appointment.staff_name?.trim() || "Unassigned";
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
    const list = Array.from(names).sort();
    const onlyUnassigned = list.length === 1 && list[0] === "Unassigned";
    if (list.length === 0 || onlyUnassigned) return DEMO_STAFF;
    return list;
  }, [dayAppointments]);

  const cellMap = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of dayAppointments) {
      const hour = new Date(a.start_time).getHours();
      const slot =
        TIME_SLOTS.find((s) => s.hour === hour)?.hour ??
        TIME_SLOTS.reduce((prev, cur) =>
          Math.abs(cur.hour - hour) < Math.abs(prev.hour - hour) ? cur : prev
        ).hour;
      const col = staffColumns.indexOf(staffLabel(a));
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
