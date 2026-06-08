const advisorCards = [
  {
    tag: "Send offer",
    tagClass: "tag orange",
    title: "Thursday afternoons are weak",
    body: "12 inactive customers match this offer. One tap se WhatsApp blast ready hai.",
  },
  {
    tag: "High demand",
    tagClass: "tag green",
    title: "Hair Spa demand is rising",
    body: "Bookings up 18% this week. Consider adding one extra slot on Saturday.",
  },
];

export function AiAdvisor() {
  return (
    <section className="panel advisor-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">AI advisor</p>
          <h2>Aaj kya important hai</h2>
        </div>
      </div>
      <div className="insight-stack stagger-list">
        {advisorCards.map((card) => (
          <article key={card.title} className="insight-card">
            <span className={card.tagClass}>{card.tag}</span>
            <p>
              <strong>{card.title}</strong>
            </p>
            <p>{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
