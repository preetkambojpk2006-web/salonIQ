"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import {
  CalendarCheck,
  CalendarDays,
  Check,
  FileText,
  MessageCircle,
  Package,
  Store,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Set Up Your Salon",
    description:
      "Add your services, staff, branches and business details in minutes.",
    icon: Store,
  },
  {
    step: "02",
    title: "Manage Your Business",
    description:
      "Handle bookings, customers, billing and daily operations from one dashboard.",
    icon: UserRound,
  },
  {
    step: "03",
    title: "Automate Customer Communication",
    description:
      "Send booking confirmations, reminders and updates without manual follow-ups.",
    icon: CalendarCheck,
  },
  {
    step: "04",
    title: "Grow With Better Insights",
    description:
      "Track revenue, services, staff performance and customer trends in real time.",
    icon: Wallet,
  },
];

const FEATURES = [
  {
    title: "Smart Calendar",
    description:
      "Manage day, week and month views with intelligent scheduling and no double bookings.",
    icon: CalendarDays,
  },
  {
    title: "WhatsApp Ready",
    description:
      "Send reminders, receipts, updates and customer messages directly through WhatsApp.",
    icon: MessageCircle,
  },
  {
    title: "Staff & Commission",
    description:
      "Automatically calculate staff commissions and simplify monthly payouts.",
    icon: Users,
  },
  {
    title: "GST Billing",
    description:
      "Create professional GST invoices with CGST and SGST. Print or download as PDF.",
    icon: FileText,
  },
  {
    title: "Business Analytics",
    description:
      "Understand revenue trends, peak hours, top services and business performance at a glance.",
    icon: TrendingUp,
  },
  {
    title: "Inventory Tracking",
    description:
      "Track stock levels, automatically deduct inventory after services and receive low-stock alerts.",
    icon: Package,
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "1,499",
    branches: "1–2 branches",
    highlight: false,
    features: [
      "Smart calendar and bookings",
      "WhatsApp reminders",
      "Staff attendance",
      "GST invoices",
    ],
  },
  {
    name: "Growth",
    price: "1,999",
    branches: "3–4 branches",
    highlight: true,
    features: [
      "Everything in Starter",
      "Commission and payouts",
      "Inventory tracking",
      "Business analytics",
    ],
  },
  {
    name: "Scale",
    price: "2,499",
    branches: "5+ branches",
    highlight: false,
    features: [
      "Everything in Growth",
      "Multi-branch control",
      "Priority onboarding",
      "Advanced reporting",
    ],
  },
];

function Reveal({
  className,
  children,
  delayMs = 0,
}: {
  className: string;
  children: ReactNode;
  delayMs?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            window.setTimeout(() => {
              entry.target.classList.add("is-visible");
            }, delayMs);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [delayMs]);

  return (
    <article
      ref={ref}
      className={className}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </article>
  );
}

