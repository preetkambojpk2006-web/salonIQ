import { whatsappBrief } from "@/lib/command-center/mock-today";

export function OwnerWhatsappBrief() {
  return (
    <div className="owner-brief">
      <p className="eyebrow">Owner WhatsApp brief</p>
      <p className="owner-brief-summary">
        Today: {whatsappBrief.revenue} revenue, {whatsappBrief.customers} customers,{" "}
        {whatsappBrief.whatsappShare} bookings from WhatsApp.
      </p>
      <div className="brief-signal" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
      <button type="button" className="ghost-button">
        Send report
      </button>
    </div>
  );
}
