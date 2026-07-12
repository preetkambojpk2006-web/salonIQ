"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAppointment } from "@/lib/appointments/actions";
import {
  generateDaySlots,
  slotIsoToFormTime,
  todayDateIso,
} from "@/lib/booking/slots";
import type { BookingHours } from "@/lib/booking/opening-hours";
import { parseInternalBookingHours } from "@/lib/booking/opening-hours";
import { getResolvedServicePrice } from "@/lib/staff/service-price-actions";
import type { SalonService, SalonStaff } from "@/lib/salon/types";
import { Toast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n/LanguageContext";

type NewBookingFormProps = {
  onClose: () => void;
  error?: string;
  services?: SalonService[];
  staffMembers?: SalonStaff[];
  bookingHours?: BookingHours;
};

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function NewBookingForm({
  onClose,
  error,
  services = [],
  staffMembers = [],
  bookingHours,
}: NewBookingFormProps) {
  const { t } = useT();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [submitError, setSubmitError] = useState<string | null>(
    error ? safeDecode(error) : null
  );
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const today = todayDateIso();
  const resolvedHours = bookingHours ?? parseInternalBookingHours(null);

  const activeServices = useMemo(
    () => services.filter((service) => service.is_active),
    [services]
  );
  const activeStaff = useMemo(
    () => staffMembers.filter((member) => member.is_active),
    [staffMembers]
  );

  const [selectedServiceId, setSelectedServiceId] = useState(
    activeServices[0]?.id ?? ""
  );
  const [selectedStaffId, setSelectedStaffId] = useState(
    activeStaff[0]?.id ?? ""
  );
  const [amountInput, setAmountInput] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);

  const timeSlots = useMemo(
    () => generateDaySlots(selectedDate, resolvedHours),
    [selectedDate, resolvedHours]
  );

  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    if (timeSlots.length === 0) {
      setSelectedTime("");
      return;
    }

    setSelectedTime((current) => {
      const currentStillValid = timeSlots.some(
        (slot) => slotIsoToFormTime(slot.iso) === current
      );
      return currentStillValid ? current : slotIsoToFormTime(timeSlots[0]!.iso);
    });
  }, [timeSlots]);

  const selectedService = activeServices.find(
    (service) => service.id === selectedServiceId
  );
  const selectedStaff = activeStaff.find(
    (member) => member.id === selectedStaffId
  );

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

  useEffect(() => {
    if (!selectedServiceId) {
      setAmountInput("");
      return;
    }

    let cancelled = false;

    void getResolvedServicePrice(
      selectedStaffId || null,
      selectedServiceId
    ).then((result) => {
      if (cancelled || !result.ok) return;
      setAmountInput(String(result.price));
    });

    return () => {
      cancelled = true;
    };
  }, [selectedServiceId, selectedStaffId]);

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
              <p className="text-eyebrow">{t("today.newBooking")}</p>
              <h3 className="heading-section mt-1">{t("booking.addTitle")}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-muted transition-colors duration-150 hover:bg-mint-soft hover:text-ink"
              aria-label={t("common.close")}
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
                {t("booking.customerName")} <span className="text-coral">*</span>
              </label>
              <input
                id="booking-customer"
                name="customer_name"
                required
                className="input-field"
                placeholder={t("booking.customerPlaceholder")}
              />
            </div>

            <div>
              <label htmlFor="booking-service" className="field-label">
                {t("booking.serviceLabel")} <span className="text-coral">*</span>
              </label>
              {activeServices.length > 0 ? (
                <>
                  <select
                    id="booking-service"
                    className="input-field"
                    value={selectedServiceId}
                    onChange={(event) => setSelectedServiceId(event.target.value)}
                    required
                  >
                    {activeServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="hidden"
                    name="service_name"
                    value={selectedService?.name ?? ""}
                  />
                </>
              ) : (
                <input
                  id="booking-service"
                  name="service_name"
                  required
                  className="input-field"
                  placeholder={t("booking.servicePlaceholder")}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="booking-date" className="field-label">
                  {t("booking.dateLabel")} <span className="text-coral">*</span>
                </label>
                <input
                  id="booking-date"
                  name="date"
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="booking-time" className="field-label">
                  {t("booking.timeLabel")} <span className="text-coral">*</span>
                </label>
                {timeSlots.length > 0 ? (
                  <select
                    id="booking-time"
                    name="time"
                    required
                    className="input-field"
                    value={selectedTime}
                    onChange={(event) => setSelectedTime(event.target.value)}
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot.iso} value={slotIsoToFormTime(slot.iso)}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-muted">{t("booking.noTimeSlots")}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="booking-staff" className="field-label">
                {t("booking.staffName")}
              </label>
              {activeStaff.length > 0 ? (
                <>
                  <select
                    id="booking-staff"
                    className="input-field"
                    value={selectedStaffId}
                    onChange={(event) => setSelectedStaffId(event.target.value)}
                  >
                    <option value="">{t("booking.staffOptional")}</option>
                    {activeStaff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="hidden"
                    name="staff_name"
                    value={selectedStaff?.name ?? ""}
                  />
                </>
              ) : (
                <input
                  id="booking-staff"
                  name="staff_name"
                  className="input-field"
                  placeholder={t("booking.staffPlaceholder")}
                />
              )}
            </div>

            <div>
              <label htmlFor="booking-amount" className="field-label">
                {t("booking.amountLabel")}
              </label>
              <input
                id="booking-amount"
                name="amount"
                type="number"
                min="0"
                step="1"
                className="input-field"
                placeholder={t("booking.amountPlaceholder")}
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="booking-notes" className="field-label">
                {t("booking.notesLabel")}{" "}
                <span className="font-normal text-muted">{t("booking.optional")}</span>
              </label>
              <textarea
                id="booking-notes"
                name="notes"
                rows={2}
                className="input-field"
                placeholder={t("booking.notesPlaceholder")}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost-os flex-1">
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn-dark flex-1" disabled={isPending || timeSlots.length === 0}>
              {isPending ? t("common.saving") : t("booking.saveBooking")}
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
