import type { Customer } from "@/lib/customers/types";
import { getUserBusinessId as resolveUserBusinessId } from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, (char) => `\\${char}`);
}

export async function getOwnerBusinessId(): Promise<string | null> {
  return resolveUserBusinessId();
}

export async function listCustomers(search?: string): Promise<Customer[]> {
  const supabase = createClient();
  const businessId = await getOwnerBusinessId();

  if (!businessId) {
    return [];
  }

  let query = supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  const trimmed = search?.trim();
  if (trimmed) {
    const pattern = `%${escapeIlike(trimmed)}%`;
    query = query.or(`name.ilike.${pattern},phone.ilike.${pattern}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("listCustomers:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...row,
    total_spend: Number(row.total_spend ?? 0),
    visit_count: Number(row.visit_count ?? 0),
    no_show_count: Number(row.no_show_count ?? 0),
    reliability: (row.reliability ?? "good") as Customer["reliability"],
  }));
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  return listCustomers(query);
}
