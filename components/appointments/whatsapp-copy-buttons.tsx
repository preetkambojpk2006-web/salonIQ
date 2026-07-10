"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { Appointment } from "@/lib/appointments/types";
import { useT } from "@/lib/i18n/LanguageContext";
import {
  buildConfirmationMessage,
  buildPaymentReceiptMessage,
} from "@/lib/whatsapp/templates";

type WhatsAppCopyButtonsProps = {
  appointment: Appointment;
  businessName: string;
  onCopied: () => void;
  compact?: boolean;
  menuPlacement?: "top" | "bottom";
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function WhatsAppCopyButtons({
  appointment,
  businessName,
  onCopied,
  compact = false,
  menuPlacement = "bottom",
}: WhatsAppCopyButtonsProps) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const handleCopy = async (text: string) => {
    const ok = await copyText(text);
    if (ok) {
      onCopied();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="wa-copy-menu">
      <button
        type="button"
        className={`wa-copy-menu-trigger${compact ? " is-compact" : ""}`}
        aria-label={t("calendar.copyActions")}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <MoreHorizontal size={16} strokeWidth={1.5} aria-hidden />
      </button>
      {open ? (
        <div
          className={`wa-copy-menu-panel${menuPlacement === "top" ? " is-above" : ""}`}
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="wa-copy-menu-item"
            onClick={(event) => {
              event.stopPropagation();
              void handleCopy(buildConfirmationMessage(appointment));
            }}
          >
            {t("calendar.copyConfirmation")}
          </button>
          <button
            type="button"
            role="menuitem"
            className="wa-copy-menu-item"
            onClick={(event) => {
              event.stopPropagation();
              void handleCopy(
                buildPaymentReceiptMessage(
                  appointment,
                  businessName,
                  appointment.payment_method
                )
              );
            }}
          >
            {t("calendar.copyPaymentReceipt")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
