"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { publicBookingErrorMessage } from "@/lib/booking/errors";
import {
  formatBookingHoursLabel,
  parseOpeningHoursForBooking,
} from "@/lib/booking/opening-hours";
import {
  generateDaySlots,
  isSlotAvailable,
  maxBookingDateIso,
  todayDateIso,
} from "@/lib/booking/slots";
import type {
  PublicBookingContext,
  PublicBookingGate,
  PublicBookingService,
  PublicBookingStaff,
  PublicStaffServicePrice,
} from "@/lib/booking/types";
import { resolvePublicServicePrice } from "@/lib/staff/service-price";
import { createClient } from "@/lib/supabase/client";

const TOKENS = {
  bgMain: "#EDE8DF",
  textDark: "#1A1A1A",
  textMuted: "#8A8A8A",
  borderSubtle: "#E0DAD0",
  accentGreen: "#1FA873",
  accentGreenSoft: "#D4E8DD",
  accentBeige: "#E8D9C0",
};

type PublicBookingPageProps = {
  slug: string;
};

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function PublicBookingPage({ slug }: PublicBookingPageProps) {
  const [gate, setGate] = useState<PublicBookingGate | null>(null);
  const [context, setContext] = useState<PublicBookingContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedService, setSelectedService] = useState<PublicBookingService | null>(
    null
  );
  const [selectedStaff, setSelectedStaff] = useState<PublicBookingStaff | null>(null);
  const [availableStaff, setAvailableStaff] = useState<PublicBookingStaff[]>([]);
  const [date, setDate] = useState(todayDateIso());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [busyStarts, setBusyStarts] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadGate() {
      setLoading(true);
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc(
        "get_public_booking_gate",
        { p_slug: slug }
      );

      if (cancelled) return;

      if (rpcError || !data) {
        setNotFound(true);
        setGate(null);
        setContext(null);
        setLoading(false);
        return;
      }

      const parsed = data as PublicBookingGate;
      setGate({
        salon_name: parsed.salon_name,
        branch_name: parsed.branch_name ?? "",
        phone: parsed.phone ?? "",
        online_booking_enabled: parsed.online_booking_enabled !== false,
      });
      setNotFound(false);

      if (parsed.online_booking_enabled === false) {
        setContext(null);
        setLoading(false);
        return;
      }

      const { data: contextData, error: contextError } = await supabase.rpc(
        "get_public_booking_context",
        { p_slug: slug }
      );

      if (cancelled) return;

      if (contextError || !contextData) {
        setNotFound(true);
        setContext(null);
        setLoading(false);
        return;
      }

      const raw = contextData as PublicBookingContext;
      const bookingContext: PublicBookingContext = {
        ...raw,
        services: Array.isArray(raw.services) ? raw.services : [],
        staff: Array.isArray(raw.staff) ? raw.staff : [],
        staff_service_prices: Array.isArray(raw.staff_service_prices)
          ? raw.staff_service_prices
          : [],
        opening_hours:
          raw.opening_hours && typeof raw.opening_hours === "object"
            ? (raw.opening_hours as Record<string, unknown>)
            : null,
      };
      setContext(bookingContext);
      setSelectedService(bookingContext.services[0] ?? null);
      setLoading(false);
    }

    void loadGate();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const priceOverrides = useMemo(
    () => (context?.staff_service_prices ?? []) as PublicStaffServicePrice[],
    [context?.staff_service_prices]
  );

  const displayPriceForService = useCallback(
    (service: PublicBookingService) =>
      resolvePublicServicePrice({
        serviceName: service.name,
        defaultPrice: Number(service.price),
        staffName: selectedStaff?.name,
        overrides: priceOverrides,
      }),
    [priceOverrides, selectedStaff?.name]
  );

  useEffect(() => {
    if (!context || !date) return;

    let cancelled = false;

    async function loadStaffForDate() {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc(
        "get_public_booking_staff",
        { p_slug: slug, p_date: date }
      );

      if (cancelled) return;

      if (rpcError || data === null) {
        setAvailableStaff([]);
        setSelectedStaff(null);
        return;
      }

      const staff = Array.isArray(data) ? (data as PublicBookingStaff[]) : [];
      setAvailableStaff(staff);
      setSelectedStaff((current) => {
        if (current && staff.some((member) => member.name === current.name)) {
          return current;
        }
        return staff[0] ?? null;
      });
    }

    void loadStaffForDate();
    return () => {
      cancelled = true;
    };
  }, [slug, date, context]);

  useEffect(() => {
    if (!selectedStaff || !date) {
      setBusyStarts([]);
      return;
    }

    let cancelled = false;

    async function loadBusy() {
      setLoadingSlots(true);
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc(
        "get_public_busy_slots",
        {
          p_slug: slug,
          p_staff_name: selectedStaff!.name,
          p_date: date,
        }
      );

      if (cancelled) return;

      if (rpcError || !data) {
        setBusyStarts([]);
        setError("Could not load available slots. Please try again.");
      } else {
        setBusyStarts((data as string[]) ?? []);
        setError(null);
      }
      setSelectedSlot(null);
      setLoadingSlots(false);
    }

    void loadBusy();
    return () => {
      cancelled = true;
    };
  }, [slug, selectedStaff, date]);

  const bookingHours = useMemo(
    () =>
      parseOpeningHoursForBooking(
        context?.opening_hours ?? {
          display: context?.opening_hours_display ?? "",
        }
      ),
    [context?.opening_hours, context?.opening_hours_display]
  );

  const availableSlots = useMemo(() => {
    if (!selectedService) return [];
    return generateDaySlots(date, bookingHours).filter((slot) =>
      isSlotAvailable({
        slotIso: slot.iso,
        durationMins: selectedService.duration_mins,
        busyStarts,
        closeHour: bookingHours.closeHour,
      })
    );
  }, [date, selectedService, busyStarts, bookingHours]);

  const handleSubmit = useCallback(async () => {
    if (!selectedService || !selectedStaff || !selectedSlot) {
      setError("Service, staff aur time slot choose karein.");
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Naam aur phone number daalein.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("create_public_booking", {
      p_slug: slug,
      p_customer_name: customerName.trim(),
      p_customer_phone: customerPhone.trim(),
      p_staff_name: selectedStaff.name,
      p_service_name: selectedService.name,
      p_start_time: selectedSlot,
    });

    setSubmitting(false);

    if (rpcError) {
      setError(publicBookingErrorMessage(rpcError));
      return;
    }

    setSuccess(true);
  }, [
    customerName,
    customerPhone,
    selectedService,
    selectedStaff,
    selectedSlot,
    slug,
  ]);

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
        <p style={{ color: TOKENS.textMuted, fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  if (notFound || !gate) {
    return (
      <div style={{ padding: 24, maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: TOKENS.textDark }}>
          Salon nahi mila
        </h1>
        <p style={{ color: TOKENS.textMuted, marginTop: 8 }}>
          Booking link check karein ya salon se sahi link maangein.
        </p>
      </div>
    );
  }

  if (!gate.online_booking_enabled) {
    return (
      <BookingClosedView gate={gate} />
    );
  }

  if (!context) {
    return (
      <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
        <p style={{ color: TOKENS.textMuted, fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  if (success) {
    return (
      <div
        style={{
          padding: 24,
          maxWidth: 480,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <section
          style={{
            borderRadius: 16,
            border: `1px solid ${TOKENS.accentGreen}`,
            background: TOKENS.accentGreenSoft,
            padding: 24,
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 800, color: TOKENS.textDark, margin: 0 }}>
            Request bhej di! ✅
          </h1>
          <p style={{ color: TOKENS.textMuted, marginTop: 12, lineHeight: 1.5 }}>
            {context.salon_name} aapki booking confirm karega. WhatsApp ya call par
            update mil sakta hai.
          </p>
        </section>
      </div>
    );
  }

  const setupIncomplete =
    context.services.length === 0 || context.staff.length === 0;
  const bookableStaff = availableStaff;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: TOKENS.bgMain,
        padding: "20px 16px 40px",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto", display: "grid", gap: 16 }}>
        <header>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              color: TOKENS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Online booking
          </p>
          <h1
            style={{
              margin: "6px 0 0",
              fontSize: 26,
              fontWeight: 800,
              color: TOKENS.textDark,
            }}
          >
            {context.salon_name}
          </h1>
          {context.opening_hours_display ? (
            <p style={{ margin: "8px 0 0", fontSize: 14, color: TOKENS.textMuted }}>
              {context.opening_hours_display} · {formatBookingHoursLabel(bookingHours)}
            </p>
          ) : (
            <p style={{ margin: "8px 0 0", fontSize: 14, color: TOKENS.textMuted }}>
              {formatBookingHoursLabel(bookingHours)}
            </p>
          )}
        </header>

        {setupIncomplete ? (
          <section
            style={{
              borderRadius: 16,
              border: `1px solid ${TOKENS.borderSubtle}`,
              background: "#fff",
              padding: 18,
            }}
          >
            <p style={{ margin: 0, fontSize: 14, color: TOKENS.textDark, lineHeight: 1.5 }}>
              Online booking abhi setup ho rahi hai. Salon se seedha contact karein.
            </p>
          </section>
        ) : (
          <>
            <Section title="1. Service choose karein">
              <div style={{ display: "grid", gap: 8 }}>
                {context.services.map((service) => {
                  const active = selectedService?.name === service.name;
                  return (
                    <button
                      key={service.name}
                      type="button"
                      onClick={() => setSelectedService(service)}
                      style={{
                        textAlign: "left",
                        borderRadius: 16,
                        border: `1px solid ${active ? TOKENS.accentGreen : TOKENS.borderSubtle}`,
                        background: active ? TOKENS.accentGreenSoft : "#fff",
                        padding: "12px 14px",
                        cursor: "pointer",
                      }}
                    >
                      <strong style={{ color: TOKENS.textDark, fontSize: 15 }}>
                        {service.name}
                      </strong>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: TOKENS.textMuted }}>
                        {service.duration_mins} min ·{" "}
                        {formatInr(displayPriceForService(service))}
                      </p>
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="2. Staff choose karein">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {bookableStaff.map((member) => {
                  const active = selectedStaff?.name === member.name;
                  return (
                    <button
                      key={member.name}
                      type="button"
                      onClick={() => setSelectedStaff(member)}
                      style={{
                        borderRadius: 999,
                        border: `1px solid ${active ? TOKENS.accentGreen : TOKENS.borderSubtle}`,
                        background: active ? TOKENS.accentGreen : "#fff",
                        color: active ? "#fff" : TOKENS.textDark,
                        padding: "8px 14px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {member.name}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="3. Date aur time">
              <input
                type="date"
                value={date}
                min={todayDateIso()}
                max={maxBookingDateIso()}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 44,
                  borderRadius: 10,
                  border: `1px solid ${TOKENS.borderSubtle}`,
                  padding: "0 12px",
                  fontSize: 15,
                  color: TOKENS.textDark,
                  background: "#fff",
                }}
              />
              <p style={{ margin: "10px 0 8px", fontSize: 13, color: TOKENS.textMuted }}>
                Available slots
              </p>
              {loadingSlots ? (
                <p style={{ fontSize: 13, color: TOKENS.textMuted }}>Slots load ho rahe hain…</p>
              ) : availableSlots.length === 0 ? (
                <p style={{ fontSize: 13, color: TOKENS.textMuted }}>
                  Is din koi slot available nahi. Doosri date try karein.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 8,
                  }}
                >
                  {availableSlots.map((slot) => {
                    const active = selectedSlot === slot.iso;
                    return (
                      <button
                        key={slot.iso}
                        type="button"
                        onClick={() => setSelectedSlot(slot.iso)}
                        style={{
                          minHeight: 40,
                          borderRadius: 10,
                          border: `1px solid ${active ? TOKENS.accentGreen : TOKENS.borderSubtle}`,
                          background: active ? TOKENS.accentGreenSoft : "#fff",
                          color: TOKENS.textDark,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </Section>

            <Section title="4. Aapka detail">
              <div style={{ display: "grid", gap: 10 }}>
                <input
                  type="text"
                  placeholder="Apna naam"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </Section>

            {error ? (
              <p style={{ margin: 0, fontSize: 13, color: "#D94F4F" }} role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              disabled={submitting || !selectedSlot}
              onClick={handleSubmit}
              style={{
                width: "100%",
                minHeight: 48,
                borderRadius: 10,
                border: 0,
                background: TOKENS.accentGreen,
                color: "#fff",
                fontSize: 16,
                fontWeight: 800,
                cursor: submitting ? "wait" : "pointer",
                opacity: submitting || !selectedSlot ? 0.7 : 1,
              }}
            >
              {submitting ? "Booking bhej rahe hain…" : "Booking request bhejein"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  borderRadius: 10,
  border: `1px solid ${TOKENS.borderSubtle}`,
  padding: "0 12px",
  fontSize: 15,
  color: TOKENS.textDark,
  background: "#fff",
};

function BookingClosedView({ gate }: { gate: PublicBookingGate }) {
  const phone = gate.phone?.trim();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: TOKENS.bgMain,
        padding: "20px 16px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 480,
          borderRadius: 16,
          border: `1px solid ${TOKENS.borderSubtle}`,
          background: "#F9F8F3",
          padding: 28,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 800,
            color: TOKENS.textDark,
          }}
        >
          {gate.salon_name}
        </h1>
        {gate.branch_name ? (
          <p style={{ margin: "8px 0 0", fontSize: 15, color: TOKENS.textMuted }}>
            {gate.branch_name}
          </p>
        ) : null}

        <p
          style={{
            margin: "20px 0 0",
            fontSize: 17,
            fontWeight: 700,
            color: TOKENS.textDark,
            lineHeight: 1.45,
          }}
        >
          Online booking is currently closed.
        </p>
        <p style={{ margin: "10px 0 0", fontSize: 14, color: TOKENS.textMuted }}>
          Please call us to book your appointment.
        </p>

        {phone ? (
          <a
            href={`tel:${phone.replace(/\s+/g, "")}`}
            style={{
              display: "inline-block",
              marginTop: 20,
              fontSize: 22,
              fontWeight: 800,
              color: TOKENS.accentGreen,
              textDecoration: "none",
            }}
          >
            {phone}
          </a>
        ) : null}
      </section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        borderRadius: 16,
        border: `1px solid ${TOKENS.borderSubtle}`,
        background: "#fff",
        padding: 16,
      }}
    >
      <h2
        style={{
          margin: "0 0 12px",
          fontSize: 15,
          fontWeight: 800,
          color: TOKENS.textDark,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
