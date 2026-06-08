"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "saloniq_welcome_dismissed";

export function WelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <section
      style={{
        borderRadius: 16,
        border: "1px solid #1FA873",
        background: "#D4E8DD",
        padding: "16px 18px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ flex: "1 1 220px", minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 800,
            color: "#1A1A1A",
            lineHeight: 1.35,
          }}
        >
          SalonIQ mein swagat hai! Pehli booking add karein 🎉
        </p>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#8A8A8A" }}>
          Calendar kholo, customer select karo, aur aaj ka schedule shuru karo.
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <Link
          href="/dashboard/calendar?booking=new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 36,
            padding: "0 14px",
            borderRadius: 10,
            background: "#1FA873",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Pehli booking
        </Link>
        <button
          type="button"
          onClick={dismiss}
          style={{
            minHeight: 36,
            padding: "0 12px",
            borderRadius: 10,
            border: "1px solid #E0DAD0",
            background: "#fff",
            color: "#8A8A8A",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Theek hai
        </button>
      </div>
    </section>
  );
}
