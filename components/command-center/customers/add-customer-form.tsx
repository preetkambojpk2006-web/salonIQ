"use client";

import { useEffect, useRef } from "react";
import { createCustomer } from "@/lib/customers/actions";
import { useFormStatus } from "react-dom";

type AddCustomerFormProps = {
  onClose: () => void;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-dark flex-1" disabled={pending}>
      {pending ? "Saving…" : "Save customer"}
    </button>
  );
}

export function AddCustomerForm({ onClose }: AddCustomerFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="w-[min(100%,28rem)] max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-panel p-0 shadow-os backdrop:bg-ink/40"
      onClose={onClose}
    >
      <form action={createCustomer} className="p-5">
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
              Phone
            </label>
            <input
              id="customer-phone"
              name="phone"
              type="tel"
              className="input-field"
              placeholder="+91 98765 43210"
            />
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
          <SubmitButton />
        </div>
      </form>
    </dialog>
  );
}
