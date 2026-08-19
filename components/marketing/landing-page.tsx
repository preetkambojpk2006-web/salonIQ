import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  Clock,
  IndianRupee,
  MessageCircle,
  Receipt,
  Store,
  UserRound,
  CalendarCheck,
  Wallet,
} from "lucide-react";

const TOKENS = {
  bgMain: "#EDE8DF",
  bgPanel: "#F9F8F3",
  textDark: "#1A1A1A",
  textMuted: "#8A8A8A",
  borderSubtle: "#E0DAD0",
  accentGreen: "#1FA873",
  accentGreenSoft: "#D4E8DD",
  charcoal: "#1A1A1A",
};

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Add your salon details",
    description: "Name, hours, branches — setup in minutes.",
    icon: Store,
  },
  {
    step: "2",
    title: "Set up staff and services",
    description: "Team, services, prices, commission rules.",
    icon: UserRound,
  },
  {
    step: "3",
    title: "Start taking bookings",
    description: "Calendar, walk-ins, and online booking link.",
    icon: CalendarCheck,
  },
  {
    step: "4",
    title: "Get paid, track everything",
    description: "Payments, payouts, GST bills, daily reports.",
    icon: Wallet,
  },
];

const FEATURES = [
  {
    title: "Smart Booking Calendar",
    description: "Day view, drag-reschedule, overlap warnings, online requests.",
    icon: CalendarDays,
  },
  {
    title: "WhatsApp Reminders",
    description: "Confirmations, delays, and customer follow-ups in one tap.",
    icon: MessageCircle,
  },
  {
    title: "Staff Commission and Payouts",
    description: "Track earnings, fines, advances, and settle in one place.",
    icon: IndianRupee,
  },
  {
    title: "GST Billing",
    description: "GSTIN, inclusive or exclusive pricing, invoice PDFs.",
    icon: Receipt,
  },
  {
    title: "Business Analytics",
    description: "Revenue trends, top services, busy hours, and daily pulse.",
    icon: BarChart3,
  },
  {
    title: "Attendance Tracking",
    description: "Mark present, late, absent — with optional late fines.",
    icon: Clock,
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "1499",
    branches: "1–2 branches",
    highlight: false,
  },
  {
    name: "Growth",
    price: "1999",
    branches: "3–4 branches",
    highlight: true,
  },
  {
    name: "Scale",
    price: "2499",
    branches: "5+ branches",
    highlight: false,
  },
];

const outlineButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 40,
  padding: "0 16px",
  borderRadius: 10,
  border: `1px solid ${TOKENS.borderSubtle}`,
  background: "#fff",
  color: TOKENS.textDark,
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
};

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  padding: "0 20px",
  borderRadius: 10,
  border: 0,
  background: TOKENS.accentGreen,
  color: "#fff",
  fontSize: 15,
  fontWeight: 800,
  textDecoration: "none",
};

const darkButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  background: TOKENS.charcoal,
};

