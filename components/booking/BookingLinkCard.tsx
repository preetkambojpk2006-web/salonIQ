"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { buildPublicBookingUrl, buildWhatsAppShareUrl } from "@/lib/booking/url";
import { useT } from "@/lib/i18n/LanguageContext";

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
  const { t } = useT();
  const [bookingUrl, setBookingUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBookingUrl(buildPublicBookingUrl(slug, window.location.origin));
  }, [slug]);

  const handleDownloadQr = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const serialized = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([serialized], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const scale = 4;
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size * scale;
      canvas.height = size * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const link = document.createElement("a");
      link.download = `${slug}-booking-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    image.src = url;
  };

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
        {t("settings.bookingLinkEyebrow")}
      </p>
      <h2
        style={{
          margin: "4px 0 0",
          fontSize: compact ? 16 : 18,
          fontWeight: 800,
          color: TOKENS.textDark,
        }}
      >
        {t("settings.bookingTitle")}
      </h2>
      <p style={{ margin: "8px 0 12px", fontSize: 13, color: TOKENS.textMuted, lineHeight: 1.45 }}>
        {t("settings.bookingHint")}
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
          {copied ? t("common.copied") : t("common.copyLink")}
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
          {t("settings.shareWhatsApp")}
        </a>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          ref={qrRef}
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#fff",
            border: `1px solid ${TOKENS.borderSubtle}`,
            lineHeight: 0,
          }}
        >
          {bookingUrl ? (
            <QRCode
              value={bookingUrl}
              size={160}
              fgColor="#1A1A1A"
              bgColor="#FFFFFF"
            />
          ) : (
            <div style={{ width: 160, height: 160, background: "#f5f5f5", borderRadius: 8 }} />
          )}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: TOKENS.textMuted, textAlign: "center" }}>
          {t("settings.bookingQrHint")}
        </p>
        <button
          type="button"
          onClick={handleDownloadQr}
          disabled={!bookingUrl}
          style={{
            ...buttonStyle(TOKENS.accentGreenSoft),
            color: TOKENS.textDark,
            cursor: bookingUrl ? "pointer" : "not-allowed",
          }}
        >
          {t("settings.bookingQrDownload")}
        </button>
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
