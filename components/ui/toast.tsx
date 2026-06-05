"use client";

import { useEffect, useState } from "react";

type ToastProps = {
  message: string;
  show: boolean;
  onDismiss: () => void;
  durationMs?: number;
};

export function Toast({
  message,
  show,
  onDismiss,
  durationMs = 3000,
}: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!show) return;

    setExiting(false);
    const dismissTimer = setTimeout(() => setExiting(true), durationMs - 200);
    const removeTimer = setTimeout(onDismiss, durationMs);

    return () => {
      clearTimeout(dismissTimer);
      clearTimeout(removeTimer);
    };
  }, [show, durationMs, onDismiss]);

  if (!show) return null;

  return (
    <div
      role="status"
      className={`toast-success ${exiting ? "toast-exit" : ""}`}
      aria-live="polite"
    >
      {message}
    </div>
  );
}
