"use client";

import { useEffect, useState, type CSSProperties } from "react";
import QRCode from "react-qr-code";
import { buildPublicQueueUrl } from "@/lib/walkin/url";
import { useT } from "@/lib/i18n/LanguageContext";

type WalkinQrCardProps = {
  slug: string;
  businessName: string;
};

const TOKENS = {
  bgMain: "#EDE8DF",
  textDark: "#1A1A1A",
  textMuted: "#8A8A8A",
  borderSubtle: "#E0DAD0",
  accentGreen: "#1FA873",
};

const PRINT_STYLE_ID = "walkin-qr-print-styles";

function ensurePrintStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(PRINT_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    @media print {
      body * {
        visibility: hidden !important;
      }
      #walkin-qr-print-card,
      #walkin-qr-print-card * {
        visibility: visible !important;
      }
      #walkin-qr-print-card {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
        background: #fff !important;
      }
      #walkin-qr-print-card .walkin-qr-no-print {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

export function WalkinQrCard({ slug, businessName }: WalkinQrCardProps) {
  const { t } = useT();
  const [queueUrl, setQueueUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setQueueUrl(buildPublicQueueUrl(slug, window.location.origin));
    ensurePrintStyles();
  }, [slug]);

  const handleCopy = async () => {
    if (!queueUrl) return;
    try {
      await navigator.clipboard.writeText(queueUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section
      id="walkin-qr-print-card"
      style={{
        borderRadius: 16,
        border: `1px solid ${TOKENS.borderSubtle}`,
        background: TOKENS.bgMain,
        padding: 18,
        textAlign: "center",
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
        Walk-in queue
      </p>

      <div
        style={{
          margin: "16px auto",
          padding: 12,
          borderRadius: 12,
          background: "#fff",
          border: `1px solid ${TOKENS.borderSubtle}`,
          display: "inline-block",
        }}
      >
        {queueUrl ? (
          <QRCode
            value={queueUrl}
            size={180}
            fgColor="#1A1A1A"
            bgColor="#FFFFFF"
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          />
        ) : (
          <div
            style={{
              width: 180,
              height: 180,
              background: "#f5f5f5",
              borderRadius: 8,
            }}
          />
        )}
      </div>

      <h2
        style={{
          margin: "0 0 8px",
          fontSize: 18,
          fontWeight: 800,
          color: TOKENS.textDark,
        }}
      >
        {businessName}
      </h2>

      <p
        style={{
          margin: "0 0 16px",
          fontSize: 14,
          color: TOKENS.textMuted,
          lineHeight: 1.45,
        }}
      >
        {t("settings.walkinScan")}
      </p>

      <div
        className="walkin-qr-no-print"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={handleCopy}
          style={buttonStyle(TOKENS.accentGreen, "#fff")}
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
        <button
          type="button"
          onClick={handlePrint}
          style={buttonStyle("#fff", TOKENS.textDark, TOKENS.borderSubtle)}
        >
          Print
        </button>
      </div>
    </section>
  );
}

function buttonStyle(
  background: string,
  color: string,
  border?: string
): CSSProperties {
  return {
    minHeight: 40,
    padding: "0 14px",
    borderRadius: 10,
    border: border ? `1px solid ${border}` : 0,
    background,
    color,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  };
}
