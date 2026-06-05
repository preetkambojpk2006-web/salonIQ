import { premiumStrip } from "@/lib/command-center/mock-today";

export function PremiumStrip() {
  return (
    <section className="premium-strip stagger-metrics">
      {premiumStrip.map((item) => (
        <article key={item.label}>
          <p className="eyebrow">{item.label}</p>
          <strong>{item.value}</strong>
          <span>{item.hint}</span>
        </article>
      ))}
    </section>
  );
}
