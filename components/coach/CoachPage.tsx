"use client";

import { type FormEvent, useState } from "react";
import { Bot } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Insight } from "@/lib/coach/insights";

type CoachPageProps = {
  insights: Insight[];
};

type QaExchange = {
  question: string;
  answer: string;
};

type CoachTopic =
  | "summary"
  | "improve"
  | "slots"
  | "revenue"
  | "service"
  | "staff"
  | "customers"
  | "noshow"
  | "repeat";

const TOKENS = {
  bgMain: "#EDE8DF",
  textDark: "#1A1A1A",
  textMuted: "#8A8A8A",
  borderSubtle: "#E0DAD0",
  accentGreen: "#1FA873",
  accentGreenSoft: "#D4E8DD",
};

const SUGGESTED_QUESTIONS = [
  "Revenue kaisi hai?",
  "Kaunsi service best hai?",
  "Kaun sa staff top hai?",
  "Kya improve karu?",
] as const;

const MISSING_DATA_ANSWER =
  "Is topic par abhi data kam hai — thodi aur bookings ke baad yahan answer milega.";

function isLowData(insights: Insight[]): boolean {
  return insights.length === 1 && insights[0]?.id === "low-data";
}

function getInsight(insights: Insight[], id: string): Insight | null {
  return insights.find((insight) => insight.id === id) ?? null;
}

function joinAnswer(parts: Array<string | null | undefined>): string {
  const lines = parts.filter((part): part is string => Boolean(part));
  return lines.length > 0 ? lines.join("\n\n") : MISSING_DATA_ANSWER;
}

function formatNoMatch(): string {
  return joinAnswer([
    "Yeh sawaal abhi clear nahi hua. Aap yeh try kar sakte hain:",
    '• "Revenue kaisi hai?"',
    '• "Kaunsi service best hai?"',
    '• "Kya improve karu?"',
    '• "Sab batao — quick report"',
    '• "Kaun se din slow hain?"',
  ]);
}

function detectTopic(question: string): CoachTopic | null {
  const q = question.toLowerCase().trim();

  if (
    q.includes("summary") ||
    q.includes("report") ||
    q.includes("overview") ||
    q.includes("sab batao") ||
    q.includes("poora report")
  ) {
    return "summary";
  }

  if (
    q.includes("improve") ||
    q.includes("grow") ||
    q.includes("badhao") ||
    q.includes("suggestion") ||
    q.includes("kya karu") ||
    q.includes("kya karun")
  ) {
    return "improve";
  }

  if (
    q.includes("best day") ||
    q.includes("worst day") ||
    q.includes("slow") ||
    q.includes("busy") ||
    q.includes("khali") ||
    q.includes("slot") ||
    q.includes("din") ||
    q.includes("time")
  ) {
    return "slots";
  }

  if (
    q.includes("revenue") ||
    q.includes("kamai") ||
    q.includes("paise") ||
    q.includes("income")
  ) {
    return "revenue";
  }

  if (
    q.includes("service") ||
    q.includes("popular") ||
    q.includes("profitable") ||
    q.includes("kaunsi")
  ) {
    return "service";
  }

  if (
    q.includes("staff") ||
    q.includes("performer") ||
    q.includes("kaun accha") ||
    q.includes("anita")
  ) {
    return "staff";
  }

  if (
    q.includes("customer") ||
    q.includes("inactive") ||
    q.includes("wapas") ||
    q.includes("chhute")
  ) {
    return "customers";
  }

  if (
    q.includes("no-show") ||
    q.includes("no show") ||
    q.includes("noshow") ||
    q.includes("absent") ||
    q.includes("nahi aaya")
  ) {
    return "noshow";
  }

  if (q.includes("repeat") || q.includes("loyal") || q.includes("regular")) {
    return "repeat";
  }

  return null;
}

function answerRevenue(insights: Insight[]): string {
  const revenue = getInsight(insights, "revenue-trend");
  if (!revenue) return MISSING_DATA_ANSWER;

  return joinAnswer([
    revenue.title + ".",
    revenue.detail,
    "Recommendation: agar week soft hai to slow slots par comeback offer test karein.",
  ]);
}

