import { todayCalendarDay } from "@/lib/payments/date-utils";
import { roundMoney } from "@/lib/staff/advances";
import { createClient } from "@/lib/supabase/server";
import type {
  BrandSpendSummary,
  InventoryBrand,
  InventoryProductWithBrand,
  InventorySummary,
  InventoryTransactionWithDetails,
  InventoryTxnType,
  StockMutationResult,
} from "@/lib/inventory/types";

type BrandRow = {
  id: string;
  business_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

type ProductRow = {
  id: string;
  business_id: string;
  brand_id: string;
  name: string;
  unit_type: string;
  current_quantity: number | string;
  min_quantity: number | string;
  avg_unit_cost: number | string;
  is_active: boolean;
  created_at: string;
  inventory_brands: { name: string } | { name: string }[] | null;
};

type TransactionRow = {
  id: string;
  business_id: string;
  product_id: string;
  txn_type: string;
  quantity: number | string;
  unit_cost: number | string | null;
  total_cost: number | string | null;
  txn_date: string;
  notes: string | null;
  created_at: string;
  inventory_products:
    | {
        name: string;
        inventory_brands: { name: string } | { name: string }[] | null;
      }
    | {
        name: string;
        inventory_brands: { name: string } | { name: string }[] | null;
      }[]
    | null;
};

function mapBrand(row: BrandRow): InventoryBrand {
  return {
    id: row.id,
    business_id: row.business_id,
    name: row.name,
    is_active: row.is_active,
    created_at: row.created_at,
  };
}

function brandNameFromJoin(
  brands: { name: string } | { name: string }[] | null | undefined
): string {
  if (!brands) return "Unknown";
  if (Array.isArray(brands)) return brands[0]?.name ?? "Unknown";
  return brands.name;
}

function mapProductRow(row: ProductRow): InventoryProductWithBrand {
  return {
    id: row.id,
    business_id: row.business_id,
    brand_id: row.brand_id,
    name: row.name,
    unit_type: row.unit_type,
    current_quantity: roundMoney(Number(row.current_quantity ?? 0)),
    min_quantity: roundMoney(Number(row.min_quantity ?? 0)),
    avg_unit_cost: roundMoney(Number(row.avg_unit_cost ?? 0)),
    is_active: row.is_active,
    created_at: row.created_at,
    brand_name: brandNameFromJoin(row.inventory_brands),
  };
}

function mapTxnType(value: string): InventoryTxnType {
  if (value === "purchase" || value === "use" || value === "adjustment") {
    return value;
  }
  return "purchase";
}

function mapTransactionRow(row: TransactionRow): InventoryTransactionWithDetails {
  const product = Array.isArray(row.inventory_products)
    ? row.inventory_products[0]
    : row.inventory_products;

  return {
    id: row.id,
    business_id: row.business_id,
    product_id: row.product_id,
    txn_type: mapTxnType(row.txn_type),
    quantity: roundMoney(Number(row.quantity ?? 0)),
    unit_cost:
      row.unit_cost == null ? null : roundMoney(Number(row.unit_cost ?? 0)),
    total_cost:
      row.total_cost == null ? null : roundMoney(Number(row.total_cost ?? 0)),
    txn_date: row.txn_date,
    notes: row.notes,
    created_at: row.created_at,
    product_name: product?.name ?? "Unknown",
    brand_name: brandNameFromJoin(product?.inventory_brands),
  };
}

export function monthCalendarBounds(
  year: number,
  month: number
): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
  return { start, end };
}

export function currentIstYearMonth(): { year: number; month: number } {
  const today = todayCalendarDay();
  const [year, month] = today.split("-").map(Number);
  return { year, month };
}

