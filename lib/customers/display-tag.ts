import type { Customer } from "@/lib/customers/types";

export type CustomerTagDisplay = {
  label: string;
  className: string;
};

export function getCustomerDisplayTag(customer: Customer): CustomerTagDisplay {
  const raw = customer.tags?.[0]?.trim();
  if (raw) {
    const lower = raw.toLowerCase();
    if (lower.includes("vip") || lower.includes("repeat") || lower.includes("staff") || lower.includes("loyal")) {
      return { label: raw, className: "tag green" };
    }
    if (lower.includes("due") || lower.includes("soon") || lower.includes("risk")) {
      return { label: raw, className: "tag orange" };
    }
    return { label: raw, className: "tag" };
  }

  if (customer.visit_count >= 10) {
    return { label: "VIP repeat", className: "tag green" };
  }
  if (customer.total_spend >= 15000) {
    return { label: "High value", className: "tag" };
  }
  if (customer.visit_count >= 6) {
    return { label: "Staff loyal", className: "tag green" };
  }

  if (customer.last_visit_at) {
    const daysSince =
      (Date.now() - new Date(customer.last_visit_at).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSince >= 60) {
      return { label: "At risk", className: "tag orange" };
    }
    if (daysSince >= 45) {
      return { label: "Due soon", className: "tag orange" };
    }
  } else if (customer.visit_count === 0) {
    return { label: "New", className: "tag" };
  }

  if (customer.total_spend >= 8000) {
    return { label: "Upsell package", className: "tag green" };
  }

  return { label: "Regular", className: "tag" };
}

export function getCustomerVisitLine(
  customer: Customer,
  notesFallback = "Add visit notes"
): string {
  const visits = customer.visit_count;
  const visitWord = visits === 1 ? "visit" : "visits";
  const detail = customer.notes?.trim() || notesFallback;
  return `${visits} ${visitWord} · ${detail}`;
}
