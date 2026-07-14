"use client";

import { Download } from "lucide-react";
import { exportToCsv } from "@/lib/export/csv";

type CsvDownloadButtonProps = {
  label: string;
  filename: string;
  headers: string[];
  rows: (string | number | null)[][];
};

const OUTLINE_BUTTON_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minHeight: 36,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid #E0DAD0",
  background: "#fff",
  color: "#1A1A1A",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export function CsvDownloadButton({
  label,
  filename,
  headers,
  rows,
}: CsvDownloadButtonProps) {
  return (
    <button
      type="button"
      onClick={() => exportToCsv(filename, headers, rows)}
      style={OUTLINE_BUTTON_STYLE}
    >
      <Download size={16} strokeWidth={1.5} aria-hidden />
      {label}
    </button>
  );
}
