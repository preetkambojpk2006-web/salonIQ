"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import type { BrandSpendSummary, InventorySummary } from "@/lib/inventory/types";

type InventorySpendSummaryProps = {
  summary: InventorySummary;
  brandSpend: BrandSpendSummary[];
};

const TOKENS = {
  bgMain: "#EDE8DF",
  textDark: "#1A1A1A",
  textMuted: "#8A8A8A",
  borderSubtle: "#E0DAD0",
  accentBeige: "#E8D9C0",
  accentGreen: "#1FA873",
  accentGreenSoft: "#D4E8DD",
};

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function InventorySpendSummary({
  summary,
  brandSpend,
}: InventorySpendSummaryProps) {
  const { t } = useT();
  const hasPurchaseData =
    summary.month_purchase_total > 0 || brandSpend.length > 0;

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
        {t("money.inventorySpend")}
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
            border: `1px solid ${TOKENS.borderSubtle}`,
            background: "#fff",
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
            {t("inventory.monthPurchase")}
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
            {formatInr(summary.month_purchase_total)}
          </p>
        </article>

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
            {t("inventory.monthUsage")}
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
            {formatInr(summary.month_usage_total)}
          </p>
        </article>
      </div>

      <div style={{ marginTop: 16 }}>
        {hasPurchaseData ? (
          <div
            style={{
              overflowX: "auto",
              borderRadius: 12,
              border: `1px solid ${TOKENS.borderSubtle}`,
              background: "#fff",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${TOKENS.borderSubtle}`,
                    background: TOKENS.accentBeige,
                  }}
                >
                  <th
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontWeight: 700,
                      color: TOKENS.textDark,
                    }}
                  >
                    {t("inventory.brand")}
                  </th>
                  <th
                    style={{
                      padding: "10px 12px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: TOKENS.textDark,
                    }}
                  >
                    {t("inventory.totalSpend")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {brandSpend.map((row) => (
                  <tr
                    key={row.brand_id}
                    style={{ borderBottom: `1px solid ${TOKENS.borderSubtle}` }}
                  >
                    <td
                      style={{
                        padding: "10px 12px",
                        color: TOKENS.textDark,
                        fontWeight: 600,
                      }}
                    >
                      {row.brand_name}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontWeight: 700,
                        color: TOKENS.textDark,
                      }}
                    >
                      {formatInr(row.month_spend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: TOKENS.textMuted,
              fontWeight: 600,
            }}
          >
            {t("inventory.noPurchaseThisMonth")}
          </p>
        )}
      </div>
    </section>
  );
}
