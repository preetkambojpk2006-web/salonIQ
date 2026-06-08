import type { CashUpiSplit as CashUpiSplitData } from "@/lib/payments/types";

type CashUpiSplitProps = {
  split: CashUpiSplitData;
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

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function CashUpiSplit({ split }: CashUpiSplitProps) {
  const { cash, upi, total, cashPercent, upiPercent } = split;

  return (
    <section
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
        Aaj ka collection breakdown
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginTop: 14,
        }}
      >
        <article
          style={{
            borderRadius: 16,
            border: `1px solid ${TOKENS.accentGreen}`,
            background: TOKENS.accentGreenSoft,
            padding: "14px 16px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 600,
              color: TOKENS.textMuted,
            }}
          >
            Haath mein cash
          </p>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 22,
              fontWeight: 800,
              color: TOKENS.accentGreen,
              lineHeight: 1.2,
            }}
          >
            {formatInr(cash)}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              fontWeight: 700,
              color: TOKENS.textDark,
            }}
          >
            Cash
          </p>
        </article>

        <article
          style={{
            borderRadius: 16,
            border: `1px solid ${TOKENS.borderSubtle}`,
            background: TOKENS.accentBeige,
            padding: "14px 16px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 600,
              color: TOKENS.textMuted,
            }}
          >
            Digital payment
          </p>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 22,
              fontWeight: 800,
              color: TOKENS.textDark,
              lineHeight: 1.2,
            }}
          >
            {formatInr(upi)}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              fontWeight: 700,
              color: TOKENS.textDark,
            }}
          >
            UPI
          </p>
        </article>
      </div>

      <div style={{ marginTop: 14 }}>
        <div
          style={{
            display: "flex",
            height: 8,
            borderRadius: 999,
            overflow: "hidden",
            background: "#fff",
            border: `1px solid ${TOKENS.borderSubtle}`,
          }}
          aria-hidden
        >
          <span
            style={{
              width: `${cashPercent}%`,
              background: TOKENS.accentGreen,
              minWidth: total > 0 && cash > 0 ? 4 : 0,
            }}
          />
          <span
            style={{
              width: `${upiPercent}%`,
              background: TOKENS.accentBeige,
              minWidth: total > 0 && upi > 0 ? 4 : 0,
            }}
          />
        </div>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 12,
            color: TOKENS.textMuted,
          }}
        >
          Cash {cashPercent}% · UPI {upiPercent}%
        </p>
      </div>

      <p
        style={{
          margin: "14px 0 0",
          fontSize: 14,
          fontWeight: 700,
          color: TOKENS.textDark,
        }}
      >
        Kul collection: {formatInr(total)}
      </p>
    </section>
  );
}
