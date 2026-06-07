import type { StaffLeaderboardEntry } from "@/lib/staff/leaderboard";

type LeaderboardCardProps = {
  entries: StaffLeaderboardEntry[];
};

const TOKENS = {
  bgMain: "#EDE8DF",
  textDark: "#1A1A1A",
  textMuted: "#8A8A8A",
  borderSubtle: "#E0DAD0",
  accentGreen: "#1FA873",
  accentGreenSoft: "#D4E8DD",
  accentBeige: "#E8D9C0",
};

function formatRs(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const RANK_STYLES: Record<
  number,
  { accent: string; nameWeight: number; fontSize: number }
> = {
  1: { accent: "#C9A96E", nameWeight: 800, fontSize: 15 },
  2: { accent: "#A8A8A8", nameWeight: 700, fontSize: 14 },
  3: { accent: "#B8860B", nameWeight: 700, fontSize: 14 },
};

function rankMedal(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}.`;
}

export function LeaderboardCard({ entries }: LeaderboardCardProps) {
  return (
    <article
      style={{
        borderRadius: 16,
        border: `1px solid ${TOKENS.borderSubtle}`,
        background: TOKENS.bgMain,
        padding: 18,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 700,
          color: TOKENS.textDark,
        }}
      >
        ⭐ Star of the Month
      </p>
      <p
        style={{
          margin: "6px 0 0",
          fontSize: 13,
          color: TOKENS.textMuted,
        }}
      >
        Is mahine ki top staff — paid revenue ke hisaab se
      </p>

      {entries.length === 0 ? (
        <p
          style={{
            margin: "14px 0 0",
            fontSize: 14,
            color: TOKENS.textMuted,
          }}
        >
          Abhi data kam hai, baad mein dekhein
        </p>
      ) : (
        <ul
          style={{
            margin: "14px 0 0",
            padding: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {entries.map((entry) => {
            const isTopThree = entry.rank <= 3;
            const style = RANK_STYLES[entry.rank];

            return (
              <li
                key={`${entry.rank}-${entry.staffName}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: isTopThree ? "10px 12px" : "4px 0",
                  borderRadius: isTopThree ? 12 : 0,
                  background: isTopThree ? "#fff" : "transparent",
                  border: isTopThree
                    ? `1px solid ${TOKENS.borderSubtle}`
                    : "none",
                  borderLeft: isTopThree
                    ? `3px solid ${style?.accent ?? TOKENS.borderSubtle}`
                    : undefined,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: isTopThree ? style?.fontSize ?? 14 : 13,
                      fontWeight: isTopThree ? style?.nameWeight ?? 600 : 600,
                      color: TOKENS.textDark,
                    }}
                  >
                    <span style={{ marginRight: 6 }}>{rankMedal(entry.rank)}</span>
                    {entry.staffName}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: isTopThree ? 13 : 12,
                      color: TOKENS.textMuted,
                    }}
                  >
                    {entry.appointmentCount} appointment
                    {entry.appointmentCount === 1 ? "" : "s"}
                  </p>
                </div>
                <strong
                  style={{
                    flexShrink: 0,
                    fontSize: isTopThree ? 15 : 13,
                    fontWeight: isTopThree ? 800 : 600,
                    color: isTopThree ? TOKENS.accentGreen : TOKENS.textDark,
                  }}
                >
                  {formatRs(entry.totalRevenue)}
                </strong>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
