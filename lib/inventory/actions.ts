"use server";

import { recordAuditLog } from "@/lib/audit/log";
import {
  getUserMembership,
  isOwnerOrAdmin,
} from "@/lib/auth/membership";
import {
  recordStockIn,
  recordStockUse,
} from "@/lib/inventory/queries";
import type {
  InventoryActionResult,
  StockMutationResult,
} from "@/lib/inventory/types";
import { todayCalendarDay } from "@/lib/payments/date-utils";
import { roundMoney } from "@/lib/staff/advances";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireOwnerOrAdmin(): Promise<
  { ok: true; businessId: string } | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getUserMembership();
  if (!membership?.businessId || !isOwnerOrAdmin(membership.appRole)) {
    return {
      ok: false,
      error: "Sirf owner ya admin inventory manage kar sakte hain.",
    };
  }

  return { ok: true, businessId: membership.businessId };
}

function revalidateInventoryPaths() {
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/money");
  revalidatePath("/dashboard");
}

function parsePositiveNumber(value: FormDataEntryValue | null): number | null {
  const parsed = parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return roundMoney(parsed);
}

function parseRequiredPositive(value: FormDataEntryValue | null): number | null {
  const parsed = parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return roundMoney(parsed);
}

export async function createBrand(formData: FormData): Promise<InventoryActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const name = (formData.get("name") as string)?.trim();
  if (!name) {
    return { ok: false, error: "Brand ka naam zaroori hai." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("inventory_brands").insert({
    business_id: access.businessId,
    name,
    is_active: true,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateInventoryPaths();
  return { ok: true };
}

export async function updateBrand(formData: FormData): Promise<InventoryActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const brandId = (formData.get("brand_id") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();

  if (!brandId) {
    return { ok: false, error: "Brand select nahi hui." };
  }
  if (!name) {
    return { ok: false, error: "Brand ka naam zaroori hai." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_brands")
    .update({ name })
    .eq("id", brandId)
    .eq("business_id", access.businessId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: "Brand update nahi ho payi." };
  }

  revalidateInventoryPaths();
  return { ok: true };
}

export async function toggleBrandActive(
  formData: FormData
): Promise<InventoryActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const brandId = (formData.get("brand_id") as string)?.trim();
  const isActive = formData.get("is_active") === "true";

  if (!brandId) {
    return { ok: false, error: "Brand select nahi hui." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_brands")
    .update({ is_active: isActive })
    .eq("id", brandId)
    .eq("business_id", access.businessId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: "Brand update nahi ho payi." };
  }

  revalidateInventoryPaths();
  return { ok: true };
}

export async function createProduct(
  formData: FormData
): Promise<InventoryActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const brandId = (formData.get("brand_id") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const unitType = (formData.get("unit_type") as string)?.trim();
  const minQuantity = parsePositiveNumber(formData.get("min_quantity"));

  if (!brandId) {
    return { ok: false, error: "Brand select karein." };
  }
  if (!name) {
    return { ok: false, error: "Product ka naam zaroori hai." };
  }
  if (!unitType) {
    return { ok: false, error: "Unit type daalein (bottle, tube, etc.)." };
  }
  if (minQuantity == null) {
    return { ok: false, error: "Min quantity valid honi chahiye." };
  }

  const supabase = createClient();

  const { data: brand } = await supabase
    .from("inventory_brands")
    .select("id")
    .eq("id", brandId)
    .eq("business_id", access.businessId)
    .maybeSingle();

  if (!brand) {
    return { ok: false, error: "Valid brand select karein." };
  }

  const { error } = await supabase.from("inventory_products").insert({
    business_id: access.businessId,
    brand_id: brandId,
    name,
    unit_type: unitType,
    min_quantity: minQuantity,
    current_quantity: 0,
    avg_unit_cost: 0,
    is_active: true,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateInventoryPaths();
  return { ok: true };
}

export async function updateProduct(
  formData: FormData
): Promise<InventoryActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const productId = (formData.get("product_id") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const unitType = (formData.get("unit_type") as string)?.trim();
  const minQuantity = parsePositiveNumber(formData.get("min_quantity"));

  if (!productId) {
    return { ok: false, error: "Product select nahi hua." };
  }
  if (!name) {
    return { ok: false, error: "Product ka naam zaroori hai." };
  }
  if (!unitType) {
    return { ok: false, error: "Unit type daalein." };
  }
  if (minQuantity == null) {
    return { ok: false, error: "Min quantity valid honi chahiye." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_products")
    .update({
      name,
      unit_type: unitType,
      min_quantity: minQuantity,
    })
    .eq("id", productId)
    .eq("business_id", access.businessId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: "Product update nahi ho paya." };
  }

  revalidateInventoryPaths();
  return { ok: true };
}

export async function toggleProductActive(
  formData: FormData
): Promise<InventoryActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const productId = (formData.get("product_id") as string)?.trim();
  const isActive = formData.get("is_active") === "true";

  if (!productId) {
    return { ok: false, error: "Product select nahi hua." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_products")
    .update({ is_active: isActive })
    .eq("id", productId)
    .eq("business_id", access.businessId)
    .select("id, name")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: "Product update nahi ho paya." };
  }

  if (!isActive) {
    void recordAuditLog({
      businessId: access.businessId,
      action: "inventory.deleted",
      entityType: "inventory_product",
      entityId: productId,
      entityLabel: data.name as string,
    });
  }

  revalidateInventoryPaths();
  return { ok: true };
}

export async function stockIn(formData: FormData): Promise<StockMutationResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const productId = (formData.get("product_id") as string)?.trim();
  const quantity = parseRequiredPositive(formData.get("quantity"));
  const unitCost = parsePositiveNumber(formData.get("unit_cost"));
  const txnDate =
    (formData.get("txn_date") as string)?.trim() || todayCalendarDay();
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!productId) {
    return { ok: false, error: "Product select karein." };
  }
  if (quantity == null) {
    return { ok: false, error: "Valid quantity daalein." };
  }
  if (unitCost == null) {
    return { ok: false, error: "Valid price per unit daalein." };
  }

  const result = await recordStockIn({
    businessId: access.businessId,
    productId,
    quantity,
    unitCost,
    txnDate,
    notes,
  });

  if (result.ok) {
    revalidateInventoryPaths();
  }

  return result;
}

export async function stockUse(formData: FormData): Promise<StockMutationResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const productId = (formData.get("product_id") as string)?.trim();
  const quantity = parseRequiredPositive(formData.get("quantity"));
  const txnDate =
    (formData.get("txn_date") as string)?.trim() || todayCalendarDay();
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!productId) {
    return { ok: false, error: "Product select karein." };
  }
  if (quantity == null) {
    return { ok: false, error: "Valid quantity daalein." };
  }

  const result = await recordStockUse({
    businessId: access.businessId,
    productId,
    quantity,
    txnDate,
    notes,
  });

  if (result.ok) {
    revalidateInventoryPaths();
  }

  return result;
}
