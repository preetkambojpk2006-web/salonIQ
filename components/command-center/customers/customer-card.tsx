"use client";

import { memo } from "react";
import {
  getCustomerDisplayTag,
  getCustomerVisitLine,
} from "@/lib/customers/display-tag";
import type { Customer } from "@/lib/customers/types";

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

type CustomerCardProps = {
  customer: Customer;
};

function CustomerCardInner({ customer }: CustomerCardProps) {
  const tag = getCustomerDisplayTag(customer);

  return (
    <article className="customer-card">
      <span className={tag.className}>{tag.label}</span>
      <p className="customer-name">{customer.name}</p>
      {customer.phone ? <p>{customer.phone}</p> : null}
      <strong>{formatRs(customer.total_spend)}</strong>
      <p>{getCustomerVisitLine(customer)}</p>
    </article>
  );
}

export const CustomerCard = memo(CustomerCardInner);