export function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: TOKENS.bgMain, color: TOKENS.textDark }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: `1px solid ${TOKENS.borderSubtle}`,
          background: "rgba(249, 248, 243, 0.92)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: TOKENS.textDark,
              textDecoration: "none",
              letterSpacing: "0.04em",
            }}
          >
            SalonIQ OS
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/login" style={outlineButtonStyle}>
              Sign in
            </Link>
            <Link href="/get-started" style={primaryButtonStyle}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "56px 20px 48px",
            display: "grid",
            gap: 24,
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                color: TOKENS.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              SalonIQ OS
            </p>
            <h1
              style={{
                margin: "12px 0 0",
                fontSize: "clamp(32px, 6vw, 48px)",
                fontWeight: 800,
                lineHeight: 1.08,
              }}
            >
              Your salon, on autopilot
            </h1>
            <p
              style={{
                margin: "16px auto 0",
                maxWidth: 560,
                fontSize: 17,
                lineHeight: 1.55,
                color: TOKENS.textMuted,
              }}
            >
              Bookings, customers, payments aur daily reports — sab ek jagah.
              WhatsApp-first, India ke liye bana.
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
            <Link href="/get-started" style={darkButtonStyle}>
              Get Started
            </Link>
            <a href="#how-it-works" style={outlineButtonStyle}>
              See how it works
            </a>
          </div>
        </section>

        <section
          id="how-it-works"
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "24px 20px 56px",
          }}
        >
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                color: TOKENS.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              How it works
            </p>
            <h2 style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 800 }}>
              Setup se settlement tak
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {HOW_IT_WORKS.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.step}
                  style={{
                    padding: "18px 16px",
                    borderRadius: 16,
                    border: `1px solid ${TOKENS.borderSubtle}`,
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        background: TOKENS.accentGreenSoft,
                        color: TOKENS.accentGreen,
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      {item.step}
                    </span>
                    <Icon size={16} strokeWidth={1.5} aria-hidden />
                  </div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                    {item.title}
                  </h3>
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: TOKENS.textMuted,
                    }}
                  >
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section
          id="features"
          style={{
            background: TOKENS.bgPanel,
            borderTop: `1px solid ${TOKENS.borderSubtle}`,
            borderBottom: `1px solid ${TOKENS.borderSubtle}`,
          }}
        >
          <div
            style={{
              maxWidth: 1120,
              margin: "0 auto",
              padding: "56px 20px",
            }}
          >
            <div style={{ marginBottom: 24, textAlign: "center" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: TOKENS.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Features
              </p>
              <h2 style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 800 }}>
                Everything your salon needs
              </h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 14,
              }}
            >
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    style={{
                      padding: "18px 16px",
                      borderRadius: 16,
                      border: `1px solid ${TOKENS.borderSubtle}`,
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: TOKENS.accentGreenSoft,
                        color: TOKENS.accentGreen,
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
                        color: TOKENS.textMuted,
                      }}
                    >
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="pricing"
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "56px 20px",
          }}
        >
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                color: TOKENS.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Pricing
            </p>
            <h2 style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 800 }}>
              Simple monthly plans
            </h2>
            <p
              style={{
                margin: "10px auto 0",
                maxWidth: 480,
                fontSize: 14,
                color: TOKENS.textMuted,
              }}
            >
              15-day free trial, no credit card required.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 14,
              alignItems: "stretch",
            }}
          >
            {PRICING.map((tier) => (
              <article
                key={tier.name}
                style={{
                  padding: "22px 18px",
                  borderRadius: 16,
                  border: `1px solid ${tier.highlight ? TOKENS.accentGreen : TOKENS.borderSubtle}`,
                  background: tier.highlight ? "#fff" : TOKENS.bgPanel,
                  boxShadow: tier.highlight
                    ? "0 8px 24px rgba(31, 168, 115, 0.08)"
                    : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: TOKENS.textMuted,
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
                        color: TOKENS.textMuted,
                      }}
                    >
                      /mo
                    </span>
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: 14, color: TOKENS.textMuted }}>
                    {tier.branches}
                  </p>
                </div>
                <Link
                  href="/get-started"
                  style={{
                    ...primaryButtonStyle,
                    width: "100%",
                    marginTop: "auto",
                  }}
                >
                  Get Started
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section
          style={{
            maxWidth: 920,
            margin: "0 auto",
            padding: "0 20px 56px",
          }}
        >
          <div
            style={{
              padding: "28px 24px",
              borderRadius: 16,
              border: `1px solid ${TOKENS.borderSubtle}`,
              background: "#fff",
              textAlign: "center",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
              Ready to put your salon on autopilot?
            </h2>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 15,
                color: TOKENS.textMuted,
              }}
            >
              Start your free trial today — setup takes minutes.
            </p>
            <div style={{ marginTop: 18 }}>
              <Link href="/get-started" style={darkButtonStyle}>
                Get Started
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer
        style={{
          borderTop: `1px solid ${TOKENS.borderSubtle}`,
          background: TOKENS.bgPanel,
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "24px 20px 32px",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>SalonIQ OS</p>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: TOKENS.textMuted }}>
              Simple salon software for India.
            </p>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: TOKENS.textMuted }}>
            © {new Date().getFullYear()} SalonIQ OS
          </p>
        </div>
      </footer>
    </div>
  );
}
