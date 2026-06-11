"use client";

import { useEffect, useState } from "react";
import { buildPublicBookingUrl, buildWhatsAppShareUrl } from "@/lib/booking/url";

type BookingLinkCardProps = {
  slug: string;
  salonName: string;
  compact?: boolean;
};

const TOKENS = {
  bgMain: "#EDE8DF",
  textDark: "#1A1A1A",
  textMuted: "#8A8A8A",
  borderSubtle: "#E0DAD0",
  accentGreen: "#1FA873",
  accentGreenSoft: "#D4E8DD",
};

export function BookingLinkCard({
  slug,
  salonName,
  compact = false,
}: BookingLinkCardProps) {
  const [bookingUrl, setBookingUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setBookingUrl(buildPublicBookingUrl(slug, window.location.origin));
  }, [slug]);

  const handleCopy = async () => {
    if (!bookingUrl) return;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const whatsappUrl = bookingUrl
    ? buildWhatsAppShareUrl(bookingUrl, salonName)
    : "#";

  return (
    <section
      style={{
        borderRadius: 16,
        border: `1px solid ${TOKENS.borderSubtle}`,
        background: TOKENS.bgMain,
        padding: compact ? 14 : 18,
      }}
    >
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
        Online booking link
      </p>
      <h2
        style={{
          margin: "4px 0 0",
          fontSize: compact ? 16 : 18,
          fontWeight: 800,
          color: TOKENS.textDark,
        }}
      >
        Customers yahan book karein
      </h2>
      <p style={{ margin: "8px 0 12px", fontSize: 13, color: TOKENS.textMuted, lineHeight: 1.45 }}>
        Link WhatsApp par bhejein — booking seedha calendar mein pending aayegi.
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <code
          style={{
            flex: "1 1 200px",
            minWidth: 0,
            fontSize: 12,
            padding: "10px 12px",
            borderRadius: 10,
            background: "#fff",
            border: `1px solid ${TOKENS.borderSubtle}`,
            color: TOKENS.textDark,
            wordBreak: "break-all",
          }}
        >
          {bookingUrl || `/book/${slug}`}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          style={buttonStyle(TOKENS.accentGreen)}
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...buttonStyle(TOKENS.accentGreenSoft),
            color: TOKENS.textDark,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Share on WhatsApp
        </a>
      </div>
    </section>
  );
}

function buttonStyle(background: string): React.CSSProperties {
  return {
    minHeight: 40,
    padding: "0 14px",
    borderRadius: 10,
    border: 0,
    background,
    color: background === "#D4E8DD" ? "#1A1A1A" : "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
  };
}
