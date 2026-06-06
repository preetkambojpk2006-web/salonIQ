"use server";

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

export async function searchCustomers(query: string): Promise<Customer[]> {
  return listCustomers(query);
}

export async function createCustomer(formData: FormData) {
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
    redirect("/dashboard/customers?error=Please enter a customer name");
  }

  if (!phoneRaw || !isValidIndianPhone(phoneRaw)) {
    redirect(
      `/dashboard/customers?error=${encodeURIComponent("Sahi 10-digit mobile number daalein")}`
    );
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
    redirect(
      `/dashboard/customers?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers?added=1");
}
