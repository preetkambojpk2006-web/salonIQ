import { whatsappReportPreview } from "@/lib/command-center/mock-today";

export function WhatsappReport() {
  return (
    <section className="card desktop:grid desktop:grid-cols-[1fr_auto] desktop:items-center desktop:gap-8">
      <div>
        <h2 className="heading-section">WhatsApp owner report</h2>
        <p className="text-body mt-2">
          Daily summary auto-sent to owner at 9 PM — preview below.
        </p>
        <button type="button" className="btn-dark mt-6">
          Send offer to inactive customers
        </button>
      </div>

      <div className="mx-auto mt-6 w-full max-w-[280px] desktop:mt-0">
        <div className="rounded-[2rem] border-[6px] border-hero-bg bg-hero-bg p-2 shadow-os">
          <div className="rounded-[1.4rem] bg-[#e5ddd5] p-3">
            <div className="rounded-2xl rounded-tl-sm bg-card-bg p-3 shadow-sm">
              <pre className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-ink">
                {whatsappReportPreview}
              </pre>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted">9:04 PM ✓✓</p>
          </div>
        </div>
      </div>
    </section>
  );
}
