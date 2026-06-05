"use client";

import type { Appointment } from "@/lib/appointments/types";
import {
  buildConfirmationMessage,
  buildPaymentReceiptMessage,
} from "@/lib/whatsapp/templates";

type WhatsAppCopyButtonsProps = {
  appointment: Appointment;
  businessName: string;
  onCopied: () => void;
  compact?: boolean;
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
}: WhatsAppCopyButtonsProps) {
  const handleCopy = async (text: string) => {
    const ok = await copyText(text);
    if (ok) onCopied();
  };

  return (
    <div className={`wa-copy-actions ${compact ? "is-compact" : ""}`}>
      <button
        type="button"
        className="wa-copy-btn"
        onClick={() => handleCopy(buildConfirmationMessage(appointment))}
      >
        Copy confirmation
      </button>
      <button
        type="button"
        className="wa-copy-btn"
        onClick={() =>
          handleCopy(
            buildPaymentReceiptMessage(
              appointment,
              businessName,
              appointment.payment_method
            )
          )
        }
      >
        Copy payment receipt
      </button>
    </div>
  );
}
