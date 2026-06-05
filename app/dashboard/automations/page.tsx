import { automations } from "@/lib/command-center/mock-modules";

export default function AutomationsPage() {
  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Automation engine</p>
            <h2>Customer journeys</h2>
          </div>
          <button type="button" className="primary-button">
            Create automation
          </button>
        </div>
        <div className="automation-list stagger-list">
          {automations.map((automation) => (
            <article key={automation.name} className="automation-row">
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800 }}>{automation.name}</h3>
                <p>{automation.detail}</p>
                <p className="automation-stat">{automation.result}</p>
              </div>
              <button
                type="button"
                className="toggle"
                aria-label={`Toggle ${automation.name}`}
              >
                <span />
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
