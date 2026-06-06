/**
 * Indian mobile helpers for customer create flow.
 * Pure functions — no I/O or side effects.
 */

export function normalizeIndianPhone(input: string): string {
  // Strip spaces, +, dashes, etc.
  const digits = input.replace(/\D/g, "");

  // Local 10-digit number
  if (digits.length === 10) {
    return digits;
  }

  // Country code 91 on a full 12-digit number (+91 XXXXXXXXXX)
  if (digits.startsWith("91") && digits.length === 12) {
    return digits.slice(2);
  }

  return digits;
}

export function isValidIndianPhone(input: string): boolean {
  const normalized = normalizeIndianPhone(input);

  // Valid Indian mobiles: 10 digits, starting with 6, 7, 8, or 9
  if (normalized.length !== 10) {
    return false;
  }

  return /^[6789]/.test(normalized);
}
