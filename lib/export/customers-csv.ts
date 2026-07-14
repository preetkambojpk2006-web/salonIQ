import { computeLoyaltyProgress } from "@/lib/customers/loyalty-progress";
import type { BusinessRewardConfig } from "@/lib/customers/loyalty-types";
import type { Customer } from "@/lib/customers/types";
import { SALON_TIMEZONE } from "@/lib/payments/date-utils";

const CUSTOMER_CSV_HEADERS = [
  "Name",
  "Phone",
  "Total Visits",
  "Last Visit (IST)",
  "Total Spend",
  "Loyalty Points",
  "No-shows",
];

function formatLastVisit(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: SALON_TIMEZONE,
  });
}

function loyaltyPointsForCustomer(
  customer: Customer,
  rewardConfig: BusinessRewardConfig
): number | "" {
  const progress = computeLoyaltyProgress(customer, rewardConfig);
  if (!progress) return "";
  return progress.current;
}

export function buildCustomerCsvRows(
  customers: Customer[],
  rewardConfig: BusinessRewardConfig
): (string | number | null)[][] {
  return customers.map((customer) => [
    customer.name,
    customer.phone ?? "",
    customer.visit_count,
    formatLastVisit(customer.last_visit_at),
    customer.total_spend,
    loyaltyPointsForCustomer(customer, rewardConfig),
    customer.no_show_count,
  ]);
}

export { CUSTOMER_CSV_HEADERS };
