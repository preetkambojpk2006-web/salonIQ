import type { LiveFlowItem } from "@/lib/dashboard/today-queries";
import { formatTime12h } from "@/lib/format/time";

type OsHeroProps = {
  liveFlow: LiveFlowItem[];
};

export function OsHero({ liveFlow }: OsHeroProps) {
  const steps =
    liveFlow.length > 0
      ? liveFlow
      : [
          {
            id: "1",
            label: "Appointment completed",
            detail: "Sneha Sharma - Facial - Aarav",
          },
          {
            id: "2",
            label: "UPI payment received",
            detail: "Rs 1,200 via GPay, invoice queued",
          },
          {
            id: "3",
            label: "Dashboard updated",
            detail: "Revenue, staff score, monthly P&L",
          },
        ];

  return (
    <section className="os-hero">
      <div className="hero-copy">
        <p className="eyebrow">Live AI operating layer</p>
        <h2>Bookings, payments aur reports. Sab WhatsApp se auto.</h2>
        <p>
          Customer booking kare, reminder jaye, payment collect ho, invoice send ho,
          aur owner ko daily business report mil jaye.
        </p>
        <div className="hero-actions">
          <button type="button" className="primary-button">
            Simulate booking
          </button>
          <button type="button" className="ghost-inline">
            Run payment flow
          </button>
        </div>
      </div>

      <div className="flow-console" aria-label="Live salon operating flow">
        <div className="console-header">
          <span className="pulse-dot" aria-hidden />
          <strong>Live flow</strong>
          <small>{formatTime12h(new Date())}</small>
        </div>
        <div className="stagger-flow">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flow-row ${index < 2 ? "active" : ""}`}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{step.label}</strong>
                <p>{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
