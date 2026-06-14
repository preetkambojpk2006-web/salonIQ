"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Toast } from "@/components/ui/toast";
import {
  createBrand,
  createProduct,
  stockIn,
  stockUse,
  toggleBrandActive,
  toggleProductActive,
  updateProduct,
} from "@/lib/inventory/actions";
import type {
  BrandSpendSummary,
  InventoryBrand,
  InventoryProductWithBrand,
  InventorySummary,
  InventoryTransactionWithDetails,
} from "@/lib/inventory/types";
import { useT } from "@/lib/i18n/LanguageContext";

type InventoryViewProps = {
  brands: InventoryBrand[];
  products: InventoryProductWithBrand[];
  summary: InventorySummary;
  brandSpend: BrandSpendSummary[];
  transactions: InventoryTransactionWithDetails[];
  spendYear: number;
  spendMonth: number;
  spendMonthLabel: string;
  todayIso: string;
};

type TabId = "stock" | "kharcha" | "history";

type ModalKind = "stockIn" | "stockUse" | null;

const TOKENS = {
  bgMain: "#EDE8DF",
  textDark: "#1A1A1A",
  textMuted: "#8A8A8A",
  borderSubtle: "#E0DAD0",
  accentGreen: "#1FA873",
  accentOrange: "#E07A2F",
  accentCoral: "#D94F4F",
  neutralBg: "#F5F2EC",
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  padding: "0 12px",
  borderRadius: 10,
  border: `1px solid ${TOKENS.borderSubtle}`,
  fontSize: 14,
  color: TOKENS.textDark,
  background: "#fff",
};

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatQty(amount: number): string {
  return amount.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function formatTxnDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00+05:30`);
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function ModalOverlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "grid",
        placeItems: "center",
        padding: 16,
        background: "rgba(26, 26, 26, 0.45)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(100%, 420px)",
          borderRadius: 16,
          border: `1px solid ${TOKENS.borderSubtle}`,
          background: "#fff",
          padding: 18,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TOKENS.textDark }}>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 0,
              background: "transparent",
              fontSize: 20,
              cursor: "pointer",
              color: TOKENS.textMuted,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SummaryCards({ summary }: { summary: InventorySummary }) {
  const cards = [
    {
      key: "value",
      label: "Total Stock Value",
      value: formatInr(summary.total_stock_value),
      color: TOKENS.textDark,
    },
    {
      key: "purchase",
      label: "Is Mahine Purchase",
      value: formatInr(summary.month_purchase_total),
      color: TOKENS.accentGreen,
    },
    {
      key: "usage",
      label: "Is Mahine Usage",
      value: formatInr(summary.month_usage_total),
      color: TOKENS.accentOrange,
    },
    {
      key: "low",
      label: "Low Stock Items",
      value: String(summary.low_stock_count),
      color: summary.low_stock_count > 0 ? TOKENS.accentCoral : TOKENS.textDark,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 10,
      }}
    >
      {cards.map((card) => (
        <article
          key={card.key}
          style={{
            padding: "14px 16px",
            borderRadius: 16,
            border: `1px solid ${TOKENS.borderSubtle}`,
            background: "#fff",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: TOKENS.textMuted, fontWeight: 600 }}>
            {card.label}
          </p>
          <strong
            style={{
              display: "block",
              marginTop: 6,
              fontSize: 20,
              color: card.color,
            }}
          >
            {card.value}
          </strong>
        </article>
      ))}
    </div>
  );
}

function StockModal({
  kind,
  product,
  products,
  todayIso,
  onClose,
  onSuccess,
  onError,
}: {
  kind: "stockIn" | "stockUse";
  product: InventoryProductWithBrand | null;
  products: InventoryProductWithBrand[];
  todayIso: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const { t } = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const activeProducts = products.filter((item) => item.is_active);
  const [productId, setProductId] = useState(product?.id ?? activeProducts[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [txnDate, setTxnDate] = useState(todayIso);
  const [notes, setNotes] = useState("");

  const selected = activeProducts.find((item) => item.id === productId);

  const handleSubmit = () => {
    const formData = new FormData();
    formData.set("product_id", productId);
    formData.set("quantity", quantity);
    formData.set("txn_date", txnDate);
    formData.set("notes", notes);
    if (kind === "stockIn") {
      formData.set("unit_cost", unitCost);
    }

    startTransition(async () => {
      const result = kind === "stockIn" ? await stockIn(formData) : await stockUse(formData);
      if (!result.ok) {
        onError(result.error);
        return;
      }
      onSuccess(kind === "stockIn" ? "Stock add ho gaya ✓" : "Use record ho gaya ✓");
      router.refresh();
      onClose();
    });
  };

  return (
    <ModalOverlay
      title={kind === "stockIn" ? t("inventory.stockIn") : t("inventory.stockUse")}
      onClose={onClose}
    >
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: TOKENS.textDark }}>
            Product
          </label>
          <select
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            style={{ ...fieldStyle, marginTop: 6 }}
          >
            {activeProducts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.brand_name} — {item.name} ({formatQty(item.current_quantity)}{" "}
                {item.unit_type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: TOKENS.textDark }}>
            Quantity
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder={selected ? selected.unit_type : "Qty"}
            style={{ ...fieldStyle, marginTop: 6 }}
          />
        </div>

        {kind === "stockIn" ? (
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: TOKENS.textDark }}>
              Price per unit (₹)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={unitCost}
              onChange={(event) => setUnitCost(event.target.value)}
              placeholder="e.g. 450"
              style={{ ...fieldStyle, marginTop: 6 }}
            />
          </div>
        ) : null}

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: TOKENS.textDark }}>
            Date
          </label>
          <input
            type="date"
            value={txnDate}
            onChange={(event) => setTxnDate(event.target.value)}
            style={{ ...fieldStyle, marginTop: 6 }}
          />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: TOKENS.textDark }}>
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            style={{ ...fieldStyle, marginTop: 6, paddingTop: 10, resize: "vertical" }}
          />
        </div>

        <button
          type="button"
          disabled={isPending || !productId}
          onClick={handleSubmit}
          style={{
            minHeight: 44,
            borderRadius: 12,
            border: 0,
            background: kind === "stockIn" ? TOKENS.accentGreen : TOKENS.accentOrange,
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: isPending ? "wait" : "pointer",
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending
            ? "Saving…"
            : kind === "stockIn"
              ? t("inventory.stockAdd")
              : "Use record karo"}
        </button>
      </div>
    </ModalOverlay>
  );
}

function ProductRow({
  product,
  onStockIn,
  onStockUse,
  onError,
  onSuccess,
}: {
  product: InventoryProductWithBrand;
  onStockIn: (product: InventoryProductWithBrand) => void;
  onStockUse: (product: InventoryProductWithBrand) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}) {
  const { t } = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [unitType, setUnitType] = useState(product.unit_type);
  const [minQuantity, setMinQuantity] = useState(String(product.min_quantity));

  const isLowStock =
    product.is_active &&
    product.min_quantity > 0 &&
    product.current_quantity <= product.min_quantity;
  const stockValue = product.current_quantity * product.avg_unit_cost;

  const handleToggle = (isActive: boolean) => {
    const formData = new FormData();
    formData.set("product_id", product.id);
    formData.set("is_active", isActive ? "true" : "false");

    startTransition(async () => {
      const result = await toggleProductActive(formData);
      if (!result.ok) {
        onError(result.error);
        return;
      }
      onSuccess(isActive ? "Product active ✓" : "Product inactive ✓");
      router.refresh();
    });
  };

  const handleSave = () => {
    const formData = new FormData();
    formData.set("product_id", product.id);
    formData.set("name", name);
    formData.set("unit_type", unitType);
    formData.set("min_quantity", minQuantity);

    startTransition(async () => {
      const result = await updateProduct(formData);
      if (!result.ok) {
        onError(result.error);
        return;
      }
      onSuccess("Product update ho gaya ✓");
      setEditing(false);
      router.refresh();
    });
  };

  return (
    <article
      style={{
        padding: "12px 14px",
        borderRadius: 16,
        border: `1px solid ${isLowStock ? TOKENS.accentCoral : TOKENS.borderSubtle}`,
        background: isLowStock ? "#FDEEEE" : "#fff",
        opacity: product.is_active ? 1 : 0.65,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <div style={{ minWidth: 0, flex: "1 1 220px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TOKENS.textDark }}>
              {product.name}
            </p>
            {isLowStock ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: TOKENS.accentCoral,
                  background: "#fff",
                  border: `1px solid ${TOKENS.accentCoral}`,
                  borderRadius: 999,
                  padding: "2px 8px",
                }}
              >
                ⚠️ Kam stock
              </span>
            ) : null}
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: TOKENS.textMuted }}>
            {product.unit_type} · Stock: {formatQty(product.current_quantity)} · Min:{" "}
            {formatQty(product.min_quantity)} · Avg: {formatInr(product.avg_unit_cost)} ·
            Value: {formatInr(stockValue)}
          </p>
        </div>

        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: product.is_active ? TOKENS.accentGreen : TOKENS.textMuted,
          }}
        >
          <input
            type="checkbox"
            checked={product.is_active}
            disabled={isPending}
            onChange={(event) => handleToggle(event.target.checked)}
            style={{ accentColor: TOKENS.accentGreen }}
          />
          {product.is_active ? t("common.active") : t("common.inactive")}
        </label>
      </div>

      {editing ? (
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            style={fieldStyle}
          />
          <input
            value={unitType}
            onChange={(event) => setUnitType(event.target.value)}
            style={fieldStyle}
          />
          <input
            type="number"
            min={0}
            value={minQuantity}
            onChange={(event) => setMinQuantity(event.target.value)}
            style={fieldStyle}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              style={{
                minHeight: 36,
                padding: "0 12px",
                borderRadius: 10,
                border: 0,
                background: TOKENS.accentGreen,
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              style={{
                minHeight: 36,
                padding: "0 12px",
                borderRadius: 10,
                border: `1px solid ${TOKENS.borderSubtle}`,
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          <button
            type="button"
            disabled={!product.is_active}
            onClick={() => onStockIn(product)}
            style={{
              minHeight: 36,
              padding: "0 12px",
              borderRadius: 10,
              border: 0,
              background: TOKENS.accentGreen,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: product.is_active ? "pointer" : "not-allowed",
              opacity: product.is_active ? 1 : 0.5,
            }}
          >
            {t("inventory.stockIn")}
          </button>
          <button
            type="button"
            disabled={!product.is_active}
            onClick={() => onStockUse(product)}
            style={{
              minHeight: 36,
              padding: "0 12px",
              borderRadius: 10,
              border: 0,
              background: TOKENS.accentOrange,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: product.is_active ? "pointer" : "not-allowed",
              opacity: product.is_active ? 1 : 0.5,
            }}
          >
            Use
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            style={{
              minHeight: 36,
              padding: "0 12px",
              borderRadius: 10,
              border: `1px solid ${TOKENS.borderSubtle}`,
              background: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Edit
          </button>
        </div>
      )}
    </article>
  );
}

export function InventoryView({
  brands,
  products,
  summary,
  brandSpend,
  transactions,
  spendYear,
  spendMonth,
  spendMonthLabel,
  todayIso,
}: InventoryViewProps) {
  const { t } = useT();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("stock");
  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [modalProduct, setModalProduct] = useState<InventoryProductWithBrand | null>(null);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [addProductBrandId, setAddProductBrandId] = useState<string | null>(null);
  const [newProductName, setNewProductName] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("bottle");
  const [newProductMin, setNewProductMin] = useState("5");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "success" });

  const showToast = (message: string, variant: "success" | "error") => {
    setToast({ show: true, message, variant });
  };

  const productsByBrand = useMemo(() => {
    const map = new Map<string, InventoryProductWithBrand[]>();
    for (const product of products) {
      const list = map.get(product.brand_id) ?? [];
      list.push(product);
      map.set(product.brand_id, list);
    }
    return map;
  }, [products]);

  const brandSections = useMemo(() => {
    const brandMap = new Map(brands.map((brand) => [brand.id, brand]));
    const orderedIds = [
      ...brands.map((brand) => brand.id),
      ...products
        .map((product) => product.brand_id)
        .filter((id) => !brandMap.has(id)),
    ];

    const uniqueIds = Array.from(new Set(orderedIds));

    return uniqueIds.map((brandId) => {
      const brand = brandMap.get(brandId);
      const brandProducts = productsByBrand.get(brandId) ?? [];
      return {
        brandId,
        brandName: brand?.name ?? brandProducts[0]?.brand_name ?? "Unknown",
        isActive: brand?.is_active ?? true,
        products: brandProducts,
      };
    });
  }, [brands, products, productsByBrand]);

  const totalBrandSpend = brandSpend.reduce(
    (sum, row) => sum + row.month_spend,
    0
  );

  const openStockIn = (product: InventoryProductWithBrand | null = null) => {
    setModalProduct(product);
    setModalKind("stockIn");
  };

  const openStockUse = (product: InventoryProductWithBrand | null = null) => {
    setModalProduct(product);
    setModalKind("stockUse");
  };

  const handleCreateBrand = () => {
    const formData = new FormData();
    formData.set("name", newBrandName);

    startTransition(async () => {
      const result = await createBrand(formData);
      if (!result.ok) {
        showToast(result.error, "error");
        return;
      }
      showToast("Brand add ho gayi ✓", "success");
      setNewBrandName("");
      setShowAddBrand(false);
      router.refresh();
    });
  };

  const handleCreateProduct = (brandId: string) => {
    const formData = new FormData();
    formData.set("brand_id", brandId);
    formData.set("name", newProductName);
    formData.set("unit_type", newProductUnit);
    formData.set("min_quantity", newProductMin);

    startTransition(async () => {
      const result = await createProduct(formData);
      if (!result.ok) {
        showToast(result.error, "error");
        return;
      }
      showToast("Product add ho gaya ✓", "success");
      setAddProductBrandId(null);
      setNewProductName("");
      setNewProductUnit("bottle");
      setNewProductMin("5");
      router.refresh();
    });
  };

  const handleToggleBrand = (brandId: string, isActive: boolean) => {
    const formData = new FormData();
    formData.set("brand_id", brandId);
    formData.set("is_active", isActive ? "true" : "false");

    startTransition(async () => {
      const result = await toggleBrandActive(formData);
      if (!result.ok) {
        showToast(result.error, "error");
        return;
      }
      showToast(isActive ? "Brand active ✓" : "Brand inactive ✓", "success");
      router.refresh();
    });
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: 4,
          borderRadius: 16,
          border: `1px solid ${TOKENS.borderSubtle}`,
          background: "#fff",
        }}
      >
        {(
          [
            { id: "stock" as const, label: "Stock" },
            { id: "kharcha" as const, label: "Kharcha" },
            { id: "history" as const, label: "History" },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 12,
              border: 0,
              background: tab === id ? TOKENS.accentGreen : "transparent",
              color: tab === id ? "#fff" : TOKENS.textDark,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "stock" ? (
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
              fontSize: 12,
              fontWeight: 600,
              color: TOKENS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Inventory
          </p>
          <h2
            style={{
              margin: "4px 0 14px",
              fontSize: 18,
              fontWeight: 800,
              color: TOKENS.textDark,
            }}
          >
            Stock overview
          </h2>

          <SummaryCards summary={summary} />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 14,
            }}
          >
            <button
              type="button"
              onClick={() => setShowAddBrand((value) => !value)}
              style={{
                minHeight: 40,
                padding: "0 14px",
                borderRadius: 12,
                border: 0,
                background: TOKENS.accentGreen,
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t("inventory.addBrand")}
            </button>
            <button
              type="button"
              onClick={() => openStockIn(null)}
              style={{
                minHeight: 40,
                padding: "0 14px",
                borderRadius: 12,
                border: `1px solid ${TOKENS.borderSubtle}`,
                background: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t("inventory.stockIn")}
            </button>
            <button
              type="button"
              onClick={() => openStockUse(null)}
              style={{
                minHeight: 40,
                padding: "0 14px",
                borderRadius: 12,
                border: `1px solid ${TOKENS.borderSubtle}`,
                background: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t("inventory.stockUse")}
            </button>
          </div>

          {showAddBrand ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 12,
              }}
            >
              <input
                value={newBrandName}
                onChange={(event) => setNewBrandName(event.target.value)}
                placeholder="Brand name (e.g. Loreal)"
                style={{ ...fieldStyle, flex: "1 1 200px" }}
              />
              <button
                type="button"
                disabled={isPending}
                onClick={handleCreateBrand}
                style={{
                  minHeight: 44,
                  padding: "0 14px",
                  borderRadius: 10,
                  border: 0,
                  background: TOKENS.accentGreen,
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Save brand
              </button>
            </div>
          ) : null}

          {brandSections.length === 0 ? (
            <p
              style={{
                margin: "14px 0 0",
                fontSize: 14,
                color: TOKENS.textMuted,
                lineHeight: 1.45,
              }}
            >
              {t("inventory.noProduct")}
            </p>
          ) : (
            <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
              {brandSections.map((section) => {
                const brandRecord = brands.find((brand) => brand.id === section.brandId);

                return (
                  <div
                    key={section.brandId}
                    style={{
                      borderRadius: 16,
                      border: `1px solid ${TOKENS.borderSubtle}`,
                      background: "#fff",
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 16,
                            fontWeight: 800,
                            color: TOKENS.textDark,
                          }}
                        >
                          {section.brandName}
                        </h3>
                        {!section.isActive ? (
                          <span style={{ fontSize: 12, color: TOKENS.textMuted }}>
                            Inactive brand
                          </span>
                        ) : null}
                      </div>

                      {brandRecord ? (
                        <label
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            color: brandRecord.is_active
                              ? TOKENS.accentGreen
                              : TOKENS.textMuted,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={brandRecord.is_active}
                            disabled={isPending}
                            onChange={(event) =>
                              handleToggleBrand(section.brandId, event.target.checked)
                            }
                            style={{ accentColor: TOKENS.accentGreen }}
                          />
                          Active
                        </label>
                      ) : null}
                    </div>

                    <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                      {section.products.length === 0 ? (
                        <p style={{ margin: 0, fontSize: 13, color: TOKENS.textMuted }}>
                          Is brand ke liye abhi koi product nahi.
                        </p>
                      ) : (
                        section.products.map((product) => (
                          <ProductRow
                            key={product.id}
                            product={product}
                            onStockIn={openStockIn}
                            onStockUse={openStockUse}
                            onError={(message) => showToast(message, "error")}
                            onSuccess={(message) => showToast(message, "success")}
                          />
                        ))
                      )}
                    </div>

                    {addProductBrandId === section.brandId ? (
                      <div
                        style={{
                          display: "grid",
                          gap: 8,
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: `1px solid ${TOKENS.borderSubtle}`,
                        }}
                      >
                        <input
                          value={newProductName}
                          onChange={(event) => setNewProductName(event.target.value)}
                          placeholder="Product name"
                          style={fieldStyle}
                        />
                        <input
                          value={newProductUnit}
                          onChange={(event) => setNewProductUnit(event.target.value)}
                          placeholder="Unit type (bottle, tube, gram...)"
                          style={fieldStyle}
                        />
                        <input
                          type="number"
                          min={0}
                          value={newProductMin}
                          onChange={(event) => setNewProductMin(event.target.value)}
                          placeholder="Min quantity"
                          style={fieldStyle}
                        />
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleCreateProduct(section.brandId)}
                            style={{
                              minHeight: 36,
                              padding: "0 12px",
                              borderRadius: 10,
                              border: 0,
                              background: TOKENS.accentGreen,
                              color: "#fff",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Save product
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddProductBrandId(null)}
                            style={{
                              minHeight: 36,
                              padding: "0 12px",
                              borderRadius: 10,
                              border: `1px solid ${TOKENS.borderSubtle}`,
                              background: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddProductBrandId(section.brandId)}
                        style={{
                          marginTop: 12,
                          minHeight: 36,
                          padding: "0 12px",
                          borderRadius: 10,
                          border: `1px solid ${TOKENS.borderSubtle}`,
                          background: TOKENS.neutralBg,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {t("inventory.addProduct")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {tab === "kharcha" ? (
        <section
          style={{
            borderRadius: 16,
            border: `1px solid ${TOKENS.borderSubtle}`,
            background: TOKENS.bgMain,
            padding: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: TOKENS.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Brand spend
              </p>
              <h2
                style={{
                  margin: "4px 0 0",
                  fontSize: 18,
                  fontWeight: 800,
                  color: TOKENS.textDark,
                }}
              >
                {spendMonthLabel}
              </h2>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Link
                href={`/dashboard/inventory?year=${shiftMonth(spendYear, spendMonth, -1).year}&month=${shiftMonth(spendYear, spendMonth, -1).month}`}
                style={{
                  minHeight: 36,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: `1px solid ${TOKENS.borderSubtle}`,
                  background: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  textDecoration: "none",
                  color: TOKENS.textDark,
                  fontWeight: 600,
                }}
              >
                ← Prev
              </Link>
              <Link
                href={`/dashboard/inventory?year=${shiftMonth(spendYear, spendMonth, 1).year}&month=${shiftMonth(spendYear, spendMonth, 1).month}`}
                style={{
                  minHeight: 36,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: `1px solid ${TOKENS.borderSubtle}`,
                  background: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  textDecoration: "none",
                  color: TOKENS.textDark,
                  fontWeight: 600,
                }}
              >
                Next →
              </Link>
            </div>
          </div>

          {brandSpend.length === 0 ? (
            <p style={{ margin: "14px 0 0", fontSize: 14, color: TOKENS.textMuted }}>
              Is mahine abhi koi purchase record nahi hai.
            </p>
          ) : (
            <div
              style={{
                marginTop: 14,
                overflowX: "auto",
                borderRadius: 16,
                border: `1px solid ${TOKENS.borderSubtle}`,
                background: "#fff",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: 520,
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: `1px solid ${TOKENS.borderSubtle}` }}>
                    {["Brand", "Purchases", "Total Spend", "Avg per purchase"].map(
                      (heading) => (
                        <th
                          key={heading}
                          style={{
                            padding: "12px 14px",
                            textAlign: heading === "Brand" ? "left" : "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: TOKENS.textMuted,
                            textTransform: "uppercase",
                          }}
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {brandSpend.map((row) => (
                    <tr
                      key={row.brand_id}
                      style={{ borderBottom: `1px solid ${TOKENS.borderSubtle}` }}
                    >
                      <td style={{ padding: "12px 14px", fontWeight: 700 }}>
                        {row.brand_name}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        {row.purchase_count}
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          textAlign: "center",
                          color: TOKENS.accentGreen,
                          fontWeight: 700,
                        }}
                      >
                        {formatInr(row.month_spend)}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        {row.purchase_count > 0
                          ? formatInr(row.month_spend / row.purchase_count)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: `1px solid ${TOKENS.borderSubtle}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700 }}>Kul purchase spend</span>
            <strong style={{ fontSize: 18, color: TOKENS.accentGreen }}>
              {formatInr(totalBrandSpend)}
            </strong>
          </div>
        </section>
      ) : null}

      {tab === "history" ? (
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
              fontSize: 12,
              fontWeight: 600,
              color: TOKENS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Transactions
          </p>
          <h2
            style={{
              margin: "4px 0 0",
              fontSize: 18,
              fontWeight: 800,
              color: TOKENS.textDark,
            }}
          >
            Recent history
          </h2>

          {transactions.length === 0 ? (
            <p style={{ margin: "14px 0 0", fontSize: 14, color: TOKENS.textMuted }}>
              Abhi koi stock transaction nahi hai.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {transactions.map((txn) => {
                const isPurchase = txn.txn_type === "purchase";
                const accent = isPurchase ? TOKENS.accentGreen : TOKENS.accentOrange;
                const typeLabel = isPurchase ? "Purchase" : txn.txn_type === "use" ? "Use" : "Adjustment";

                return (
                  <article
                    key={txn.id}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 16,
                      border: `1px solid ${accent}`,
                      background: isPurchase ? "#E8F7F0" : "#FFF4E8",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontSize: 12, color: TOKENS.textMuted }}>
                          {formatTxnDate(txn.txn_date)}
                        </p>
                        <p
                          style={{
                            margin: "2px 0 0",
                            fontSize: 15,
                            fontWeight: 700,
                            color: TOKENS.textDark,
                          }}
                        >
                          {txn.brand_name} — {txn.product_name}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: accent,
                          alignSelf: "flex-start",
                        }}
                      >
                        {typeLabel}
                      </span>
                    </div>
                    <p style={{ margin: "8px 0 0", fontSize: 13, color: TOKENS.textDark }}>
                      Qty: {formatQty(Math.abs(txn.quantity))}
                      {txn.total_cost != null ? ` · Cost: ${formatInr(txn.total_cost)}` : ""}
                    </p>
                    {txn.notes ? (
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: TOKENS.textMuted }}>
                        {txn.notes}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {modalKind ? (
        <StockModal
          kind={modalKind}
          product={modalProduct}
          products={products}
          todayIso={todayIso}
          onClose={() => {
            setModalKind(null);
            setModalProduct(null);
          }}
          onSuccess={(message) => showToast(message, "success")}
          onError={(message) => showToast(message, "error")}
        />
      ) : null}

      <Toast
        message={toast.message}
        show={toast.show}
        variant={toast.variant}
        onDismiss={() => setToast((current) => ({ ...current, show: false }))}
      />
    </div>
  );
}
