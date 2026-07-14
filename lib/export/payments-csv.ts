import { SALON_TIMEZONE } from "@/lib/payments/date-utils";
import type { PaymentExportRow } from "@/lib/payments/types";

const PAYMENT_CSV_HEADERS = [
  "Date",
  "Time (IST)",
  "Customer",
  "Service",
  "Staff",
  "Amount",
  "Method",
  "Status",
];

function paymentTimestamp(row: PaymentExportRow): string {
  return row.paidAt ?? row.createdAt;
}

function formatPaymentDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: SALON_TIMEZONE,
  });
}

function formatPaymentTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: SALON_TIMEZONE,
  });
}

function formatPaymentMethod(method: PaymentExportRow["method"]): string {
  switch (method) {
    case "cash":
      return "Cash";
    case "upi":
      return "UPI";
    case "split":
      return "Split";
    case "card":
      return "Card";
    case "pending":
      return "Pending";
    default:
      return method;
  }
}

function formatPaymentStatus(status: PaymentExportRow["status"]): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "unpaid":
      return "Unpaid";
    case "partial":
      return "Partial";
    default:
      return status;
  }
}

export function buildPaymentCsvRows(
  payments: PaymentExportRow[]
): (string | number | null)[][] {
  return payments.map((row) => {
    const timestamp = paymentTimestamp(row);
    return [
      formatPaymentDate(timestamp),
      formatPaymentTime(timestamp),
      row.customerName ?? "",
      row.serviceName ?? "",
      row.staffName ?? "",
      row.amount,
      formatPaymentMethod(row.method),
      formatPaymentStatus(row.status),
    ];
  });
}

export { PAYMENT_CSV_HEADERS };