export function formatIstMonthLabel(year: number, month: number): string {
  const date = new Date(
    `${year}-${String(month).padStart(2, "0")}-15T12:00:00+05:30`
  );
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export async function listBrands(businessId: string): Promise<InventoryBrand[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("inventory_brands")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("listBrands:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapBrand(row as BrandRow));
}

export async function listAllBrands(
  businessId: string
): Promise<InventoryBrand[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("inventory_brands")
    .select("*")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) {
    console.error("listAllBrands:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapBrand(row as BrandRow));
}

export async function listProductsWithBrand(
  businessId: string
): Promise<InventoryProductWithBrand[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("inventory_products")
    .select(
      `
      id,
      business_id,
      brand_id,
      name,
      unit_type,
      current_quantity,
      min_quantity,
      avg_unit_cost,
      is_active,
      created_at,
      inventory_brands ( name )
    `
    )
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) {
    console.error("listProductsWithBrand:", error.message);
    return [];
  }

  const products = (data ?? []).map((row) => mapProductRow(row as ProductRow));

  return products.sort((a, b) => {
    const brandCompare = a.brand_name.localeCompare(b.brand_name);
    if (brandCompare !== 0) return brandCompare;
    return a.name.localeCompare(b.name);
  });
}

export async function getProductBalance(productId: string): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("inventory_products")
    .select("current_quantity")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    console.error("getProductBalance:", error.message);
    return 0;
  }

  return roundMoney(Number(data?.current_quantity ?? 0));
}

export async function getLowStockProducts(
  businessId: string
): Promise<InventoryProductWithBrand[]> {
  const products = await listProductsWithBrand(businessId);

  return products.filter(
    (product) =>
      product.is_active &&
      product.min_quantity > 0 &&
      product.current_quantity <= product.min_quantity
  );
}

export async function getInventorySummary(
  businessId: string,
  year?: number,
  month?: number
): Promise<InventorySummary> {
  const supabase = createClient();
  const ist = currentIstYearMonth();
  const y = year ?? ist.year;
  const m = month ?? ist.month;
  const { start, end } = monthCalendarBounds(y, m);

  const [products, lowStock, { data: txnRows, error: txnError }] =
    await Promise.all([
      listProductsWithBrand(businessId),
      getLowStockProducts(businessId),
      supabase
        .from("inventory_transactions")
        .select("txn_type, total_cost")
        .eq("business_id", businessId)
        .gte("txn_date", start)
        .lte("txn_date", end),
    ]);

  if (txnError) {
    console.error("getInventorySummary txns:", txnError.message);
  }

  const activeProducts = products.filter((product) => product.is_active);
  const total_stock_value = roundMoney(
    activeProducts.reduce(
      (sum, product) =>
        sum + product.current_quantity * product.avg_unit_cost,
      0
    )
  );

  let month_purchase_total = 0;
  let month_usage_total = 0;

  for (const row of txnRows ?? []) {
    const cost = roundMoney(Number(row.total_cost ?? 0));
    if (row.txn_type === "purchase") {
      month_purchase_total = roundMoney(month_purchase_total + cost);
    } else if (row.txn_type === "use") {
      month_usage_total = roundMoney(month_usage_total + Math.abs(cost));
    }
  }

  return {
    total_stock_value,
    month_purchase_total,
    month_usage_total,
    low_stock_count: lowStock.length,
  };
}

export async function getBrandSpendSummary(
  businessId: string,
  year: number,
  month: number
): Promise<BrandSpendSummary[]> {
  const supabase = createClient();
  const { start, end } = monthCalendarBounds(year, month);

  const { data, error } = await supabase
    .from("inventory_transactions")
    .select(
      `
      total_cost,
      inventory_products (
        brand_id,
        inventory_brands ( id, name )
      )
    `
    )
    .eq("business_id", businessId)
    .eq("txn_type", "purchase")
    .gte("txn_date", start)
    .lte("txn_date", end);

  if (error) {
    console.error("getBrandSpendSummary:", error.message);
    return [];
  }

  const summaryMap = new Map<string, BrandSpendSummary>();

  for (const row of data ?? []) {
    const product = Array.isArray(row.inventory_products)
      ? row.inventory_products[0]
      : row.inventory_products;

    const brands = product?.inventory_brands;
    const brand = Array.isArray(brands) ? brands[0] : brands;
    const brandId = (brand?.id as string | undefined) ?? product?.brand_id;
    const brandName = (brand?.name as string | undefined) ?? "Unknown";

    if (!brandId) continue;

    const spend = roundMoney(Number(row.total_cost ?? 0));
    const existing = summaryMap.get(brandId) ?? {
      brand_id: brandId,
      brand_name: brandName,
      month_spend: 0,
      purchase_count: 0,
    };

    existing.month_spend = roundMoney(existing.month_spend + spend);
    existing.purchase_count += 1;
    summaryMap.set(brandId, existing);
  }

  return Array.from(summaryMap.values()).sort((a, b) =>
    b.month_spend - a.month_spend || a.brand_name.localeCompare(b.brand_name)
  );
}

