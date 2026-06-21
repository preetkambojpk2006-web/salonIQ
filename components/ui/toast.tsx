"use client";

import { useEffect, useState } from "react";

type ToastProps = {
  message: string;
  show: boolean;
  onDismiss: () => void;
  durationMs?: number;
  variant?: "success" | "error" | "warning";
  style?: React.CSSProperties;
};

export function Toast({
  message,
  show,
  onDismiss,
  durationMs = 3000,
  variant = "success",
  style,
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

  const className =
    variant === "error"
      ? `toast-error ${exiting ? "toast-exit" : ""}`
      : variant === "warning"
        ? `toast-warning ${exiting ? "toast-exit" : ""}`
        : `toast-success ${exiting ? "toast-exit" : ""}`;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={className}
      aria-live={variant === "error" ? "assertive" : "polite"}
      style={style}
    >
      {message}
    </div>
  );
}