function answerSlots(insights: Insight[]): string {
  const slow = getInsight(insights, "slow-slot");
  const busy = getInsight(insights, "busy-slot");

  if (!slow && !busy) return MISSING_DATA_ANSWER;

  return joinAnswer([
    slow ? `Slow slot: ${slow.detail}` : null,
    busy ? `Busy slot: ${busy.detail}` : null,
    "Strategy: slow slots fill karein offers se, busy slots par high-value services aur buffer time rakhein.",
  ]);
}

function answerService(insights: Insight[]): string {
  const bookings = getInsight(insights, "top-service-bookings");
  const revenue = getInsight(insights, "top-service-revenue");

  if (!bookings && !revenue) return MISSING_DATA_ANSWER;

  return joinAnswer([
    bookings ? `Bookings leader: ${bookings.detail}` : null,
    revenue ? `Revenue leader: ${revenue.detail}` : null,
    bookings && revenue
      ? "Dono metrics alag ho sakti hain — high-booking service ko upsell karein, high-revenue service ko front-page par promote karein."
      : null,
  ]);
}

function answerStaff(insights: Insight[]): string {
  const staff = getInsight(insights, "top-staff-revenue");
  if (!staff) return MISSING_DATA_ANSWER;

  return joinAnswer([
    staff.title + ".",
    staff.detail,
    "Recommendation: unke peak hours protect karein aur walk-in overflow ke liye backup staff plan karein.",
  ]);
}

function answerCustomers(insights: Insight[]): string {
  const inactive = getInsight(insights, "inactive-customers");
  if (!inactive) {
    return joinAnswer([
      "Abhi koi inactive customer flag nahi — retention healthy lag rahi hai.",
      "Suggestion: regular customers ko priority slots aur small loyalty perks se engage rakhein.",
    ]);
  }

  return joinAnswer([
    inactive.title + ".",
    inactive.detail,
    "Suggestion: gentle WhatsApp comeback offer bhejein — 10-15% off often strong results deta hai.",
  ]);
}

function answerNoshow(insights: Insight[]): string {
  const repeat = getInsight(insights, "repeat-no-show");
  if (!repeat) return MISSING_DATA_ANSWER;

  const parts = repeat.detail.split(" — ");
  const noShowPart =
    parts.find((part) => part.toLowerCase().includes("no-show")) ?? repeat.detail;

  return joinAnswer([
    repeat.title + ".",
    noShowPart.endsWith(".") ? noShowPart : `${noShowPart}.`,
    "Advice: booking confirm ke baad 24 ghante pehle WhatsApp reminder bhejein aur high-risk slots par deposit policy consider karein.",
  ]);
}

function answerRepeat(insights: Insight[]): string {
  const repeat = getInsight(insights, "repeat-no-show");
  if (!repeat) return MISSING_DATA_ANSWER;

  const parts = repeat.detail.split(" — ");
  const repeatPart =
    parts.find((part) => part.toLowerCase().includes("repeat")) ?? repeat.detail;

  return joinAnswer([
    repeat.title + ".",
    repeatPart.endsWith(".") ? repeatPart : `${repeatPart}.`,
    repeat.severity === "good"
      ? "Loyal customers ko priority slots aur small perks se reward karein."
      : "First-time visitors ko follow-up message se repeat visit encourage karein.",
  ]);
}

function answerImprove(insights: Insight[]): string {
  const actions = insights.filter((insight) => insight.severity === "action");

  if (actions.length > 0) {
    return joinAnswer([
      "Aapke data ke hisaab se top smart moves:",
      ...actions.slice(0, 2).map(
        (insight, index) =>
          `${index + 1}. ${insight.title} — ${insight.detail}`
      ),
    ]);
  }

  const watch = insights.filter((insight) => insight.severity === "watch");
  if (watch.length > 0) {
    return joinAnswer([
      "Abhi urgent red flags nahi, lekin yeh areas watch karein:",
      ...watch.slice(0, 2).map(
        (insight, index) =>
          `${index + 1}. ${insight.title} — ${insight.detail}`
      ),
    ]);
  }

  return joinAnswer([
    "Metrics stable lag rahi hain — consistency maintain karein.",
    "Weekly ek baar revenue aur slot report review karna best habit hai.",
  ]);
}