export async function getRecentTransactions(
  businessId: string,
  limit = 20
): Promise<InventoryTransactionWithDetails[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("inventory_transactions")
    .select(
      `
      id,
      business_id,
      product_id,
      txn_type,
      quantity,
      unit_cost,
      total_cost,
      txn_date,
      notes,
      created_at,
      inventory_products (
        name,
        inventory_brands ( name )
      )
    `
    )
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentTransactions:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapTransactionRow(row as TransactionRow));
}

function mapStockInRpcError(message: string): string {
  if (message.includes("NOT_AUTHORIZED")) {
    return "Stock in save karne ki permission nahi hai.";
  }
  if (message.includes("INVALID_QUANTITY")) {
    return "Quantity 0 se zyada honi chahiye.";
  }
  if (message.includes("INVALID_UNIT_COST")) {
    return "Unit cost valid hona chahiye.";
  }
  if (message.includes("PRODUCT_NOT_FOUND")) {
    return "Product nahi mila.";
  }
  if (message.includes("PRODUCT_INACTIVE")) {
    return "Inactive product mein stock add nahi kar sakte.";
  }
  return message || "Stock in save fail.";
}

export async function recordStockIn(params: {
  businessId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  txnDate: string;
  notes?: string | null;
}): Promise<StockMutationResult> {
  if (params.quantity <= 0) {
    return { ok: false, error: "Quantity 0 se zyada honi chahiye." };
  }
  if (params.unitCost < 0) {
    return { ok: false, error: "Unit cost valid hona chahiye." };
  }

  const supabase = createClient();

  const { data, error } = await supabase.rpc("record_stock_in_atomic", {
    p_business_id: params.businessId,
    p_product_id: params.productId,
    p_quantity: params.quantity,
    p_unit_cost: params.unitCost,
    p_txn_date: params.txnDate,
    p_notes: params.notes ?? null,
  });

  if (error) {
    console.error("recordStockIn rpc:", error.message);
    return { ok: false, error: mapStockInRpcError(error.message) };
  }

  const result = data as {
    ok?: boolean;
    txn_id?: string;
  } | null;

  if (!result?.ok || !result.txn_id) {
    return { ok: false, error: "Stock in save fail." };
  }

  return { ok: true, id: result.txn_id };
}

export async function recordStockUse(params: {
  businessId: string;
  productId: string;
  quantity: number;
  txnDate: string;
  notes?: string | null;
}): Promise<StockMutationResult> {
  if (params.quantity <= 0) {
    return { ok: false, error: "Quantity 0 se zyada honi chahiye." };
  }

  const supabase = createClient();

  const { data: product, error: productError } = await supabase
    .from("inventory_products")
    .select("id, business_id, current_quantity, avg_unit_cost, is_active")
    .eq("id", params.productId)
    .eq("business_id", params.businessId)
    .maybeSingle();

  if (productError || !product) {
    return { ok: false, error: "Product nahi mila." };
  }

  if (!product.is_active) {
    return { ok: false, error: "Inactive product use nahi kar sakte." };
  }

  const currentQty = roundMoney(Number(product.current_quantity ?? 0));
  const avgCost = roundMoney(Number(product.avg_unit_cost ?? 0));
  const qty = roundMoney(params.quantity);

  if (qty > currentQty) {
    return {
      ok: false,
      error: `Stock kam hai — sirf ${currentQty} bacha hai.`,
    };
  }

  const newQty = roundMoney(currentQty - qty);
  const usageCost = roundMoney(qty * avgCost);

  const { data: txn, error: txnError } = await supabase
    .from("inventory_transactions")
    .insert({
      business_id: params.businessId,
      product_id: params.productId,
      txn_type: "use",
      quantity: -qty,
      unit_cost: null,
      total_cost: usageCost,
      txn_date: params.txnDate,
      notes: params.notes ?? null,
    })
    .select("id")
    .maybeSingle();

  if (txnError || !txn?.id) {
    console.error("recordStockUse txn:", txnError?.message);
    return { ok: false, error: txnError?.message ?? "Use record save fail." };
  }

  const { error: updateError } = await supabase
    .from("inventory_products")
    .update({ current_quantity: newQty })
    .eq("id", params.productId)
    .eq("business_id", params.businessId);

  if (updateError) {
    console.error("recordStockUse update:", updateError.message);
    return { ok: false, error: updateError.message };
  }

  return { ok: true, id: txn.id };
}
