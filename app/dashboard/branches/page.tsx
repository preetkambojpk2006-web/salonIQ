import { EmptyState } from "@/components/ui/empty-state";
import { getOwnerBranches, getOwnerBusiness } from "@/lib/onboarding/queries";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const business = await getOwnerBusiness();

  if (!business) {
    return (
      <div className="view-stack">
        <section className="panel">
          <EmptyState
            icon="calendar"
            title="Salon setup incomplete"
            description="Pehle onboarding complete karein — phir branches yahan dikhengi."
            actionLabel="Onboarding kholo"
            actionHref="/onboarding"
          />
        </section>
      </div>
    );
  }

  const branches = await getOwnerBranches(business.id);

  if (branches.length === 0) {
    return (
      <div className="view-stack">
        <section className="panel">
          <EmptyState
            icon="calendar"
            title="Abhi koi branch nahi hai"
            description="Settings se salon details update karein. Nayi branch add karne ke liye hum jald option denge."
            actionLabel="Settings kholo"
            actionHref="/dashboard/settings"
          />
        </section>
      </div>
    );
  }

  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Branches</p>
            <h2>Aapke branches</h2>
          </div>
        </div>
        <div className="branch-grid stagger-list">
          {branches.map((branch) => (
            <article key={branch.id} className="branch-card">
              <span className="tag green">Active</span>
              <p style={{ marginTop: 10, fontWeight: 800, fontSize: 15 }}>
                {branch.name}
              </p>
              {branch.address ? (
                <p className="text-body" style={{ marginTop: 6, fontSize: 14 }}>
                  {branch.address}
                </p>
              ) : null}
              {branch.phone ? (
                <p className="text-body" style={{ marginTop: 4, fontSize: 14 }}>
                  {branch.phone}
                </p>
              ) : null}
            </article>
          ))}
        </div>
        <p className="text-body" style={{ marginTop: 16, fontSize: 14 }}>
          Salon naam ya contact details badalne ke liye{" "}
          <Link href="/dashboard/settings" style={{ color: "#1FA873", fontWeight: 700 }}>
            Settings
          </Link>{" "}
          kholo.
        </p>
      </section>
    </div>
  );
}