function DashboardMockup() {
  const hours = ["10", "11", "12", "1", "2", "3"];
  const cells = [
    { staff: "Priya", slots: [true, true, false, true, false, false] },
    { staff: "Ankit", slots: [false, true, true, false, true, false] },
    { staff: "Meera", slots: [true, false, false, true, true, false] },
  ];

  return (
    <div
      className="landing-mock"
      style={{
        maxWidth: 820,
        margin: "0 auto",
        width: "100%",
        borderRadius: 16,
        border: "1px solid #E0DAD0",
        background: "#F9F8F3",
        boxShadow: "0 18px 40px rgba(26, 26, 26, 0.08)",
        overflow: "hidden",
        textAlign: "left",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background: "#EDE8DF",
          borderBottom: "1px solid #E0DAD0",
        }}
      >
        <span style={dotStyle("#D94F4F")} />
        <span style={dotStyle("#C9A96E")} />
        <span style={dotStyle("#1FA873")} />
        <span
          style={{
            marginLeft: 8,
            flex: 1,
            minHeight: 22,
            borderRadius: 8,
            background: "#fff",
            border: "1px solid #E0DAD0",
            fontSize: 11,
            color: "#8A8A8A",
            display: "flex",
            alignItems: "center",
            padding: "0 10px",
          }}
        >
          app.saloniq.in/dashboard
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "#1FA873",
          color: "#fff",
        }}
      >
        <strong style={{ fontSize: 13, letterSpacing: "0.04em" }}>SalonIQ OS</strong>
        <span style={{ fontSize: 12, opacity: 0.9 }}>Today</span>
      </div>

      <div style={{ padding: 16, display: "grid", gap: 14 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 10,
          }}
          className="landing-mock-stats"
        >
          <MockStat label="Today's Revenue" value="₹4,200" />
          <MockStat label="Bookings" value="8" />
          <MockStat label="Staff" value="3" />
        </div>

        <div
          style={{
            borderRadius: 12,
            border: "1px solid #E0DAD0",
            background: "#fff",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "72px repeat(6, minmax(0, 1fr))",
              borderBottom: "1px solid #E0DAD0",
              background: "#F9F8F3",
            }}
          >
            <span style={gridHeadCell} />
            {hours.map((hour) => (
              <span key={hour} style={gridHeadCell}>
                {hour}
              </span>
            ))}
          </div>
          {cells.map((row) => (
            <div
              key={row.staff}
              style={{
                display: "grid",
                gridTemplateColumns: "72px repeat(6, minmax(0, 1fr))",
                borderBottom: "1px solid #E0DAD0",
              }}
            >
              <span
                style={{
                  padding: "10px 8px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#1A1A1A",
                }}
              >
                {row.staff}
              </span>
              {row.slots.map((booked, index) => (
                <span
                  key={`${row.staff}-${index}`}
                  style={{
                    margin: 6,
                    minHeight: 22,
                    borderRadius: 6,
                    background: booked ? "#D4E8DD" : "#F9F8F3",
                    border: booked ? "1px solid #1FA873" : "1px solid #E0DAD0",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "12px 10px",
        borderRadius: 12,
        border: "1px solid #E0DAD0",
        background: "#fff",
      }}
    >
      <p style={{ margin: 0, fontSize: 11, color: "#8A8A8A", fontWeight: 700 }}>
        {label}
      </p>
      <p style={{ margin: "6px 0 0", fontSize: 18, fontWeight: 800, color: "#1A1A1A" }}>
        {value}
      </p>
    </div>
  );
}

const gridHeadCell: React.CSSProperties = {
  padding: "8px 4px",
  fontSize: 11,
  fontWeight: 700,
  color: "#8A8A8A",
  textAlign: "center",
};

function dotStyle(color: string): React.CSSProperties {
  return {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: color,
    display: "inline-block",
  };
}

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#1A1A1A",
              textDecoration: "none",
              letterSpacing: "-0.02em",
            }}
          >
            SalonIQ OS
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/login" className="landing-btn-outline">
              Sign In
            </Link>
            <Link href="/get-started" className="landing-btn-green">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section style={{ position: "relative", overflow: "hidden" }}>
          <div className="landing-hero-wash" aria-hidden />
          <div
            style={{
              position: "relative",
              maxWidth: 1080,
              margin: "0 auto",
              padding: "72px 20px 80px",
              display: "grid",
              gap: 32,
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#8A8A8A",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                SalonIQ OS
              </p>
              <h1
                style={{
                  margin: "16px 0 0",
                  fontSize: "clamp(36px, 7.5vw, 64px)",
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: "-0.035em",
                  color: "#1A1A1A",
                }}
              >
                Your salon, on autopilot
              </h1>
              <p
                style={{
                  margin: "18px auto 0",
                  maxWidth: 580,
                  fontSize: 17,
                  lineHeight: 1.65,
                  color: "#8A8A8A",
                }}
              >
                Manage bookings, customers, staff, billing and business
                performance — all from one powerful platform.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                justifyContent: "center",
              }}
            >
              <Link href="/get-started" className="landing-btn-green large">
                Get Started
              </Link>
              <a href="#how-it-works" className="landing-btn-ghost">
                See How It Works
              </a>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {[
                "7-day free trial",
                "No credit card required",
                "Setup in 10 minutes",
              ].map(
                (badge) => (
                  <span
                    key={badge}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: 32,
                      padding: "0 12px",
                      borderRadius: 999,
                      border: "1px solid #E0DAD0",
                      background: "rgba(249, 248, 243, 0.8)",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#1A1A1A",
                    }}
                  >
                    {badge}
                  </span>
                )
              )}
            </div>

            <div className="landing-mock-wrap">
              <DashboardMockup />
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: "32px 20px 80px",
          }}
        >
          <div style={{ marginBottom: 36, textAlign: "center" }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                color: "#8A8A8A",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              How It Works
            </p>
            <h2
              style={{
                margin: "10px 0 0",
                fontSize: "clamp(24px, 4vw, 34px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
              }}
            >
              From setup to daily operations
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {HOW_IT_WORKS.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal
                  key={item.step}
                  className="landing-step-card"
                  delayMs={index * 80}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 36,
                        height: 28,
                        borderRadius: 8,
                        background: "#D4E8DD",
                        color: "#1A1A1A",
                        fontSize: 12,
                        letterSpacing: "0.04em",
                        fontWeight: 800,
                      }}
                    >
                      {item.step}
                    </span>
                    <Icon size={16} strokeWidth={1.5} color="#1A1A1A" aria-hidden />
                  </div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                    {item.title}
                  </h3>
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: "#8A8A8A",
                    }}
                  >
                    {item.description}
                  </p>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section
          id="features"
          style={{
            background: "#F9F8F3",
            borderTop: "1px solid #E0DAD0",
            borderBottom: "1px solid #E0DAD0",
          }}
        >
          <div
            style={{
              maxWidth: 1080,
              margin: "0 auto",
              padding: "80px 20px",
            }}
          >
            <div style={{ marginBottom: 36, textAlign: "center" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#8A8A8A",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Features
              </p>
              <h2
                style={{
                  margin: "10px 0 0",
                  fontSize: "clamp(24px, 4vw, 34px)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                }}
              >
                Everything your salon needs
              </h2>
            </div>
            <div className="landing-feature-grid">
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Reveal
                    key={feature.title}
                    className="landing-feature-card"
                    delayMs={index * 70}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        background: "#D4E8DD",
                        color: "#1FA873",
                        marginBottom: 12,
                      }}
                    >
                      <Icon size={16} strokeWidth={1.5} aria-hidden />
                    </div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                      {feature.title}
                    </h3>
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: 14,
                        lineHeight: 1.5,
                        color: "#8A8A8A",
                      }}
                    >
                      {feature.description}
                    </p>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="pricing"
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: "80px 20px",
          }}
        >
          <div style={{ marginBottom: 36, textAlign: "center" }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                color: "#8A8A8A",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Pricing
            </p>
            <h2
              style={{
                margin: "10px 0 0",
                fontSize: "clamp(24px, 4vw, 34px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
              }}
            >
              Simple monthly plans
            </h2>
            <p
              style={{
                margin: "12px auto 0",
                maxWidth: 480,
                fontSize: 15,
                lineHeight: 1.6,
                color: "#8A8A8A",
              }}
            >
              Start with a 7-day free trial. No credit card required.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
              alignItems: "stretch",
            }}
          >
            {PRICING.map((tier, index) => (
              <Reveal
                key={tier.name}
                className={
                  tier.highlight
                    ? "landing-price-card featured"
                    : "landing-price-card"
                }
                delayMs={index * 80}
              >
                {tier.highlight ? (
                  <p
                    style={{
                      margin: "0 0 12px",
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: 26,
                      padding: "0 10px",
                      borderRadius: 999,
                      background: "#D4E8DD",
                      color: "#1A1A1A",
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    Most Popular
                  </p>
                ) : null}
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#8A8A8A",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {tier.name}
                </p>
                <p style={{ margin: "10px 0 0", fontSize: 34, fontWeight: 800 }}>
                  ₹{tier.price}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#8A8A8A",
                    }}
                  >
                    /mo
                  </span>
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 14, color: "#8A8A8A" }}>
                  {tier.branches}
                </p>
                <ul
                  style={{
                    margin: "16px 0 0",
                    padding: 0,
                    listStyle: "none",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        fontSize: 14,
                        color: "#1A1A1A",
                      }}
                    >
                      <Check size={16} strokeWidth={1.5} color="#1FA873" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/get-started"
                  className="landing-btn-green"
                  style={{ width: "100%", marginTop: 20 }}
                >
                  Get Started
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <section style={{ background: "#1A1A1A", color: "#fff" }}>
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              padding: "80px 20px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "clamp(26px, 4vw, 36px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                color: "#fff",
              }}
            >
              Ready to put your salon on autopilot?
            </h2>
            <p
              style={{
                margin: "16px auto 0",
                maxWidth: 560,
                fontSize: 16,
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              Join modern salons using SalonIQ to simplify operations, automate
              routine tasks and make better business decisions.
            </p>
            <div style={{ marginTop: 24 }}>
              <Link href="/get-started" className="landing-btn-green large">
                Start Free Trial
              </Link>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 18,
                marginTop: 28,
              }}
            >
              {["7-day free trial", "Setup in minutes", "Cancel anytime"].map(
                (stat) => (
                  <span
                    key={stat}
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.78)",
                    }}
                  >
                    {stat}
                  </span>
                )
              )}
            </div>
          </div>
        </section>
      </main>

      <footer
        style={{
          borderTop: "1px solid #E0DAD0",
          background: "#F9F8F3",
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: "22px 20px 28px",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1A1A1A" }}>
            SalonIQ OS
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "#8A8A8A" }}>
            © 2026 SalonIQ. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
