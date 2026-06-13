"use client";

import { useCallback, useState } from "react";
import { Toast } from "@/components/ui/toast";
import { buildWhatsAppLink } from "@/lib/whatsapp/sendLink";

type MessageActionsProps = {
  phone: string;
  message: string;
  copyLabel?: string;
  sendLabel?: string;
  onSend?: () => void;
  onCopy?: () => void;
};

const BTN_BASE =
  "flex-1 min-w-[9rem] min-h-[44px] rounded-[10px] px-4 py-2.5 text-sm font-bold transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-[0.98] motion-reduce:active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed";

export function MessageActions({
  phone,
  message,
  copyLabel = "Copy message",
  sendLabel = "Send on WhatsApp",
  onSend,
  onCopy,
}: MessageActionsProps) {
  const [copyToast, setCopyToast] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopyToast(true);
      onCopy?.();
    } catch {
      // Clipboard blocked — no toast (same as whatsapp-copy-buttons)
    }
  }, [message, onCopy]);

  const handleSend = useCallback(() => {
    window.open(buildWhatsAppLink(phone, message), "_blank", "noopener,noreferrer");
    onSend?.();
  }, [phone, message, onSend]);

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={handleCopy}
          className={`${BTN_BASE} border border-[#E0DAD0] bg-white text-[#1A1A1A] hover:bg-[#EDE8DF]`}
        >
          {copyLabel}
        </button>
        <button
          type="button"
          onClick={handleSend}
          className={`${BTN_BASE} border-0 bg-[#1FA873] text-white hover:brightness-105`}
        >
          {sendLabel}
        </button>
      </div>

      <Toast
        message="Message copied! ✅"
        show={copyToast}
        onDismiss={() => setCopyToast(false)}
      />
    </>
  );
}
