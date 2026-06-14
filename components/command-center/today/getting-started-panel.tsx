"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";

export function GettingStartedPanel() {
  const { t } = useT();

  const tips = [
    {
      title: t("gettingStarted.tip1Title"),
      body: t("gettingStarted.tip1Body"),
      href: "/dashboard/calendar?booking=new",
      cta: t("gettingStarted.tip1Cta"),
    },
    {
      title: t("gettingStarted.tip2Title"),
      body: t("gettingStarted.tip2Body"),
      href: "/dashboard/customers",
      cta: t("gettingStarted.tip2Cta"),
    },
    {
      title: t("gettingStarted.tip3Title"),
      body: t("gettingStarted.tip3Body"),
      href: "/dashboard/settings",
      cta: t("gettingStarted.tip3Cta"),
    },
  ];

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{t("gettingStarted.eyebrow")}</p>
          <h2>{t("gettingStarted.title")}</h2>
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
