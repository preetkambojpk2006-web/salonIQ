"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAppointment } from "@/lib/appointments/actions";
import { Toast } from "@/components/ui/toast";

type NewBookingFormProps = {
  onClose: () => void;
  error?: string;
};

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function NewBookingForm({ onClose, error }: NewBookingFormProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [submitError, setSubmitError] = useState<string | null>(
    error ? safeDecode(error) : null
  );
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    if (!error) return;
    const decoded = safeDecode(error);
    setSubmitError(decoded);
    setErrorToast(decoded);
  }, [error]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setErrorToast(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await createAppointment(formData);

      if (!result.ok) {
        setSubmitError(result.error);
        setErrorToast(result.error);
        return;
      }

      form.reset();
      dialogRef.current?.close();
      onClose();
      router.push(
        `/dashboard/calendar?added=1&appointment_id=${result.appointmentId}`
      );
      router.refresh();
    });
  };

  return (
    <>
      <dialog
        ref={dialogRef}
        className="w-[min(100%,28rem)] max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-panel p-0 text-ink shadow-os backdrop:bg-ink/40"
        onClose={onClose}
      >
        <form onSubmit={handleSubmit} className="bg-panel p-5 text-ink">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-eyebrow">New booking</p>
              <h3 className="heading-section mt-1">Add appointment</h3>
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

          {submitError ? (
            <p className="alert-danger mt-4" role="alert">
              {submitError}
            </p>
          ) : null}

          <div className="mt-6 stack-4">
            <div>
              <label htmlFor="booking-customer" className="field-label">
                Customer name <span className="text-coral">*</span>
              </label>
              <input
                id="booking-customer"
                name="customer_name"
                required
                className="input-field"
                placeholder="e.g. Sneha Sharma"
              />
            </div>

            <div>
              <label htmlFor="booking-service" className="field-label">
                Service <span className="text-coral">*</span>
              </label>
              <input
                id="booking-service"
                name="service_name"
                required
                className="input-field"
                placeholder="e.g. Hair cut, Facial"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="booking-date" className="field-label">
                  Date <span className="text-coral">*</span>
                </label>
                <input
                  id="booking-date"
                  name="date"
                  type="date"
                  required
                  defaultValue={today}
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="booking-time" className="field-label">
                  Time <span className="text-coral">*</span>
                </label>
                <input
                  id="booking-time"
                  name="time"
                  type="time"
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label htmlFor="booking-staff" className="field-label">
                Staff name
              </label>
              <input
                id="booking-staff"
                name="staff_name"
                className="input-field"
                placeholder="e.g. Anita"
              />
            </div>

            <div>
              <label htmlFor="booking-amount" className="field-label">
                Amount (Rs)
              </label>
              <input
                id="booking-amount"
                name="amount"
                type="number"
                min="0"
                step="1"
                className="input-field"
                placeholder="e.g. 1200"
              />
            </div>

            <div>
              <label htmlFor="booking-notes" className="field-label">
                Notes <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea
                id="booking-notes"
                name="notes"
                rows={2}
                className="input-field"
                placeholder="Any special requests"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost-os flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-dark flex-1" disabled={isPending}>
              {isPending ? "Saving…" : "Save booking"}
            </button>
          </div>
        </form>
      </dialog>

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
