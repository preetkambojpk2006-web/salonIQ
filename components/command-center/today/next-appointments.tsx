"use client";

import { MessageCircle } from "lucide-react";
import type { UpcomingAppointment } from "@/lib/dashboard/today-queries";
import { useT } from "@/lib/i18n/LanguageContext";
import { openWhatsAppReminder } from "@/lib/whatsapp/sendLink";
import Link from "next/link";

type NextAppointmentsProps = {
  appointments: UpcomingAppointment[];
  salonName: string;
};

function statusLabel(
  apt: UpcomingAppointment,
  t: (key: string) => string
): string {
  if (apt.payment_status === "paid") {
    return t("common.paid");
  }
  if (apt.status === "pending") {
    return t("status.pending");
  }
  return t("status.confirmed");
}

export function NextAppointments({
  appointments,
  salonName,
}: NextAppointmentsProps) {
  const { t } = useT();

  const handleSendReminder = (apt: UpcomingAppointment) => {
    const message = t("whatsapp.appointmentReminder", {
      customerName: apt.customer,
      salonName,
      serviceName: apt.service,
      timeStr: apt.time,
    });
    openWhatsAppReminder(apt.customerPhone, message);
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{t("today.liveSchedule")}</p>
          <h2>{t("today.nextAppointments")}</h2>
          <p className="text-body" style={{ margin: "6px 0 0", fontSize: 13 }}>
            {t("today.upcomingRemindersHint")}
          </p>
        </div>
        <Link
          href="/dashboard/calendar?booking=new"
          className="demo-button"
          style={{ minHeight: 32, flexShrink: 0, textDecoration: "none" }}
        >
          {t("today.newBooking")}
        </Link>
      </div>

      {appointments.length === 0 ? (
        <p className="text-body">{t("today.noAppointments")}</p>
      ) : (
        <div className="appointment-list stagger-list">
          {appointments.map((apt) => (
            <article key={apt.id} className="appointment-row">
              <span className="appointment-time">{apt.time}</span>
              <div style={{ minWidth: 0 }}>
                <strong>{apt.customer}</strong>
                <p style={{ margin: "4px 0 0" }}>
                  {apt.service} · {apt.staff}
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#8A8A8A",
                  }}
                >
                  {statusLabel(apt, t)}
                </p>
              </div>
              <button
                type="button"
                className="primary-button"
                style={{
                  minHeight: 36,
                  minWidth: 36,
                  padding: "8px 12px",
                  borderRadius: 10,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  flexShrink: 0,
                }}
                onClick={() => handleSendReminder(apt)}
                aria-label={t("today.sendReminderAria", {
                  customer: apt.customer,
                  time: apt.time,
                })}
              >
                <MessageCircle size={16} strokeWidth={1.5} aria-hidden />
                {t("today.sendReminder")}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
