import type { CustomerReliability } from "@/lib/customers/types";
import { createClient } from "@/lib/supabase/server";

export type { CustomerReliability } from "@/lib/customers/types";

export function reliabilityFromNoShowCount(count: number): CustomerReliability {
  if (count >= 4) return "blacklisted";
  if (count >= 2) return "warning";
  return "good";
}

export async function incrementCustomerNoShowCount(
  customerId: string,
  businessId: string
): Promise<void> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("no_show_count")
    .eq("id", customerId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    console.error("incrementCustomerNoShowCount select:", error.message);
    return;
  }

  if (!data) {
    return;
  }

  const newCount = Number(data.no_show_count ?? 0) + 1;
  const reliability = reliabilityFromNoShowCount(newCount);

  const { error: updateError } = await supabase
    .from("customers")
    .update({ no_show_count: newCount, reliability })
    .eq("id", customerId)
    .eq("business_id", businessId);

  if (updateError) {
    console.error("incrementCustomerNoShowCount update:", updateError.message);
  }
}
