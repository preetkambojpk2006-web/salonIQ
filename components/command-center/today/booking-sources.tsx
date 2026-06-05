import { bookingSources } from "@/lib/command-center/mock-today";

const meterClass: Record<string, string> = {
  WhatsApp: "whatsapp",
  "Walk-ins": "walkin",
  Phone: "phone",
  Instagram: "instagram",
};

export function BookingSources() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Booking source</p>
          <h2>Where customers came from</h2>
        </div>
      </div>
      <div className="source-grid">
        {bookingSources.map((source) => (
          <div
            key={source.label}
            className={`source-meter ${meterClass[source.label] ?? ""}`}
          >
            <span style={{ height: `${source.pct}%` }} />
            <p>{source.label}</p>
            <strong>{source.pct}%</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
