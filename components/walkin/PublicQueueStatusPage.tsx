"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type {
  WalkinQueueStatus,
  WalkinQueueStatusResult,
} from "@/lib/walkin/types";
import { createClient } from "@/lib/supabase/client";

const POLL_MS = 30_000;
const STOP_POLL_STATUSES = new Set<WalkinQueueStatus>(["done", "left", "no_show"]);

const TOKENS = {
  bgMain: "#EDE8DF",
  textDark: "#1A1A1A",
  textMuted: "#8A8A8A",
  borderSubtle: "#E0DAD0",
  accentGreen: "#1FA873",
  accentGreenSoft: "#D4E8DD",
  accentOrange: "#E8923A",
  accentOrangeSoft: "#F5D4A8",
};

type PublicQueueStatusPageProps = {
  slug: string;
  token: string;
};

function SalonHeader({ salonName }: { salonName: string }) {
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
    </header>
  );
}

function TokenCircle({
  tokenNumber,
  variant,
}: {
  tokenNumber: number;
  variant: "waiting" | "called" | "in_service" | "neutral";
}) {
  const styles: Record<typeof variant, CSSProperties> = {
    waiting: {
      background: "#fff",
      color: TOKENS.accentGreen,
      border: `4px solid ${TOKENS.accentGreen}`,
    },
    called: {
      background: TOKENS.accentOrangeSoft,
      color: "#8A4B00",
      border: `4px solid ${TOKENS.accentOrange}`,
    },
    in_service: {
      background: TOKENS.accentGreen,
      color: "#fff",
      border: `4px solid ${TOKENS.accentGreen}`,
    },
    neutral: {
      background: "#E8E4DC",
      color: "#5C5C5C",
      border: `4px solid ${TOKENS.borderSubtle}`,
    },
  };

  return (
    <div
      style={{
        width: 96,
        height: 96,
        margin: "0 auto 16px",
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 36,
        fontWeight: 800,
        ...styles[variant],
      }}
    >
      #{tokenNumber}
    </div>
  );
}

function StatusBadge({
  label,
  style,
}: {
  label: string;
  style: CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 700,
        ...style,
      }}
    >
      {label}
    </span>
  );
}

function StatusCard({ children }: { children: ReactNode }) {
  return (
    <section
      style={{
        borderRadius: 16,
        border: `1px solid ${TOKENS.borderSubtle}`,
        background: "#fff",
        padding: 24,
        textAlign: "center",
      }}
    >
      {children}
    </section>
  );
}

function peopleAheadCopy(position: number): string {
  if (position <= 1) {
    return "Aap next hain! 🎉";
  }
  return `Aapke aage ${position - 1} log hain`;
}

function WaitingStatus({ status }: { status: WalkinQueueStatusResult }) {
  return (
    <StatusCard>
      <TokenCircle tokenNumber={status.daily_token_number} variant="waiting" />
      <h2
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 800,
          color: TOKENS.textDark,
        }}
      >
        Aap #{status.daily_token_number} number par hain
      </h2>
      <p
        style={{
          margin: "12px 0 0",
          fontSize: 15,
          color: TOKENS.textDark,
          lineHeight: 1.5,
        }}
      >
        {peopleAheadCopy(status.position)}
      </p>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: 15,
          color: TOKENS.textDark,
        }}
      >
        ~{status.estimated_wait_mins} min ka wait
      </p>
      <div style={{ marginTop: 14 }}>
        <StatusBadge
          label="Intezaar mein"
          style={{ background: "#F5E6A8", color: "#7A5C00" }}
        />
      </div>
      <p
        style={{
          margin: "16px 0 0",
          fontSize: 12,
          color: TOKENS.textMuted,
        }}
      >
        Har 30 second mein update hota hai
      </p>
    </StatusCard>
  );
}

function CalledStatus({ status }: { status: WalkinQueueStatusResult }) {
  return (
    <StatusCard>
      <TokenCircle tokenNumber={status.daily_token_number} variant="called" />
      <div style={{ marginBottom: 12 }}>
        <StatusBadge
          label="Aapko bulaya ja raha hai! 🔔"
          style={{ background: "#F5D4A8", color: "#8A4B00" }}
        />
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 700,
          color: TOKENS.textDark,
          lineHeight: 1.5,
        }}
      >
        Kripya counter par aa jayein
      </p>
    </StatusCard>
  );
}

