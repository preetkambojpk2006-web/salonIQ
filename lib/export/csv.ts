/**
 * Escape a CSV cell value (quote-wrap when needed).
 */
function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Build a CSV string from headers and rows.
 */
export function buildCsvString(
  headers: string[],
  rows: (string | number | null)[][]
): string {
  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ];
  return lines.join("\r\n");
}

/**
 * Generate CSV and trigger a browser download (client-side only).
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null)[][]
): void {
  const csv = buildCsvString(headers, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
