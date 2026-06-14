"use client";

import { Bot, CalendarClock, MessageCircle, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageContext";

export function ReceptionistView() {
  const { t } = useT();

  const capabilities = [
    { icon: MessageCircle, key: "receptionist.capabilityReplies" },
    { icon: CalendarClock, key: "receptionist.capabilityBookings" },
    { icon: Sparkles, key: "receptionist.capabilityReminders" },
  ];

  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{t("receptionist.eyebrow")}</p>
            <h2>{t("receptionist.title")}</h2>
          </div>
          <span className="tag orange">{t("receptionist.comingSoon")}</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 14,
            padding: "32px 20px",
          }}
        >
          <div
            style={{
              display: "grid",
              placeItems: "center",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "var(--mint-soft)",
              color: "var(--mint)",
            }}
          >
            <Bot size={28} strokeWidth={1.75} aria-hidden />
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            {t("receptionist.heroTitle")}
          </h3>
          <p
            className="text-body"
            style={{ margin: 0, maxWidth: 460, lineHeight: 1.55 }}
          >
            {t("receptionist.heroDescription")}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          {capabilities.map(({ icon: Icon, key }) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid var(--line)",
                background: "#fff",
              }}
            >
              <Icon size={18} strokeWidth={1.75} aria-hidden style={{ color: "var(--mint)", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t(key)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