function answerSummary(insights: Insight[]): string {
  const keyIds = [
    "revenue-trend",
    "top-service-bookings",
    "top-service-revenue",
    "top-staff-revenue",
    "inactive-customers",
    "slow-slot",
    "busy-slot",
    "repeat-no-show",
  ];

  const bullets = keyIds
    .map((id) => getInsight(insights, id))
    .filter((insight): insight is Insight => insight !== null)
    .map((insight) => `• ${insight.title}: ${insight.detail}`);

  if (bullets.length === 0) return MISSING_DATA_ANSWER;

  return joinAnswer(["Quick business overview:", ...bullets]);
}

function answerQuestion(question: string, insights: Insight[]): string {
  const trimmed = question.trim();
  if (!trimmed) {
    return joinAnswer([
      "Kuch likh ke poochhen — jaise revenue kaisi chal rahi hai?",
      'Ya neeche suggested questions par tap karein.',
    ]);
  }

  if (isLowData(insights)) {
    return insights[0]?.detail ?? MISSING_DATA_ANSWER;
  }

  const topic = detectTopic(trimmed);
  if (!topic) return formatNoMatch();

  switch (topic) {
    case "summary":
      return answerSummary(insights);
    case "improve":
      return answerImprove(insights);
    case "slots":
      return answerSlots(insights);
    case "revenue":
      return answerRevenue(insights);
    case "service":
      return answerService(insights);
    case "staff":
      return answerStaff(insights);
    case "customers":
      return answerCustomers(insights);
    case "noshow":
      return answerNoshow(insights);
    case "repeat":
      return answerRepeat(insights);
    default:
      return formatNoMatch();
  }
}

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
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<QaExchange[]>([]);

  const submitQuestion = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const answer = answerQuestion(trimmed, insights);
    setExchanges((prev) => [...prev, { question: trimmed, answer }]);
    setQuestion("");
  };

  const handleAsk = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitQuestion(question);
  };

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
          <p className="text-body" style={{ color: TOKENS.textMuted }}>
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
                      color: TOKENS.textDark,
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
                      color: TOKENS.textMuted,
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
                        border: `1px solid ${TOKENS.borderSubtle}`,
                        background: "#fff",
                        color: TOKENS.textDark,
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

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Coach se poochho</p>
            <h2>Kuch sawaal hai?</h2>
          </div>
        </div>

        {exchanges.length > 0 ? (
          <div className="view-stack" style={{ gap: 18, marginBottom: 16 }}>
            {exchanges.map((exchange, index) => (
              <div
                key={`qa-${index}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  width: "100%",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 600,
                      color: TOKENS.textMuted,
                      letterSpacing: "0.02em",
                    }}
                  >
                    Aapne poocha:
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 14,
                      fontWeight: 600,
                      color: TOKENS.textDark,
                      lineHeight: 1.4,
                    }}
                  >
                    {exchange.question}
                  </p>
                </div>

                <article
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    border: `1px solid ${TOKENS.borderSubtle}`,
                    background: "#fff",
                    padding: "16px 18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Bot
                      className="shrink-0"
                      size={16}
                      strokeWidth={1.75}
                      color={TOKENS.textDark}
                      aria-hidden
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: TOKENS.textMuted,
                        letterSpacing: "0.02em",
                      }}
                    >
                      AI Coach
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: 14,
                      color: TOKENS.textDark,
                      lineHeight: 1.55,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {exchange.answer}
                  </p>
                </article>
              </div>
            ))}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {SUGGESTED_QUESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuestion(suggestion)}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: "none",
                background: TOKENS.accentGreenSoft,
                color: TOKENS.accentGreen,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              className="active:scale-[0.98] motion-reduce:active:scale-100"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleAsk}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            gap: 10,
          }}
        >
          <input
            className="input-field"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Try: revenue kaisi chal rahi hai?"
            aria-label="Coach ko sawaal poochho"
            style={{
              borderRadius: 10,
              borderColor: TOKENS.borderSubtle,
              color: TOKENS.textDark,
            }}
          />
          <button
            type="submit"
            disabled={!question.trim()}
            style={{
              minHeight: 44,
              padding: "8px 16px",
              borderRadius: 10,
              border: `1px solid ${TOKENS.accentGreen}`,
              background: TOKENS.accentGreen,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: question.trim() ? "pointer" : "not-allowed",
              opacity: question.trim() ? 1 : 0.55,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            className="active:scale-[0.98] motion-reduce:active:scale-100"
          >
            Pooch
          </button>
        </form>
      </section>
    </div>
  );
}
