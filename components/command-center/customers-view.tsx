"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerCard } from "@/components/command-center/customers/customer-card";
import { AddCustomerForm } from "@/components/command-center/customers/add-customer-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Toast } from "@/components/ui/toast";
import type { Customer } from "@/lib/customers/types";

type CustomersViewProps = {
  initialCustomers: Customer[];
  initialQuery?: string;
  error?: string;
  showAddedToast?: boolean;
};

function safeDecodeError(error: string): string {
  try {
    return decodeURIComponent(error);
  } catch {
    return error;
  }
}

export function CustomersView({
  initialCustomers,
  initialQuery = "",
  error,
  showAddedToast = false,
}: CustomersViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toastVisible, setToastVisible] = useState(showAddedToast);
  const [errorToast, setErrorToast] = useState<string | null>(
    error ? safeDecodeError(error) : null
  );

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!error) return;
    setErrorToast(safeDecodeError(error));
  }, [error]);

  useEffect(() => {
    if (!showAddedToast) return;
    setShowAddForm(false);
    setToastVisible(true);
    router.replace(
      initialQuery.trim()
        ? `/dashboard/customers?q=${encodeURIComponent(initialQuery.trim())}`
        : "/dashboard/customers",
      { scroll: false }
    );
    router.refresh();
  }, [showAddedToast, initialQuery, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = query.trim();
      if (trimmed === initialQuery.trim()) return;

      const params = new URLSearchParams();
      if (trimmed) params.set("q", trimmed);
      const qs = params.toString();
      router.replace(qs ? `/dashboard/customers?${qs}` : "/dashboard/customers", {
        scroll: false,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, initialQuery, router]);

  const handleCloseAdd = () => {
    setShowAddForm(false);
    router.refresh();
  };

  return (
    <>
      <div className="view-stack">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Customer CRM</p>
              <h2>Customer memory</h2>
            </div>
            <div className="topbar-actions">
              <input
                className="search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search customer"
                aria-label="Search customers"
              />
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowAddForm(true)}
              >
                Add customer
              </button>
            </div>
          </div>

          {error ? (
            <p className="text-body" role="alert" style={{ color: "var(--coral)" }}>
              {safeDecodeError(error)}
            </p>
          ) : null}

          {initialCustomers.length === 0 ? (
            <EmptyState
              icon="customers"
              title={
                initialQuery.trim()
                  ? "No customers match your search"
                  : "No customers yet"
              }
              description={
                initialQuery.trim()
                  ? "Try a different name or phone number."
                  : "Pehla customer add karein — 30 seconds mein."
              }
              actionLabel={initialQuery.trim() ? undefined : "Add customer"}
              onAction={
                initialQuery.trim() ? undefined : () => setShowAddForm(true)
              }
            />
          ) : (
            <div className="customer-grid stagger-list">
              {initialCustomers.map((customer) => (
                <CustomerCard key={customer.id} customer={customer} />
              ))}
            </div>
          )}
        </section>
      </div>

      {showAddForm ? <AddCustomerForm onClose={handleCloseAdd} /> : null}

      <Toast
        message="Customer added!"
        show={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
      <Toast
        message={errorToast ?? ""}
        show={errorToast !== null}
        variant="error"
        durationMs={5000}
        onDismiss={() => setErrorToast(null)}
      />
    </>
  );
}
