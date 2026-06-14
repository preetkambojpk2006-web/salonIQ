"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { walkinJoinErrorMessage } from "@/lib/walkin/errors";
import { useT } from "@/lib/i18n/LanguageContext";
import type {
  PublicQueueContext,
  WalkinJoinResult,
} from "@/lib/walkin/types";
import { createClient } from "@/lib/supabase/client";

const TOKENS = {
  bgMain: "#EDE8DF",
  textDark: "#1A1A1A",
  textMuted: "#8A8A8A",
  borderSubtle: "#E0DAD0",
  accentGreen: "#1FA873",
  accentGreenSoft: "#D4E8DD",
};

type PublicQueuePageProps = {
  slug: string;
};

type QueueStatus = WalkinJoinResult["status"];

function statusBadgeStyle(status: QueueStatus): CSSProperties {
  switch (status) {
    case "waiting":
      return { background: "#F5E6A8", color: "#7A5C00" };
    case "called":
      return { background: "#F5D4A8", color: "#8A4B00" };
    case "in_service":
      return { background: "#D4E8DD", color: "#0F6B4A" };
    default:
      return { background: "#E8E4DC", color: "#5C5C5C" };
  }
}

function statusLabel(
  status: QueueStatus,
  t: (key: string) => string
): string {
  switch (status) {
    case "waiting":
      return t("status.waiting");
    case "called":
      return t("status.called");
    case "in_service":
      return t("status.inService");
    case "done":
      return t("status.done");
    case "left":
      return t("status.left");
    case "no_show":
      return t("status.noShow");
    default:
      return status;
  }
}

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: 44,
  borderRadius: 10,
  border: `1px solid ${TOKENS.borderSubtle}`,
  padding: "0 12px",
  fontSize: 15,
  color: TOKENS.textDark,
  background: "#fff",
};

function SalonHeader({
  salonName,
  openingHours,
}: {
  salonName: string;
  openingHours: string;
}) {
  return (
    <header>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 700,
          color: TOKENS.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        SalonIQ · Walk-in queue
      </p>
      <h1
        style={{
          margin: "6px 0 0",
          fontSize: 26,
          fontWeight: 800,
          color: TOKENS.textDark,
        }}
      >
        {salonName}
      </h1>
      {openingHours ? (
        <p style={{ margin: "8px 0 0", fontSize: 14, color: TOKENS.textMuted }}>
          {openingHours} · Queue 10am–8pm (IST)
        </p>
      ) : (
        <p style={{ margin: "8px 0 0", fontSize: 14, color: TOKENS.textMuted }}>
          Queue 10am–8pm (IST)
        </p>
      )}
    </header>
  );
}

function ClosedIllustration() {
  return (
    <div
      aria-hidden
      style={{
        width: 72,
        height: 72,
        margin: "0 auto 16px",
        borderRadius: 999,
        background: "#fff",
        border: `1px solid ${TOKENS.borderSubtle}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 32,
      }}
    >
      🕐
    </div>
  );
}

function SetupIllustration() {
  return (
    <div
      aria-hidden
      style={{
        width: 72,
        height: 72,
        margin: "0 auto 16px",
        borderRadius: 999,
        background: "#fff",
        border: `1px solid ${TOKENS.borderSubtle}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 32,
      }}
    >
      🔧
    </div>
  );
}

