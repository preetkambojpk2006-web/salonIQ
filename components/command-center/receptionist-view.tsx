"use client";

const workflowSteps = [
  { label: "Language", value: "Hinglish detected" },
  { label: "Intent", value: "Book appointment" },
  { label: "Entities", value: "Service: Haircut, Date: Tomorrow" },
  { label: "Availability", value: "2 free slots found" },
  {
    label: "Next action",
    value: "Ask customer to choose slot",
    highlight: true,
  },
];

export function ReceptionistView() {
  return (
    <div className="view-stack">
      <div className="receptionist-layout">
        <section className="panel chat-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">WhatsApp AI</p>
              <h2>Receptionist simulator</h2>
            </div>
            <span className="status-pill">
              <span className="pulse-dot pulse-dot-sm" aria-hidden />
              Online
            </span>
          </div>
          <div className="chat-window">
            <div className="message">
              Namaste. Main SALONIQ AI receptionist hoon. Booking, reschedule, price,
              reminder, payment sab handle kar sakta hoon.
              <small>SALONIQ AI</small>
            </div>
            <div className="message customer">
              kal haircut karwana hai
              <small>Customer</small>
            </div>
            <div className="message">
              Zaroor. Kal haircut ke liye 5:30 PM aur 6:15 PM available hai. Aap
              kaunsa slot book karna chahenge?
              <small>SALONIQ AI</small>
            </div>
          </div>
          <form className="chat-input-row" onSubmit={(e) => e.preventDefault()}>
            <input placeholder="Try: kal haircut karwana hai" readOnly />
            <button type="submit" className="primary-button">
              Send
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">AI brain</p>
              <h2>Detected workflow</h2>
            </div>
          </div>
          <div className="workflow-steps">
            {workflowSteps.map((step) => (
              <div key={step.label} className="workflow-step">
                <p className="eyebrow">{step.label}</p>
                <p className={step.highlight ? "workflow-step-action" : ""}>
                  {step.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
