"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createCustomer } from "@/lib/customers/actions";
import {
  isValidIndianPhone,
  normalizeIndianPhone,
} from "@/lib/customers/validatePhone";

type AddCustomerFormProps = {
  onClose: () => void;
};

const PHONE_ERROR = "Sahi 10-digit mobile number daalein";

export function AddCustomerForm({ onClose }: AddCustomerFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const phoneRaw = (formData.get("phone") as string)?.trim() ?? "";

    if (!phoneRaw || !isValidIndianPhone(phoneRaw)) {
      setPhoneError(PHONE_ERROR);
      return;
    }

    setPhoneError(null);
    formData.set("phone", normalizeIndianPhone(phoneRaw));

    startTransition(() => {
      createCustomer(formData);
    });
  };

  return (
    <dialog
      ref={dialogRef}
      className="w-[min(100%,28rem)] max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-panel p-0 shadow-os backdrop:bg-ink/40"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-eyebrow">New customer</p>
            <h3 className="heading-section mt-1">Add customer</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-muted transition-colors duration-150 hover:bg-mint-soft hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 stack-4">
          <div>
            <label htmlFor="customer-name" className="field-label">
              Name <span className="text-coral">*</span>
            </label>
            <input
              id="customer-name"
              name="name"
              required
              className="input-field"
              placeholder="e.g. Sneha Sharma"
            />
          </div>

          <div>
            <label htmlFor="customer-phone" className="field-label">
              Phone <span className="text-coral">*</span>
            </label>
            <input
              id="customer-phone"
              name="phone"
              type="tel"
              required
              inputMode="numeric"
              autoComplete="tel"
              className="input-field"
              placeholder="98765 43210"
              aria-invalid={phoneError !== null}
              aria-describedby={phoneError ? "customer-phone-error" : undefined}
              onChange={() => {
                if (phoneError) setPhoneError(null);
              }}
            />
            {phoneError ? (
              <p id="customer-phone-error" className="alert-danger mt-2" role="alert">
                {phoneError}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="customer-gender" className="field-label">
              Gender <span className="font-normal text-muted">(optional)</span>
            </label>
            <select id="customer-gender" name="gender" className="select-field">
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="customer-notes" className="field-label">
              Notes <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="customer-notes"
              name="notes"
              rows={3}
              className="input-field"
              placeholder="Preferences, allergies, favourite services…"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onClose} className="btn-ghost-os flex-1">
            Cancel
          </button>
          <button type="submit" className="btn-dark flex-1" disabled={isPending}>
            {isPending ? "Saving…" : "Save customer"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
