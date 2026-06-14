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
