import type { UpcomingAppointment } from "@/lib/dashboard/today-queries";
import Link from "next/link";

type NextAppointmentsProps = {
  appointments: UpcomingAppointment[];
};

function statusTag(apt: UpcomingAppointment) {
  if (apt.payment_status === "paid") {
    return <span className="tag green">Paid via GPay</span>;
  }
  if (apt.status === "pending" || apt.payment_status === "unpaid") {
    return <span className="tag orange">Payment pending</span>;
  }
  return <span className="tag orange">Confirmed</span>;
}

export function NextAppointments({ appointments }: NextAppointmentsProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Live schedule</p>
          <h2>Next appointments</h2>
        </div>
        <Link
          href="/dashboard/calendar?booking=new"
          className="icon-button"
          title="Add appointment"
        >
          +
        </Link>
      </div>

      {appointments.length === 0 ? (
        <p className="text-body">Aage koi booking nahi. Calendar se nayi booking add karein.</p>
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
              {statusTag(apt)}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
