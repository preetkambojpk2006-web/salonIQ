"use client";

import { memo } from "react";
import {
  getCustomerDisplayTag,
  getCustomerVisitLine,
} from "@/lib/customers/display-tag";
import type { Customer, CustomerReliability } from "@/lib/customers/types";

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

type CustomerCardProps = {
  customer: Customer;
};

function ReliabilityBadge({ reliability }: { reliability: CustomerReliability }) {
  if (reliability === "good") return null;

  const isWarning = reliability === "warning";

  return (
    <span
      style={{
        display: "inline-block",
        marginBottom: 8,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color: isWarning ? "#1A1A1A" : "#fff",
        background: isWarning ? "#E8D9C0" : "#D94F4F",
        border: isWarning ? "1px solid #C9A96E" : "1px solid #D94F4F",
      }}
    >
      {isWarning ? "⚠️ Warning" : "🚫 Blacklisted"}
    </span>
  );
}

function CustomerCardInner({ customer }: CustomerCardProps) {
  const tag = getCustomerDisplayTag(customer);

  return (
    <article className="customer-card">
      <ReliabilityBadge reliability={customer.reliability} />
      <span className={tag.className}>{tag.label}</span>
      <p className="customer-name">{customer.name}</p>
      {customer.phone ? <p>{customer.phone}</p> : null}
      <strong>{formatRs(customer.total_spend)}</strong>
      <p>{getCustomerVisitLine(customer)}</p>
    </article>
  );
}

export const CustomerCard = memo(CustomerCardInner);
