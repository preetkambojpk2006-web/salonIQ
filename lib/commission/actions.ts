"use server";

import {
  getUserMembership,
  isOwnerOrAdmin,
} from "@/lib/auth/membership";
import type { CommissionSlab } from "@/lib/commission/slab-calculations";
import { validateSlabs } from "@/lib/commission/slab-calculations";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CommissionActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type CommissionConfig = {
  mode: "flat" | "slab";
  slabs: CommissionSlab[];
};

async function requireBusinessId(): Promise<
  { businessId: string } | { error: string }
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
      error: "Sirf owner ya admin commission settings update kar sakte hain.",
    };
  }

  return { businessId: membership.businessId };
}

export async function getCommissionConfig(): Promise<CommissionConfig> {
  const access = await requireBusinessId();
  if ("error" in access) {
    return { mode: "flat", slabs: [] };
  }

  const supabase = createClient();
  const { businessId } = access;

  const [{ data: settings }, { data: slabRows }] = await Promise.all([
    supabase
      .from("commission_settings")
      .select("mode")
      .eq("business_id", businessId)
      .maybeSingle(),
    supabase
      .from("commission_slabs")
      .select("min_amount, max_amount, rate")
      .eq("business_id", businessId)
      .is("staff_id", null)
      .order("min_amount", { ascending: true }),
  ]);

  const mode = settings?.mode === "slab" ? "slab" : "flat";

  const slabs: CommissionSlab[] = (slabRows ?? []).map((row) => ({
    min_amount: Number(row.min_amount),
    max_amount:
      row.max_amount != null ? Number(row.max_amount) : null,
    rate: Number(row.rate),
  }));

  return { mode, slabs };
}

export async function saveCommissionConfig(
  formData: FormData
): Promise<CommissionActionResult> {
  const access = await requireBusinessId();
  if ("error" in access) {
    return { ok: false, error: access.error };
  }

  const modeRaw = (formData.get("mode") as string)?.trim();
  if (modeRaw !== "flat" && modeRaw !== "slab") {
    return { ok: false, error: "Invalid commission mode." };
  }

  const mode = modeRaw;
  const supabase = createClient();
  const { businessId } = access;

  let slabs: CommissionSlab[] = [];

  if (mode === "slab") {
    const slabsRaw = formData.get("slabs") as string;
    if (!slabsRaw) {
      return { ok: false, error: "Slab tiers are required in slab mode." };
    }

    try {
      const parsed = JSON.parse(slabsRaw) as CommissionSlab[];
      if (!Array.isArray(parsed)) {
        return { ok: false, error: "Invalid slab data." };
      }
      slabs = parsed.map((slab) => ({
        min_amount: Number(slab.min_amount),
        max_amount:
          slab.max_amount != null ? Number(slab.max_amount) : null,
        rate: Number(slab.rate),
      }));
    } catch {
      return { ok: false, error: "Invalid slab data." };
    }

    const validation = validateSlabs(slabs);
    if (!validation.valid) {
      return { ok: false, error: validation.error ?? "Invalid slab tiers." };
    }
  }

  const now = new Date().toISOString();

  const { error: settingsError } = await supabase
    .from("commission_settings")
    .upsert(
      {
        business_id: businessId,
        mode,
        updated_at: now,
      },
      { onConflict: "business_id" }
    );

  if (settingsError) {
    return { ok: false, error: settingsError.message };
  }

  if (mode === "slab") {
    const { error: deleteError } = await supabase
      .from("commission_slabs")
      .delete()
      .eq("business_id", businessId)
      .is("staff_id", null);

    if (deleteError) {
      return { ok: false, error: deleteError.message };
    }

    const { error: insertError } = await supabase.from("commission_slabs").insert(
      slabs.map((slab) => ({
        business_id: businessId,
        staff_id: null,
        min_amount: slab.min_amount,
        max_amount: slab.max_amount,
        rate: slab.rate,
      }))
    );

    if (insertError) {
      return { ok: false, error: insertError.message };
    }
  }

  revalidatePath("/dashboard/settings");
  return { ok: true };
}
