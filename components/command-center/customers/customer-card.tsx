"use client";

import { memo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCustomerDisplayTag,
  getCustomerVisitLine,
} from "@/lib/customers/display-tag";
import { updateCustomerNotes } from "@/lib/customers/actions";
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

function CustomerNotesEditor({
  customerId,
  initialNotes,
}: {
  customerId: string;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNotes(initialNotes ?? "");
  }, [initialNotes]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const result = await updateCustomerNotes(customerId, notes);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSaved(true);
    router.refresh();
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <label
        htmlFor={`customer-notes-${customerId}`}
        className="field-label"
        style={{ fontSize: 12, color: "#8A8A8A", fontWeight: 600 }}
      >
        Notes
      </label>
      <textarea
        id={`customer-notes-${customerId}`}
        className="textarea-field"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={3}
        placeholder="Prefers short hair, allergic to dye, likes chai…"
        style={{
          marginTop: 6,
          borderRadius: 10,
          borderColor: "#E0DAD0",
          color: "#1A1A1A",
          fontSize: 13,
        }}
      />
      {error ? (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#D94F4F" }}>
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{
          marginTop: 8,
          minHeight: 36,
          padding: "6px 14px",
          borderRadius: 10,
          border: "1px solid #1FA873",
          background: "#1FA873",
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
      </button>
    </div>
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
      <CustomerNotesEditor
        customerId={customer.id}
        initialNotes={customer.notes}
      />
    </article>
  );
}

export const CustomerCard = memo(CustomerCardInner);