function InServiceStatus({ status }: { status: WalkinQueueStatusResult }) {
  return (
    <StatusCard>
      <TokenCircle tokenNumber={status.daily_token_number} variant="in_service" />
      <div style={{ marginBottom: 12 }}>
        <StatusBadge
          label="Service chal rahi hai ✂️"
          style={{ background: TOKENS.accentGreenSoft, color: "#0F6B4A" }}
        />
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 700,
          color: TOKENS.textDark,
          lineHeight: 1.5,
        }}
      >
        Aapki service shuru ho gayi
      </p>
    </StatusCard>
  );
}

function DoneStatus({ status }: { status: WalkinQueueStatusResult }) {
  return (
    <StatusCard>
      <TokenCircle tokenNumber={status.daily_token_number} variant="neutral" />
      <div style={{ marginBottom: 12 }}>
        <StatusBadge
          label="Service complete ✅"
          style={{ background: "#E8E4DC", color: "#5C5C5C" }}
        />
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 700,
          color: TOKENS.textDark,
          lineHeight: 1.5,
        }}
      >
        Shukriya! Dobara aana 🙏
      </p>
    </StatusCard>
  );
}

function RemovedStatus({ slug }: { slug: string }) {
  return (
    <StatusCard>
      <div style={{ marginBottom: 12 }}>
        <StatusBadge
          label="Queue se hata diya gaya"
          style={{ background: "#E8E4DC", color: "#5C5C5C" }}
        />
      </div>
      <Link
        href={`/queue/${slug}`}
        style={{
          display: "inline-block",
          marginTop: 8,
          fontSize: 15,
          fontWeight: 700,
          color: TOKENS.accentGreen,
          textDecoration: "none",
        }}
      >
        Dobara queue mein join karo →
      </Link>
    </StatusCard>
  );
}

export function PublicQueueStatusPage({ slug, token }: PublicQueueStatusPageProps) {
  const [status, setStatus] = useState<WalkinQueueStatusResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const statusRef = useRef<WalkinQueueStatusResult | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus(isInitial: boolean) {
      if (isInitial) {
        setLoading(true);
      }

      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc(
        "get_walkin_queue_status",
        { p_slug: slug, p_token: token }
      );

      if (cancelled) return;

      if (rpcError || !data) {
        setNotFound(true);
        setStatus(null);
        statusRef.current = null;
      } else {
        const parsed = data as WalkinQueueStatusResult;
        setNotFound(false);
        setStatus(parsed);
        statusRef.current = parsed;
      }

      if (isInitial) {
        setLoading(false);
      }
    }

    void loadStatus(true);

    const intervalId = setInterval(() => {
      const current = statusRef.current;
      if (current && STOP_POLL_STATUSES.has(current.status)) {
        return;
      }
      void loadStatus(false);
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [slug, token]);

  const pageShell = (content: ReactNode) => (
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
      <p style={{ color: TOKENS.textMuted, fontSize: 14 }}>Loading…</p>
    );
  }

  if (notFound || !status) {
    return pageShell(
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: TOKENS.textDark }}>
          Token nahi mila
        </h1>
        <p style={{ color: TOKENS.textMuted, marginTop: 8, lineHeight: 1.5 }}>
          Shayad aaj ka nahi hai — naya token ke liye queue join karein.
        </p>
        <Link
          href={`/queue/${slug}`}
          style={{
            display: "inline-block",
            marginTop: 16,
            fontSize: 15,
            fontWeight: 700,
            color: TOKENS.accentGreen,
            textDecoration: "none",
          }}
        >
          Queue mein join karo →
        </Link>
      </div>
    );
  }

  let body: ReactNode;
  switch (status.status) {
    case "waiting":
      body = <WaitingStatus status={status} />;
      break;
    case "called":
      body = <CalledStatus status={status} />;
      break;
    case "in_service":
      body = <InServiceStatus status={status} />;
      break;
    case "done":
      body = <DoneStatus status={status} />;
      break;
    case "left":
    case "no_show":
      body = <RemovedStatus slug={slug} />;
      break;
    default:
      body = <WaitingStatus status={status} />;
  }

  return pageShell(
    <>
      <SalonHeader salonName={status.salon_name} />
      {body}
    </>
  );
}
