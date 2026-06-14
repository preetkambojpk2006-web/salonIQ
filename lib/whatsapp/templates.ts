import type { Appointment } from "@/lib/appointments/types";
import type { PaymentMethod } from "@/lib/payments/types";

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function paymentMethodLabel(method: PaymentMethod | string | null | undefined): string {
  if (method === "cash") return "Cash";
  if (method === "upi") return "UPI";
  if (method === "card") return "Card";
  if (method === "pending") return "Pending";
  return "Payment";
}

function optionalLine(line: string, value?: string | null): string {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  return `${line}${trimmed}\n`;
}

// --- Legacy helpers (used by whatsapp-copy-buttons.tsx) ---

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

// --- Phase 5 typed templates ---

export interface BookingConfirmationParams {
  customerName: string;
  salonName: string;
  serviceName: string;
  dateStr: string;
  timeStr: string;
  staffName?: string;
  branchAddress?: string;
}

export function bookingConfirmation(params: BookingConfirmationParams): string {
  const customer = params.customerName?.trim() || "Customer";
  const salon = params.salonName?.trim() || "Salon";
  const service = params.serviceName?.trim() || "Service";
  const date = params.dateStr?.trim();
  const time = params.timeStr?.trim();

  let message = `Namaste ${customer}! 🙏\n`;
  message += `Aapki booking confirm ho gayi hai ${salon} mein.\n`;

  if (date) message += `📅 ${date}\n`;
  if (time) message += `⏰ ${time}\n`;

  message += `💇 Service: ${service}\n`;
  message += optionalLine("👤 Staff: ", params.staffName);
  message += optionalLine("📍 ", params.branchAddress);
  message += `Milte hain! ✨`;

  return message;
}

export interface Reminder24hrParams {
  customerName: string;
  salonName: string;
  serviceName: string;
  dateStr: string;
  timeStr: string;
}

export function reminder24hr(params: Reminder24hrParams): string {
  const customer = params.customerName?.trim() || "Customer";
  const salon = params.salonName?.trim() || "Salon";
  const service = params.serviceName?.trim() || "Service";
  const date = params.dateStr?.trim();
  const time = params.timeStr?.trim();

  let message = `Hey ${customer}! 👋\n`;
  message += `Kal aapki appointment hai ${salon} mein — mat bhoolna!\n`;

  if (date) message += `📅 ${date}\n`;
  if (time) message += `⏰ ${time}\n`;

  message += `💇 Service: ${service}\n`;
  message += `Confirm rehna, hum ready hain! ✨`;

  return message;
}

export interface Reminder2hrParams {
  customerName: string;
  salonName: string;
  timeStr: string;
  branchAddress?: string;
}

export function reminder2hr(params: Reminder2hrParams): string {
  const customer = params.customerName?.trim() || "Customer";
  const salon = params.salonName?.trim() || "Salon";
  const time = params.timeStr?.trim();

  let message = `Hi ${customer}! ⏰\n`;
  message += `Sirf 2 ghante mein aapki appointment hai ${salon} pe.\n`;

  if (time) message += `🕐 ${time}\n`;

  message += optionalLine("📍 ", params.branchAddress);
  message += `Jaldi milte hain! 😊`;

  return message;
}

export interface PaymentRequestParams {
  customerName: string;
  amount: number;
  serviceName: string;
  upiId?: string;
}

export function paymentRequest(params: PaymentRequestParams): string {
  const customer = params.customerName?.trim() || "Customer";
  const service = params.serviceName?.trim() || "Service";
  const amount = Number.isFinite(params.amount) ? params.amount : 0;

  let message = `Namaste ${customer}! 🙏\n`;
  message += `Aapki ${service} service complete ho gayi hai.\n`;
  message += `💰 Amount due: ${formatInr(amount)}\n`;
  message += optionalLine("📱 UPI: ", params.upiId);
  message += `Payment karke receipt share kar dena — shukriya! ✨`;

  return message;
}

export interface InvoiceParams {
  customerName: string;
  salonName: string;
  serviceName: string;
  amount: number;
  paymentMethod: string;
  dateStr: string;
  invoiceNumber: string;
}

export function invoice(params: InvoiceParams): string {
  const customer = params.customerName?.trim() || "Customer";
  const salon = params.salonName?.trim() || "Salon";
  const service = params.serviceName?.trim() || "Service";
  const amount = Number.isFinite(params.amount) ? params.amount : 0;
  const method = paymentMethodLabel(params.paymentMethod);
  const date = params.dateStr?.trim();
  const invoiceNo = params.invoiceNumber?.trim();

  let message = `Namaste ${customer}! 🙏\n`;
  message += `${salon} se aapka payment receive ho gaya — dhanyavaad!\n`;

  if (invoiceNo) message += `🧾 Invoice: ${invoiceNo}\n`;
  if (date) message += `📅 ${date}\n`;

  message += `💇 Service: ${service}\n`;
  message += `💰 Amount: ${formatInr(amount)}\n`;
  message += `💳 Paid via: ${method}\n`;
  message += `Khubsoorat din! ✨`;

  return message;
}

