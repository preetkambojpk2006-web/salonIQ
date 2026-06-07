"use client";

import { useRouter } from "next/navigation";
import type { Insight } from "@/lib/coach/insights";

type CoachPageProps = {
  insights: Insight[];
};

const SEVERITY_STYLES: Record<
  Insight["severity"],
  { background: string; borderColor: string }
> = {
  good: {
    background: "#D4E8DD",
    borderColor: "#1FA873",
  },
  watch: {
    background: "#E8D9C0",
    borderColor: "#C9A96E",
  },
  action: {
    background: "#FCE8E8",
    borderColor: "#D94F4F",
  },
};

function actionHref(actionType: NonNullable<Insight["actionType"]>): string {
  if (actionType === "view_calendar") {
    return "/dashboard/calendar";
  }
  return "/dashboard/customers";
}

export function CoachPage({ insights }: CoachPageProps) {
  const router = useRouter();

  const handleAction = (insight: Insight) => {
    if (!insight.actionType) return;
    router.push(actionHref(insight.actionType));
  };

  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">AI business coach</p>
            <h2>Aapke salon ka smart advisor</h2>
          </div>
        </div>

        {insights.length === 0 ? (
          <p className="text-body" style={{ color: "#8A8A8A" }}>
            Abhi koi insight nahi — kuch bookings aur payments ke baad yahan smart
            suggestions dikhengi.
          </p>
        ) : (
          <div className="view-stack" style={{ gap: 14 }}>
            {insights.map((insight) => {
              const style = SEVERITY_STYLES[insight.severity];
              return (
                <article
                  key={insight.id}
                  style={{
                    borderRadius: 16,
                    borderLeft: `4px solid ${style.borderColor}`,
                    background: style.background,
                    padding: "16px 18px",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#1A1A1A",
                      lineHeight: 1.35,
                    }}
                  >
                    {insight.title}
                  </h3>
                  <p
                    style={{
                      marginTop: 8,
                      marginBottom: 0,
                      fontSize: 14,
                      color: "#8A8A8A",
                      lineHeight: 1.5,
                    }}
                  >
                    {insight.detail}
                  </p>
                  {insight.actionLabel && insight.actionType ? (
                    <button
                      type="button"
                      onClick={() => handleAction(insight)}
                      style={{
                        marginTop: 14,
                        minHeight: 40,
                        padding: "8px 16px",
                        borderRadius: 10,
                        border: "1px solid #E0DAD0",
                        background: "#fff",
                        color: "#1A1A1A",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                      className="active:scale-[0.98] motion-reduce:active:scale-100"
                    >
                      {insight.actionLabel}
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