export function PublicQueuePage({ slug }: PublicQueuePageProps) {
  const { t } = useT();
  const [context, setContext] = useState<PublicQueueContext | null>(null);
  const [joinResult, setJoinResult] = useState<WalkinJoinResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      setLoading(true);
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc(
        "get_public_queue_context",
        { p_slug: slug }
      );

      if (cancelled) return;

      if (rpcError || !data) {
        setNotFound(true);
        setContext(null);
        setLoading(false);
        return;
      }

      setContext(data as PublicQueueContext);
      setLoading(false);
    }

    void loadContext();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleSubmit = useCallback(async () => {
    if (!customerName.trim()) {
      setError("Apna naam daalein.");
      return;
    }

    if (!customerPhone.trim()) {
      setError("Phone number daalein.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("join_walkin_queue", {
      p_slug: slug,
      p_name: customerName.trim(),
      p_phone: customerPhone.trim(),
    });

    setSubmitting(false);

    if (rpcError) {
      setError(walkinJoinErrorMessage(rpcError));
      return;
    }

    if (!data) {
      setError("Kuch gadbad ho gayi. Please dobara try karein.");
      return;
    }

    setJoinResult(data as WalkinJoinResult);
  }, [customerName, customerPhone, slug]);

  const pageShell = (content: React.ReactNode) => (
    <div
      style={{
        minHeight: "100vh",
        background: TOKENS.bgMain,
        padding: "20px 16px 40px",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto", display: "grid", gap: 16 }}>
        {content}
      </div>
    </div>
  );

  if (loading) {
    return pageShell(
      <p style={{ color: TOKENS.textMuted, fontSize: 14 }}>{t("common.loading")}</p>
    );
  }

  if (notFound || !context) {
    return pageShell(
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: TOKENS.textDark }}>
          Salon nahi mila
        </h1>
        <p style={{ color: TOKENS.textMuted, marginTop: 8 }}>
          Queue link check karein ya salon se sahi link maangein.
        </p>
      </div>
    );
  }

  if (joinResult) {
    const status = joinResult.status;
    return pageShell(
      <>
        <SalonHeader
          salonName={context.salon_name}
          openingHours={context.opening_hours_display}
        />
        <section
          style={{
            borderRadius: 16,
            border: `1px solid ${TOKENS.accentGreen}`,
            background: TOKENS.accentGreenSoft,
            padding: 24,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              margin: "0 auto 16px",
              borderRadius: 999,
              background: TOKENS.accentGreen,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            #{joinResult.daily_token_number}
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: TOKENS.textDark,
            }}
          >
            Aapka number: #{joinResult.daily_token_number}
          </h2>

          {joinResult.existing_entry ? (
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 14,
                color: TOKENS.textMuted,
                lineHeight: 1.5,
              }}
            >
              Aap pehle se queue mein hain — yahi aapka token hai.
            </p>
          ) : null}

          {status === "waiting" && joinResult.position > 0 ? (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 15,
                color: TOKENS.textDark,
                lineHeight: 1.5,
              }}
            >
              Aap <strong>{joinResult.position}</strong> number par hain queue
              mein
            </p>
          ) : status === "called" ? (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 15,
                color: TOKENS.textDark,
                lineHeight: 1.5,
              }}
            >
              Aapko bulaya ja chuka hai — counter par aayein!
            </p>
          ) : status === "in_service" ? (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 15,
                color: TOKENS.textDark,
                lineHeight: 1.5,
              }}
            >
              Aapki service chal rahi hai.
            </p>
          ) : null}

          <p
            style={{
              margin: "12px 0 0",
              fontSize: 15,
              color: TOKENS.textDark,
            }}
          >
            ~{joinResult.estimated_wait_mins} min ka wait
          </p>

          <span
            style={{
              display: "inline-block",
              marginTop: 14,
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              ...statusBadgeStyle(status),
            }}
          >
            {statusLabel(status, t)}
          </span>

          <p
            style={{
              margin: "16px 0 0",
              fontSize: 14,
              color: TOKENS.textDark,
              lineHeight: 1.5,
            }}
          >
            {t("walkin.stayNote")}
          </p>

          <Link
            href={`/queue/${slug}/t/${joinResult.public_token}`}
            style={{
              display: "inline-block",
              marginTop: 16,
              fontSize: 15,
              fontWeight: 700,
              color: TOKENS.accentGreen,
              textDecoration: "none",
            }}
          >
            Apna status track karo →
          </Link>
        </section>
      </>
    );
  }

  const showClosedMessage = Boolean(context.closed_message);
  const showSetupIncomplete = !context.setup_complete && context.is_open;

  return pageShell(
    <>
      <SalonHeader
        salonName={context.salon_name}
        openingHours={context.opening_hours_display}
      />

      {showClosedMessage ? (
        <section
          style={{
            borderRadius: 16,
            border: `1px solid ${TOKENS.borderSubtle}`,
            background: "#fff",
            padding: 24,
            textAlign: "center",
          }}
        >
          <ClosedIllustration />
          <p
            style={{
              margin: 0,
              fontSize: 15,
              color: TOKENS.textDark,
              lineHeight: 1.6,
              fontWeight: 600,
            }}
          >
            {context.closed_message}
          </p>
        </section>
      ) : showSetupIncomplete ? (
        <section
          style={{
            borderRadius: 16,
            border: `1px solid ${TOKENS.borderSubtle}`,
            background: "#fff",
            padding: 24,
            textAlign: "center",
          }}
        >
          <SetupIllustration />
          <p
            style={{
              margin: 0,
              fontSize: 15,
              color: TOKENS.textDark,
              lineHeight: 1.6,
              fontWeight: 600,
            }}
          >
            Queue abhi ready nahi hai
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: TOKENS.textMuted }}>
            Salon se seedha contact karein.
          </p>
        </section>
      ) : (
        <>
          <section
            style={{
              borderRadius: 16,
              border: `1px solid ${TOKENS.borderSubtle}`,
              background: "#fff",
              padding: 16,
            }}
          >
            <p style={{ margin: 0, fontSize: 14, color: TOKENS.textMuted }}>
              Abhi queue mein
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 28,
                fontWeight: 800,
                color: TOKENS.textDark,
              }}
            >
              {context.queue_length}{" "}
              <span style={{ fontSize: 16, fontWeight: 600 }}>log</span>
            </p>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 15,
                color: TOKENS.textDark,
              }}
            >
              ~{context.estimated_wait_mins} min ka wait hai
            </p>
          </section>

          <section
            style={{
              borderRadius: 16,
              border: `1px solid ${TOKENS.borderSubtle}`,
              background: "#fff",
              padding: 16,
            }}
          >
            <h2
              style={{
                margin: "0 0 12px",
                fontSize: 15,
                fontWeight: 800,
                color: TOKENS.textDark,
              }}
            >
              Queue mein join karein
            </h2>
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: TOKENS.textDark,
                  }}
                >
                  Naam
                </span>
                <input
                  type="text"
                  placeholder="Apna naam"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: TOKENS.textDark,
                  }}
                >
                  Phone
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  style={inputStyle}
                />
                <span style={{ fontSize: 12, color: TOKENS.textMuted }}>
                  10-digit mobile number
                </span>
              </label>
            </div>
          </section>

          {error ? (
            <p style={{ margin: 0, fontSize: 13, color: "#D94F4F" }} role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            style={{
              width: "100%",
              minHeight: 48,
              borderRadius: 10,
              border: 0,
              background: TOKENS.accentGreen,
              color: "#fff",
              fontSize: 16,
              fontWeight: 800,
              cursor: submitting ? "wait" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? t("common.loading") : t("walkin.join")}
          </button>
        </>
      )}
    </>
  );
}
