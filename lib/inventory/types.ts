export type InventoryTxnType = "purchase" | "use" | "adjustment";

export type InventoryProductType = "backbar" | "retail";

export type InventoryBrand = {
  id: string;
  business_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type InventoryProduct = {
  id: string;
  business_id: string;
  brand_id: string;
  name: string;
  unit_type: string;
  product_type: InventoryProductType;
  category: string | null;
  purchase_unit: string | null;
  usage_unit: string | null;
  unit_conversion_factor: number;
  current_quantity: number;
  min_quantity: number;
  avg_unit_cost: number;
  is_active: boolean;
  created_at: string;
};

export type InventoryProductWithBrand = InventoryProduct & {
  brand_name: string;
};

export type InventoryTransaction = {
  id: string;
  business_id: string;
  product_id: string;
  txn_type: InventoryTxnType;
  quantity: number;
  unit_cost: number | null;
  total_cost: number | null;
  txn_date: string;
  notes: string | null;
  created_at: string;
};

export type InventoryTransactionWithDetails = InventoryTransaction & {
  product_name: string;
  brand_name: string;
};

export type InventorySummary = {
  total_stock_value: number;
  month_purchase_total: number;
  month_usage_total: number;
  low_stock_count: number;
};

export type BrandSpendSummary = {
  brand_id: string;
  brand_name: string;
  month_spend: number;
  purchase_count: number;
};

export type InventoryActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type StockMutationResult =
  | { ok: true; id: string }
  | { ok: false; error: string };
