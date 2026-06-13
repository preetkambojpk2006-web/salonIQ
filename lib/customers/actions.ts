"use server";

import {
  getUserMembership,
  isOwnerOrAdmin,
} from "@/lib/auth/membership";
import {
  getOwnerBusinessId,
  listCustomers,
} from "@/lib/customers/queries";
import {
  isValidIndianPhone,
  normalizeIndianPhone,
} from "@/lib/customers/validatePhone";
import { createClient } from "@/lib/supabase/server";
import type { Customer } from "@/lib/customers/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CreateCustomerResult =
  | { ok: true }
  | { ok: false; error: string };

export type UpdateCustomerNotesResult =
  | { ok: true }
  | { ok: false; error: string };

export type RedeemCustomerRewardResult =
  | { ok: true }
  | { ok: false; error: string };

export async function searchCustomers(query: string): Promise<Customer[]> {
  return listCustomers(query);
}

export async function createCustomer(
  formData: FormData
): Promise<CreateCustomerResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const businessId = await getOwnerBusinessId();
  if (!businessId) {
    redirect("/onboarding/business?error=Set up your salon first");
  }

  const name = (formData.get("name") as string)?.trim();
  const phoneRaw = (formData.get("phone") as string)?.trim() ?? "";
  const gender = (formData.get("gender") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name) {
    return { ok: false, error: "Please enter a customer name" };
  }

  if (!phoneRaw || !isValidIndianPhone(phoneRaw)) {
    return { ok: false, error: "Sahi 10-digit mobile number daalein" };
  }

  const phone = normalizeIndianPhone(phoneRaw);

  const { error } = await supabase.from("customers").insert({
    business_id: businessId,
    name,
    phone,
    gender: gender || null,
    notes,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/customers");
  return { ok: true };
}

export async function updateCustomerNotes(
  customerId: string,
  notes: string
): Promise<UpdateCustomerNotesResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const businessId = await getOwnerBusinessId();
  if (!businessId) {
    return { ok: false, error: "Pehle salon setup karein." };
  }

  const trimmedId = customerId.trim();
  if (!trimmedId) {
    return { ok: false, error: "Customer nahi mila." };
  }

  const { error } = await supabase
    .from("customers")
    .update({ notes: notes.trim() || null })
    .eq("id", trimmedId)
    .eq("business_id", businessId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/calendar");
  return { ok: true };
}

export async function redeemCustomerReward(
  customerId: string
): Promise<RedeemCustomerRewardResult> {
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
      error: "Sirf owner ya admin reward redeem mark kar sakte hain.",
    };
  }

  const trimmedId = customerId.trim();
  if (!trimmedId) {
    return { ok: false, error: "Customer nahi mila." };
  }

  const { data: customer, error: fetchError } = await supabase
    .from("customers")
    .select(
      "id, reward_pending, visit_count, total_spend"
    )
    .eq("id", trimmedId)
    .eq("business_id", membership.businessId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  if (!customer) {
    return { ok: false, error: "Customer nahi mila." };
  }

  if (!customer.reward_pending) {
    return { ok: false, error: "Is customer ka koi pending reward nahi hai." };
  }

  const now = new Date().toISOString();
  const visitCount = Number(customer.visit_count ?? 0);
  const totalSpend = Number(customer.total_spend ?? 0);

  const { error: updateError } = await supabase
    .from("customers")
    .update({
      reward_pending: false,
      reward_redeemed_at: now,
      loyalty_baseline_visits: visitCount,
      loyalty_baseline_spend: totalSpend,
    })
    .eq("id", trimmedId)
    .eq("business_id", membership.businessId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidatePath("/dashboard/customers");
  return { ok: true };
}

export type MarkCustomerRewardNotifiedResult =
  | { ok: true }
  | { ok: false; error: string };

export async function markCustomerRewardNotified(
  customerId: string
): Promise<MarkCustomerRewardNotifiedResult> {
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
      error: "Sirf owner ya admin reward notification mark kar sakte hain.",
    };
  }

  const trimmedId = customerId.trim();
  if (!trimmedId) {
    return { ok: false, error: "Customer nahi mila." };
  }

  const { data: customer, error: fetchError } = await supabase
    .from("customers")
    .select("id, reward_pending")
    .eq("id", trimmedId)
    .eq("business_id", membership.businessId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  if (!customer) {
    return { ok: false, error: "Customer nahi mila." };
  }

  if (!customer.reward_pending) {
    return { ok: false, error: "Is customer ka koi pending reward nahi hai." };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("customers")
    .update({ reward_notified_at: now })
    .eq("id", trimmedId)
    .eq("business_id", membership.businessId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidatePath("/dashboard/customers");
  return { ok: true };
}
