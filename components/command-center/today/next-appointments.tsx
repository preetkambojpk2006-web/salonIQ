"use client";

import type { UpcomingAppointment } from "@/lib/dashboard/today-queries";
import { useT } from "@/lib/i18n/LanguageContext";
import Link from "next/link";

type NextAppointmentsProps = {
  appointments: UpcomingAppointment[];
};

function StatusTag({ apt }: { apt: UpcomingAppointment }) {
  const { t } = useT();

  if (apt.payment_status === "paid") {
    return <span className="tag green">{t("today.paidViaGpay")}</span>;
  }
  if (apt.status === "pending" || apt.payment_status === "unpaid") {
    return <span className="tag orange">{t("status.pending")}</span>;
  }
  return <span className="tag orange">{t("status.confirmed")}</span>;
}

export function NextAppointments({ appointments }: NextAppointmentsProps) {
  const { t } = useT();

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{t("today.liveSchedule")}</p>
          <h2>{t("today.nextAppointments")}</h2>
        </div>
        <Link
          href="/dashboard/calendar?booking=new"
          title={t("today.newBooking")}
          aria-label={t("today.newBooking")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: 38,
            minWidth: 38,
            minHeight: 38,
            flexShrink: 0,
            borderRadius: 999,
            background: "#1FA873",
            color: "#fff",
            fontSize: 22,
            fontWeight: 700,
            lineHeight: 1,
            textDecoration: "none",
            border: 0,
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.06)",
          }}
        >
          +
        </Link>
      </div>

      {appointments.length === 0 ? (
        <p className="text-body">{t("today.noAppointments")}</p>
      ) : (
        <div className="appointment-list stagger-list">
          {appointments.map((apt) => (
            <article key={apt.id} className="appointment-row">
              <span className="appointment-time">{apt.time}</span>
              <div>
                <strong>{apt.customer}</strong>
                <p>
                  {apt.service} · {apt.staff}
                </p>
              </div>
              <StatusTag apt={apt} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
