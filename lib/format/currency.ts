/** Display currency as whole rupees with the ₹ symbol (en-IN grouping). */
export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
