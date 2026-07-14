"use server";

import { recordAuditLog } from "@/lib/audit/log";
import {
  getUserMembership,
  isOwnerOrAdmin,
} from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type SalonActionResult =
  | { ok: true }
  | { ok: false; error: string };

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
      error: "Sirf owner ya admin services aur staff manage kar sakte hain.",
    };
  }

  return { ok: true, businessId: membership.businessId };
}

function parseDuration(value: FormDataEntryValue | null): number | null {
  const duration = parseInt(String(value ?? ""), 10);
  if (!duration || duration < 1) return null;
  return duration;
}

function parsePrice(value: FormDataEntryValue | null): number | null {
  const price = parseFloat(String(value ?? ""));
  if (Number.isNaN(price) || price < 0) return null;
  return price;
}

function parseCommission(value: FormDataEntryValue | null): number | null {
  if (value === null || String(value).trim() === "") return 30;
  const percent = parseFloat(String(value));
  if (Number.isNaN(percent) || percent < 0 || percent > 100) return null;
  return percent;
}

function revalidateSalonPaths() {
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard");
}

export async function createSalonService(
  formData: FormData
): Promise<SalonActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || null;
  const duration_mins = parseDuration(formData.get("duration_mins"));
  const price = parsePrice(formData.get("price"));

  if (!name) {
    return { ok: false, error: "Service ka naam zaroori hai." };
  }

  if (!duration_mins) {
    return { ok: false, error: "Duration minutes mein valid number daalein." };
  }

  if (price === null) {
    return { ok: false, error: "Valid price daalein." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("services").insert({
    business_id: access.businessId,
    name,
    category,
    duration_mins,
    price,
    is_active: true,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateSalonPaths();
  return { ok: true };
}

export async function updateSalonService(
  formData: FormData
): Promise<SalonActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const serviceId = (formData.get("service_id") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || null;
  const duration_mins = parseDuration(formData.get("duration_mins"));
  const price = parsePrice(formData.get("price"));

  if (!serviceId) {
    return { ok: false, error: "Service select nahi hui." };
  }

  if (!name) {
    return { ok: false, error: "Service ka naam zaroori hai." };
  }

  if (!duration_mins) {
    return { ok: false, error: "Duration minutes mein valid number daalein." };
  }

  if (price === null) {
    return { ok: false, error: "Valid price daalein." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .update({ name, category, duration_mins, price })
    .eq("id", serviceId)
    .eq("business_id", access.businessId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: "Service update nahi ho payi." };
  }

  revalidateSalonPaths();
  return { ok: true };
}

export async function toggleSalonServiceActive(
  formData: FormData
): Promise<SalonActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const serviceId = (formData.get("service_id") as string)?.trim();
  const isActive = formData.get("is_active") === "true";

  if (!serviceId) {
    return { ok: false, error: "Service select nahi hui." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .update({ is_active: isActive })
    .eq("id", serviceId)
    .eq("business_id", access.businessId)
    .select("id, name")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: "Service update nahi ho payi." };
  }

  if (!isActive) {
    void recordAuditLog({
      businessId: access.businessId,
      action: "service.deleted",
      entityType: "service",
      entityId: serviceId,
      entityLabel: data.name as string,
    });
  }

  revalidateSalonPaths();
  return { ok: true };
}

export async function createSalonStaffMember(
  formData: FormData
): Promise<SalonActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const name = (formData.get("name") as string)?.trim();
  const role = (formData.get("role") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const branchId = (formData.get("branch_id") as string)?.trim();
  const commission_percent = parseCommission(formData.get("commission_percent"));

  if (!name) {
    return { ok: false, error: "Staff ka naam zaroori hai." };
  }

  if (!branchId) {
    return { ok: false, error: "Branch select karein." };
  }

  if (commission_percent === null) {
    return { ok: false, error: "Commission 0 se 100 ke beech honi chahiye." };
  }

  const supabase = createClient();

  const { data: branch } = await supabase
    .from("branches")
    .select("id")
    .eq("id", branchId)
    .eq("business_id", access.businessId)
    .maybeSingle();

  if (!branch) {
    return { ok: false, error: "Valid branch select karein." };
  }

  const { error } = await supabase.from("staff").insert({
    business_id: access.businessId,
    branch_id: branchId,
    name,
    role,
    phone,
    commission_percent,
    is_active: true,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateSalonPaths();
  return { ok: true };
}

export async function updateSalonStaffMember(
  formData: FormData
): Promise<SalonActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const staffId = (formData.get("staff_id") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const role = (formData.get("role") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const branchId = (formData.get("branch_id") as string)?.trim();
  const commission_percent = parseCommission(formData.get("commission_percent"));

  if (!staffId) {
    return { ok: false, error: "Staff member select nahi hua." };
  }

  if (!name) {
    return { ok: false, error: "Staff ka naam zaroori hai." };
  }

  if (!branchId) {
    return { ok: false, error: "Branch select karein." };
  }

  if (commission_percent === null) {
    return { ok: false, error: "Commission 0 se 100 ke beech honi chahiye." };
  }

  const supabase = createClient();

  const { data: branch } = await supabase
    .from("branches")
    .select("id")
    .eq("id", branchId)
    .eq("business_id", access.businessId)
    .maybeSingle();

  if (!branch) {
    return { ok: false, error: "Valid branch select karein." };
  }

  const { data, error } = await supabase
    .from("staff")
    .update({
      name,
      role,
      phone,
      branch_id: branchId,
      commission_percent,
    })
    .eq("id", staffId)
    .eq("business_id", access.businessId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: "Staff update nahi ho paya." };
  }

  revalidateSalonPaths();
  return { ok: true };
}

export async function toggleSalonStaffActive(
  formData: FormData
): Promise<SalonActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const staffId = (formData.get("staff_id") as string)?.trim();
  const isActive = formData.get("is_active") === "true";

  if (!staffId) {
    return { ok: false, error: "Staff member select nahi hua." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("staff")
    .update({ is_active: isActive })
    .eq("id", staffId)
    .eq("business_id", access.businessId)
    .select("id, name")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: "Staff update nahi ho paya." };
  }

  if (!isActive) {
    void recordAuditLog({
      businessId: access.businessId,
      action: "staff.deactivated",
      entityType: "staff",
      entityId: staffId,
      entityLabel: data.name as string,
    });
  }

  revalidateSalonPaths();
  return { ok: true };
}

type StaffServicePriceEntry = {
  service_id: string;
  price: number | null;
};

export async function saveStaffServicePrices(
  formData: FormData
): Promise<SalonActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const staffId = (formData.get("staff_id") as string)?.trim();
  const rawEntries = (formData.get("prices_json") as string)?.trim();

  if (!staffId || !rawEntries) {
    return { ok: false, error: "Staff service prices save nahi ho paye." };
  }

  let entries: StaffServicePriceEntry[];
  try {
    entries = JSON.parse(rawEntries) as StaffServicePriceEntry[];
    if (!Array.isArray(entries)) {
      return { ok: false, error: "Invalid price data." };
    }
  } catch {
    return { ok: false, error: "Invalid price data." };
  }

  const supabase = createClient();

  const { data: staffRow } = await supabase
    .from("staff")
    .select("id")
    .eq("id", staffId)
    .eq("business_id", access.businessId)
    .maybeSingle();

  if (!staffRow?.id) {
    return { ok: false, error: "Staff member not found." };
  }

  for (const entry of entries) {
    const serviceId = entry.service_id?.trim();
    if (!serviceId) continue;

    const { data: serviceRow } = await supabase
      .from("services")
      .select("id")
      .eq("id", serviceId)
      .eq("business_id", access.businessId)
      .eq("is_active", true)
      .maybeSingle();

    if (!serviceRow?.id) {
      continue;
    }

    if (entry.price == null) {
      const { error } = await supabase
        .from("staff_service_prices")
        .delete()
        .eq("business_id", access.businessId)
        .eq("staff_id", staffId)
        .eq("service_id", serviceId);

      if (error) {
        return { ok: false, error: error.message };
      }
      continue;
    }

    const price = Number(entry.price);
    if (!Number.isFinite(price) || price < 0) {
      return { ok: false, error: "Invalid service price." };
    }

    const { error } = await supabase.from("staff_service_prices").upsert(
      {
        business_id: access.businessId,
        staff_id: staffId,
        service_id: serviceId,
        price,
      },
      { onConflict: "staff_id,service_id" }
    );

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  revalidateSalonPaths();
  return { ok: true };
}

type ServiceRecipeEntry = {
  product_id: string;
  quantity: number | null;
  unit?: string | null;
};

export async function saveServiceRecipe(
  formData: FormData
): Promise<SalonActionResult> {
  const access = await requireOwnerOrAdmin();
  if (!access.ok) return access;

  const serviceId = (formData.get("service_id") as string)?.trim();
  const rawEntries = (formData.get("recipe_json") as string)?.trim();

  if (!serviceId || !rawEntries) {
    return { ok: false, error: "Recipe save nahi ho payi." };
  }

  let entries: ServiceRecipeEntry[];
  try {
    entries = JSON.parse(rawEntries) as ServiceRecipeEntry[];
    if (!Array.isArray(entries)) {
      return { ok: false, error: "Invalid recipe data." };
    }
  } catch {
    return { ok: false, error: "Invalid recipe data." };
  }

  const supabase = createClient();

  const { data: serviceRow } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("business_id", access.businessId)
    .maybeSingle();

  if (!serviceRow?.id) {
    return { ok: false, error: "Service not found." };
  }

  for (const entry of entries) {
    const productId = entry.product_id?.trim();
    if (!productId) continue;

    const { data: productRow } = await supabase
      .from("inventory_products")
      .select("id")
      .eq("id", productId)
      .eq("business_id", access.businessId)
      .maybeSingle();

    if (!productRow?.id) {
      continue;
    }

    if (entry.quantity == null) {
      const { error } = await supabase
        .from("service_recipes")
        .delete()
        .eq("business_id", access.businessId)
        .eq("service_id", serviceId)
        .eq("product_id", productId);

      if (error) {
        return { ok: false, error: error.message };
      }
      continue;
    }

    const quantity = Number(entry.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { ok: false, error: "Invalid recipe quantity." };
    }

    const unit = entry.unit?.trim() || null;

    const { error } = await supabase.from("service_recipes").upsert(
      {
        business_id: access.businessId,
        service_id: serviceId,
        product_id: productId,
        quantity,
        unit,
      },
      { onConflict: "service_id,product_id" }
    );

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  revalidateSalonPaths();
  return { ok: true };
}
