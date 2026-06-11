import type { Appointment } from "@/lib/appointments/types";

export function isOnlinePendingAppointment(appointment: {
  status: string;
  source: string;
}): boolean {
  return (
    appointment.status === "pending" &&
    appointment.source?.trim().toLowerCase() === "online"
  );
}

export function mergeAppointments(
  primary: Appointment[],
  extra: Appointment[]
): Appointment[] {
  const byId = new Map(primary.map((appointment) => [appointment.id, appointment]));

  for (const appointment of extra) {
    if (!byId.has(appointment.id)) {
      byId.set(appointment.id, appointment);
    }
  }

  return Array.from(byId.values()).sort((a, b) =>
    a.start_time.localeCompare(b.start_time)
  );
}
