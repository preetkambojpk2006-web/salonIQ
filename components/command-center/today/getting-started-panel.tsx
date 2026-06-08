import Link from "next/link";

const tips = [
  {
    title: "Pehli booking add karein",
    body: "Calendar se nayi appointment banao — cash/UPI payment ke baad revenue auto track hogi.",
    href: "/dashboard/calendar?booking=new",
    cta: "Calendar kholo",
  },
  {
    title: "Customers save karein",
    body: "Regular clients ka record rakho — visit history aur notes baad mein kaam aayenge.",
    href: "/dashboard/customers",
    cta: "Customers dekho",
  },
  {
    title: "Salon details update karo",
    body: "Naam, phone, aur opening hours Settings mein kabhi bhi edit kar sakte ho.",
    href: "/dashboard/settings",
    cta: "Settings",
  },
];

export function GettingStartedPanel() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Shuruat</p>
          <h2>Aaj kya karein</h2>
        </div>
      </div>
      <div className="insight-stack stagger-list">
        {tips.map((tip) => (
          <article key={tip.title} className="insight-card">
            <p>
              <strong>{tip.title}</strong>
            </p>
            <p>{tip.body}</p>
            <Link
              href={tip.href}
              style={{
                display: "inline-block",
                marginTop: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "#1FA873",
                textDecoration: "none",
              }}
            >
              {tip.cta} →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
