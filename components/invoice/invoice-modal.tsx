"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Printer, Receipt, X } from "lucide-react";
import type { Appointment } from "@/lib/appointments/types";
import {
  calculateInvoiceTotals,
  formatInr,
  formatInvoiceDateIst,
  invoiceNumberFromId,
} from "@/lib/invoice/gst-calculations";
import { fetchInvoiceContext } from "@/lib/invoice/queries";
import type { PaymentMethod } from "@/lib/payments/types";
import { useT } from "@/lib/i18n/LanguageContext";

type InvoiceModalProps = {
  appointment: Appointment;
  businessName: string;
  paymentMethod: PaymentMethod;
  onClose: () => void;
};

function paymentMethodLabel(
  method: PaymentMethod,
  t: (key: string) => string
): string {
  if (method === "cash") return t("payment.cash");
  if (method === "upi") return t("payment.upi");
  if (method === "card") return t("payment.card");
  if (method === "split") return `${t("payment.cash")} + ${t("payment.upi")}`;
  return t("payment.markPending");
}

export function InvoiceModal({
  appointment,
  businessName,
  paymentMethod,
  onClose,
}: InvoiceModalProps) {
  const { t } = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [branchName, setBranchName] = useState<string | null>(null);
  const [branchAddress, setBranchAddress] = useState<string | null>(
    appointment.branch_address
  );
  const [gstNumber, setGstNumber] = useState<string | null>(null);
  const [resolvedBusinessName, setResolvedBusinessName] = useState(businessName);

  const [gstSettings, setGstSettings] = useState({
    gst_enabled: false,
    gst_rate: 18,
    gst_inclusive: false,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { business, branch } = await fetchInvoiceContext(
        appointment.business_id,
        appointment.branch_id
      );

      if (cancelled) return;

      setResolvedBusinessName(business.businessName || businessName);
      setGstNumber(business.gstNumber);
      setGstSettings(business.gst);
      if (branch) {
        setBranchName(branch.name);
        setBranchAddress(branch.address ?? appointment.branch_address);
      }
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    appointment.branch_id,
    appointment.branch_address,
    appointment.business_id,
    businessName,
  ]);

  const invoiceNumber = useMemo(
    () => invoiceNumberFromId(appointment.id),
    [appointment.id]
  );

  const invoiceDate = useMemo(() => formatInvoiceDateIst(), []);

  const totals = useMemo(() => {
    const amount = appointment.total_amount > 0 ? appointment.total_amount : 0;
    const serviceName =
      appointment.service_name?.trim() || t("invoice.defaultService");
    return calculateInvoiceTotals(amount, serviceName, gstSettings);
  }, [appointment.service_name, appointment.total_amount, gstSettings, t]);

  const handleClose = useCallback(() => {
    if (downloading) return;
    dialogRef.current?.close();
    onClose();
  }, [downloading, onClose]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    const node = printRef.current;
    if (!node) return;

    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: "#F9F8F3",
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 32;
      const maxWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * maxWidth) / canvas.width;
      const finalHeight = Math.min(imgHeight, pageHeight - margin * 2);

      pdf.addImage(imgData, "PNG", margin, margin, maxWidth, finalHeight);
      pdf.save(`invoice-${invoiceNumber}.pdf`);
    } catch {
      // Silent fail — user can retry or use print
    } finally {
      setDownloading(false);
    }
  }, [invoiceNumber]);

  const halfRate = gstSettings.gst_rate / 2;

  return (
    <dialog ref={dialogRef} className="invoice-modal" onClose={onClose}>
      <div className="invoice-modal-form">
        <div className="invoice-modal-header invoice-no-print">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Receipt size={16} strokeWidth={1.5} aria-hidden />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
              {t("invoice.modalTitle")}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="payment-modal-close"
            aria-label={t("common.close")}
            disabled={downloading}
          >
            <X size={16} strokeWidth={1.5} aria-hidden />
          </button>
        </div>

        <div ref={printRef} id="invoice-print-area" className="invoice-sheet">
          <header className="invoice-header">
            <div>
              <h1 className="invoice-title">{t("invoice.taxInvoice")}</h1>
              <p className="invoice-business-name">{resolvedBusinessName}</p>
              {branchName ? (
                <p className="invoice-meta-line">{branchName}</p>
              ) : null}
              {branchAddress ? (
                <p className="invoice-meta-line">{branchAddress}</p>
              ) : null}
              {gstNumber ? (
                <p className="invoice-meta-line">
                  {t("invoice.gstin")}: {gstNumber}
                </p>
              ) : null}
            </div>
          </header>

          <div className="invoice-meta-grid">
            <div>
              <span className="invoice-label">{t("invoice.number")}</span>
              <strong>{invoiceNumber}</strong>
            </div>
            <div>
              <span className="invoice-label">{t("invoice.date")}</span>
              <strong>{invoiceDate}</strong>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <span className="invoice-label">{t("invoice.customer")}</span>
              <strong>
                {appointment.customer_name ?? t("invoice.defaultCustomer")}
              </strong>
            </div>
          </div>

          {loading ? (
            <p className="invoice-muted">{t("invoice.loading")}</p>
          ) : (
            <>
              <div className="invoice-table-wrap">
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>{t("invoice.service")}</th>
                      <th>{t("invoice.amount")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {totals.lineItems.map((item) => (
                      <tr key={item.name}>
                        <td>{item.name}</td>
                        <td>{formatInr(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="invoice-totals">
                {!totals.showTax ? (
                  <>
                    <div className="invoice-total-row">
                      <span>{t("invoice.subtotal")}</span>
                      <span>{formatInr(totals.subtotal)}</span>
                    </div>
                    <div className="invoice-total-row invoice-total-row-strong">
                      <span>{t("invoice.total")}</span>
                      <span>{formatInr(totals.total)}</span>
                    </div>
                  </>
                ) : totals.isInclusive ? (
                  <>
                    <div className="invoice-total-row">
                      <span>{t("invoice.taxableValue")}</span>
                      <span>{formatInr(totals.subtotal)}</span>
                    </div>
                    <div className="invoice-total-row">
                      <span>
                        {t("invoice.cgst")} ({halfRate}%)
                      </span>
                      <span>{formatInr(totals.cgst)}</span>
                    </div>
                    <div className="invoice-total-row">
                      <span>
                        {t("invoice.sgst")} ({halfRate}%)
                      </span>
                      <span>{formatInr(totals.sgst)}</span>
                    </div>
                    <div className="invoice-total-row invoice-total-row-strong">
                      <span>{t("invoice.total")}</span>
                      <span>{formatInr(totals.total)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="invoice-total-row">
                      <span>{t("invoice.subtotal")}</span>
                      <span>{formatInr(totals.subtotal)}</span>
                    </div>
                    <div className="invoice-total-row">
                      <span>
                        {t("invoice.cgst")} ({halfRate}%)
                      </span>
                      <span>{formatInr(totals.cgst)}</span>
                    </div>
                    <div className="invoice-total-row">
                      <span>
                        {t("invoice.sgst")} ({halfRate}%)
                      </span>
                      <span>{formatInr(totals.sgst)}</span>
                    </div>
                    <div className="invoice-total-row invoice-total-row-strong">
                      <span>{t("invoice.total")}</span>
                      <span>{formatInr(totals.total)}</span>
                    </div>
                  </>
                )}
              </div>

              <p className="invoice-payment-method">
                {t("invoice.paymentMethod")}:{" "}
                <strong>{paymentMethodLabel(paymentMethod, t)}</strong>
              </p>

              <p className="invoice-footer">{t("invoice.footer")}</p>
            </>
          )}
        </div>

        <div className="invoice-modal-actions invoice-no-print">
          <button
            type="button"
            className="invoice-btn-outline"
            onClick={handlePrint}
            disabled={loading || downloading}
          >
            <Printer size={16} strokeWidth={1.5} aria-hidden />
            {t("invoice.print")}
          </button>
          <button
            type="button"
            className="payment-btn-mint"
            onClick={() => void handleDownloadPdf()}
            disabled={loading || downloading}
            style={{ borderRadius: 10 }}
          >
            {downloading ? t("common.saving") : t("invoice.downloadPdf")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
