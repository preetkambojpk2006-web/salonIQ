import type { BusinessRewardConfig } from "@/lib/customers/loyalty-types";
import { createClient } from "@/lib/supabase/server";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

type CustomerLoyaltyRow = {
  visit_count: number | string;
  total_spend: number | string;
  loyalty_baseline_visits: number | string;
  loyalty_baseline_spend: number | string;
  reward_pending: boolean;
};

export async function getBusinessRewardConfig(
  businessId: string
): Promise<BusinessRewardConfig | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("businesses")
    .select(
      "reward_enabled, reward_type, reward_threshold, reward_description"
    )
    .eq("id", businessId)
    .maybeSingle();

  if (error) {
    console.error("getBusinessRewardConfig:", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    reward_enabled: Boolean(data.reward_enabled),
    reward_type: data.reward_type === "spend" ? "spend" : "visits",
    reward_threshold: roundMoney(Number(data.reward_threshold ?? 0)),
    reward_description: data.reward_description?.trim() || null,
  };
}

/**
 * Idempotent: each appointment counts at most once (loyalty_counted_at claim).
 * Increments visit_count + total_spend, then flags reward_pending if threshold met.
 */
export async function recordCustomerLoyaltyForPayment(params: {
  businessId: string;
  appointmentId: string;
  customerId: string;
  amount: number;
  paidAt: string;
}): Promise<{ rewardEarned: boolean }> {
  const supabase = createClient();
  const paidAmount = roundMoney(Math.max(0, params.amount));

  const { data: claimed, error: claimError } = await supabase
    .from("appointments")
    .update({ loyalty_counted_at: params.paidAt })
    .eq("id", params.appointmentId)
    .eq("business_id", params.businessId)
    .is("loyalty_counted_at", null)
    .select("id")
    .maybeSingle();

  if (claimError) {
    console.error("recordCustomerLoyaltyForPayment claim:", claimError.message);
    return { rewardEarned: false };
  }

  if (!claimed?.id) {
    return { rewardEarned: false };
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select(
      "visit_count, total_spend, loyalty_baseline_visits, loyalty_baseline_spend, reward_pending"
    )
    .eq("id", params.customerId)
    .eq("business_id", params.businessId)
    .maybeSingle();

  if (customerError) {
    console.error("recordCustomerLoyaltyForPayment customer:", customerError.message);
    return { rewardEarned: false };
  }

  if (!customer) {
    return { rewardEarned: false };
  }

  const row = customer as CustomerLoyaltyRow;
  const newVisitCount = Number(row.visit_count ?? 0) + 1;
  const newTotalSpend = roundMoney(Number(row.total_spend ?? 0) + paidAmount);

  const customerUpdate: Record<string, unknown> = {
    visit_count: newVisitCount,
    total_spend: newTotalSpend,
    last_visit_at: params.paidAt,
  };

  const config = await getBusinessRewardConfig(params.businessId);
  let rewardEarned = false;

  if (config?.reward_enabled && config.reward_threshold > 0 && !row.reward_pending) {
    const baselineVisits = Number(row.loyalty_baseline_visits ?? 0);
    const baselineSpend = roundMoney(Number(row.loyalty_baseline_spend ?? 0));

    const thresholdMet =
      config.reward_type === "spend"
        ? newTotalSpend - baselineSpend >= config.reward_threshold
        : newVisitCount - baselineVisits >= config.reward_threshold;

    if (thresholdMet) {
      customerUpdate.reward_pending = true;
      customerUpdate.reward_earned_at = params.paidAt;
      rewardEarned = true;
    }
  }

  const { error: updateError } = await supabase
    .from("customers")
    .update(customerUpdate)
    .eq("id", params.customerId)
    .eq("business_id", params.businessId);

  if (updateError) {
    console.error("recordCustomerLoyaltyForPayment update:", updateError.message);
    return { rewardEarned: false };
  }

  return { rewardEarned };
}
