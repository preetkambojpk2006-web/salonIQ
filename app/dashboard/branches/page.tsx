import { branches } from "@/lib/command-center/mock-modules";

const tagClass: Record<string, string> = {
  mint: "tag green",
  amber: "tag orange",
  blue: "tag",
  coral: "tag orange",
};

export default function BranchesPage() {
  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Multi-branch command</p>
            <h2>Branch comparison</h2>
          </div>
        </div>
        <div className="branch-grid stagger-list">
          {branches.map((branch) => (
            <article key={branch.name} className="branch-card">
              <span className={tagClass[branch.tone] ?? "tag"}>
                {branch.highlight}
              </span>
              <p style={{ marginTop: 10, fontWeight: 800, fontSize: 15 }}>
                {branch.name}
              </p>
              <strong>{branch.revenue}</strong>
              <p>
                {branch.bookings} bookings · {branch.retention} retention
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
