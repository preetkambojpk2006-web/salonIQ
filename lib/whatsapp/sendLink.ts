/**
 * Build a WhatsApp deep link for an Indian phone number and pre-filled message.
 * Pure helper — no network calls or side effects.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  // Keep digits only (strips spaces, +, dashes, etc.)
  let digits = phone.replace(/\D/g, "");

  // Assume India: 10-digit local numbers get country code 91
  if (!digits.startsWith("91")) {
    digits = `91${digits}`;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Opens WhatsApp with a pre-filled message; uses wa.me/?text= when no phone on file. */
export function buildWhatsAppReminderLink(
  phone: string | null | undefined,
  message: string
): string {
  const trimmed = phone?.trim();
  if (trimmed) {
    return buildWhatsAppLink(trimmed, message);
  }
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppReminder(
  phone: string | null | undefined,
  message: string
): void {
  window.open(
    buildWhatsAppReminderLink(phone, message),
    "_blank",
    "noopener,noreferrer"
  );
}