export interface RevisitReminderParams {
  customerName: string;
  salonName: string;
  daysSinceLastVisit: number;
  suggestedService?: string;
}

export function revisitReminder(params: RevisitReminderParams): string {
  const customer = params.customerName?.trim() || "Customer";
  const salon = params.salonName?.trim() || "Salon";
  const days = Number.isFinite(params.daysSinceLastVisit)
    ? Math.max(0, Math.round(params.daysSinceLastVisit))
    : 0;

  let message = `Hi ${customer}! 💇\n`;
  message += optionalLine("✨ Suggestion: ", params.suggestedService);
  message += `${days} din ho gaye ${salon} aaye hue — hum miss kar rahe hain!\n`;
  message += `Ek fresh look ke liye wapas aao — hum ready hain! ✨`;

  return message;
}

export interface BirthdayOfferParams {
  customerName: string;
  salonName: string;
  discountPercent: number;
  validUntilDate: string;
}

export function birthdayOffer(params: BirthdayOfferParams): string {
  const customer = params.customerName?.trim() || "Customer";
  const salon = params.salonName?.trim() || "Salon";
  const discount = Number.isFinite(params.discountPercent)
    ? Math.max(0, Math.round(params.discountPercent))
    : 0;
  const validUntil = params.validUntilDate?.trim();

  let message = `Happy Birthday ${customer}! 🎂🎉\n`;
  message += `${salon} ki taraf se special gift — ${discount}% off!\n`;

  if (validUntil) message += `🎁 Valid till: ${validUntil}\n`;

  message += `Celebrate karo, glow karo! Book karke bata dena ✨`;

  return message;
}

export interface GoogleReviewRequestParams {
  customerName: string;
  salonName: string;
  googleReviewLink: string;
}

export function googleReviewRequest(params: GoogleReviewRequestParams): string {
  const customer = params.customerName?.trim() || "Customer";
  const salon = params.salonName?.trim() || "Salon";
  const link = params.googleReviewLink?.trim();

  let message = `Namaste ${customer}! 🙏\n`;
  message += `${salon} mein aana acha laga.\n`;
  message += `Aapka experience kaisa raha? Hamare baare mein Google pe ek review likhein — hamare liye bahut helpful hoga! ⭐\n`;

  if (link) {
    message += `${link}\n`;
  }

  message += `Agle visit par kuch khaas milega! 😊`;

  return message;
}

export interface RewardEarnedParams {
  customerName: string;
  salonName: string;
  rewardDescription: string;
}

export function rewardEarned(params: RewardEarnedParams): string {
  const customer = params.customerName?.trim() || "Customer";
  const salon = params.salonName?.trim() || "Salon";
  const reward = params.rewardDescription?.trim() || "special reward";

  let message = `Namaste ${customer}! 🎉\n`;
  message += `${salon} ki taraf se aapke liye khaas khushkhabri!\n`;
  message += `Aapne loyalty reward jeet liya hai — ${reward}! 🎁\n`;
  message += `Agle visit par claim kar lena. Hum intezar karenge! ✨`;

  return message;
}

export interface DelayNotificationParams {
  customerName: string;
  salonName: string;
  serviceName: string;
  staffName: string;
  oldDateStr: string;
  oldTimeStr: string;
  newDateStr: string;
  newTimeStr: string;
}

export function delayNotification(params: DelayNotificationParams): string {
  const customer = params.customerName?.trim() || "Customer";
  const salon = params.salonName?.trim() || "Salon";
  const service = params.serviceName?.trim() || "Service";
  const staff = params.staffName?.trim() || "Team";
  const oldDate = params.oldDateStr?.trim();
  const oldTime = params.oldTimeStr?.trim();
  const newDate = params.newDateStr?.trim();
  const newTime = params.newTimeStr?.trim();

  let message = `Namaste ${customer}! 🙏\n`;
  message += `${salon} se update — aapki appointment shift ho gayi hai.\n`;

  if (oldDate || oldTime) {
    message += `Pehle: 📅 ${oldDate ?? "—"} · ⏰ ${oldTime ?? "—"}\n`;
  }
  if (newDate || newTime) {
    message += `Ab: 📅 ${newDate ?? "—"} · ⏰ ${newTime ?? "—"}\n`;
  }

  message += `💇 Service: ${service}\n`;
  message += `👤 Staff: ${staff}\n`;
  message += `Inconvenience ke liye maafi chahenge. Hum ready hain! ✨`;

  return message;
}

export interface QueueYourTurnParams {
  customerName: string;
  salonName: string;
  tokenNumber: number;
}

export function queueYourTurn(params: QueueYourTurnParams): string {
  const customer = params.customerName?.trim() || "Customer";
  const salon = params.salonName?.trim() || "Salon";
  const token = Number.isFinite(params.tokenNumber)
    ? Math.max(1, Math.round(params.tokenNumber))
    : 1;

  return `Namaste ${customer}! 🎉
${salon} mein aapki baari aa gayi hai!
Token number: #${token}
Kripya abhi counter par aa jayein.
Dhanyavaad! 🙏`;
}
