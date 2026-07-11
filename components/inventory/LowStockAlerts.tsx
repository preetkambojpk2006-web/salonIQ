"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageContext";
import type { InventoryProductWithBrand } from "@/lib/inventory/types";

type LowStockAlertsProps = {
  lowStockProducts: InventoryProductWithBrand[];
};

function formatQty(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function LowStockAlerts({ lowStockProducts }: LowStockAlertsProps) {
  const { t } = useT();

  if (lowStockProducts.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        marginBottom: 8,
        padding: 16,
        borderRadius: 16,
        border: "1px solid #E8B4A0",
        background: "#FFF4EE",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: "#1A1A1A",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertTriangle size={16} strokeWidth={1.5} color="#D94F4F" aria-hidden />
          {t("inventory.lowStock")}
        </h2>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            background: "#D94F4F",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {lowStockProducts.length}
        </span>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {lowStockProducts.map((product) => (
          <div
            key={product.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #F0C9B8",
              background: "rgba(255, 255, 255, 0.65)",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1A1A1A",
                  lineHeight: 1.35,
                }}
              >
                {product.brand_name} · {product.name}
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#8A4B00",
                }}
              >
                {t("inventory.unitsLeft", {
                  qty: formatQty(product.current_quantity),
                  unit: product.unit_type,
                })}
              </p>
            </div>
            <span
              style={{
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 700,
                color: "#B42318",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <AlertTriangle size={16} strokeWidth={1.5} aria-hidden />
              {t("inventory.lowStockBadge")}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/dashboard/inventory"
        style={{
          display: "inline-block",
          marginTop: 12,
          fontSize: 13,
          fontWeight: 700,
          color: "#1FA873",
          textDecoration: "none",
        }}
      >
        {t("inventory.viewInventory")}
      </Link>
    </section>
  );
}
