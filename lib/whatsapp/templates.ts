import type { Appointment } from "@/lib/appointments/types";
import type { PaymentMethod } from "@/lib/payments/types";

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function paymentMethodLabel(method: PaymentMethod | string | null | undefined): string {
  if (method === "cash") return "Cash";
  if (method === "upi") return "UPI";
  if (method === "pending") return "Pending";
  return "Payment";
}

export function buildConfirmationMessage(appointment: Appointment): string {
  const customer = appointment.customer_name ?? "Customer";
  const service = appointment.service_name ?? "Service";
  const staff = appointment.staff_name?.trim() || "Team";
  const amount = formatRs(appointment.total_amount);

  return `Hi ${customer}! Aapki appointment confirm ho gayi hai ✅
Service: ${service}
Staff: ${staff}
Amount: ${amount}
Thank you for choosing us! 🙏`;
}

export function buildPaymentReceiptMessage(
  appointment: Appointment,
  businessName: string,
  paymentMethod?: PaymentMethod | string | null
): string {
  const customer = appointment.customer_name ?? "Customer";
  const service = appointment.service_name ?? "Service";
  const amount = formatRs(appointment.total_amount);
  const method = paymentMethodLabel(paymentMethod);

  return `Hi ${customer}! Payment received ✅
Amount: ${amount} (${method})
Service: ${service}
Thank you! Dobara zaroor aayein 😊
— ${businessName}`;
}
