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
