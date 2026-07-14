import { SALON_TIMEZONE } from "@/lib/payments/date-utils";

export function formatAppointmentEntityLabel(params: {
  customerName?: string | null;
  serviceName?: string | null;
  startTime?: string | null;
}): string {
  const customer = params.customerName?.trim() || "Walk-in";
  const service = params.serviceName?.trim() || "Service";
  if (!params.startTime) {
    return `${customer} - ${service}`;
  }

  const time = new Date(params.startTime).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: SALON_TIMEZONE,
  });

  return `${customer} - ${service} - ${time}`;
}

export function formatAuditTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: SALON_TIMEZONE,
  });
}
