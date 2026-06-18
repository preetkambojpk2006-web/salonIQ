export type GstSettings = {
  gst_enabled: boolean;
  gst_rate: number;
  gst_inclusive: boolean;
};

export type InvoiceLineItem = {
  name: string;
  amount: number;
};

export type InvoiceTotals = {
  lineItems: InvoiceLineItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  tax: number;
  total: number;
  showTax: boolean;
  isInclusive: boolean;
};

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function invoiceNumberFromId(id: string): string {
  return id.replace(/-/g, "").slice(-8).toUpperCase();
}

export function formatInvoiceDateIst(date = new Date()): string {
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function calculateInvoiceTotals(
  amount: number,
  serviceName: string,
  gst: GstSettings
): InvoiceTotals {
  const lineItems = [{ name: serviceName, amount: roundCurrency(amount) }];

  if (!gst.gst_enabled) {
    const total = roundCurrency(amount);
    return {
      lineItems,
      subtotal: total,
      cgst: 0,
      sgst: 0,
      tax: 0,
      total,
      showTax: false,
      isInclusive: false,
    };
  }

  const rate = gst.gst_rate / 100;

  if (gst.gst_inclusive) {
    const base = roundCurrency(amount / (1 + rate));
    const tax = roundCurrency(amount - base);
    const cgst = roundCurrency(tax / 2);
    const sgst = roundCurrency(tax - cgst);

    return {
      lineItems,
      subtotal: base,
      cgst,
      sgst,
      tax,
      total: roundCurrency(amount),
      showTax: true,
      isInclusive: true,
    };
  }

  const subtotal = roundCurrency(amount);
  const tax = roundCurrency(subtotal * rate);
  const cgst = roundCurrency(tax / 2);
  const sgst = roundCurrency(tax - cgst);

  return {
    lineItems,
    subtotal,
    cgst,
    sgst,
    tax,
    total: roundCurrency(subtotal + tax),
    showTax: true,
    isInclusive: false,
  };
}
