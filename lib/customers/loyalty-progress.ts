import type { BusinessRewardConfig, LoyaltyProgress } from "@/lib/customers/loyalty-types";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeLoyaltyProgress(
  customer: {
    visit_count: number;
    total_spend: number;
    loyalty_baseline_visits: number;
    loyalty_baseline_spend: number;
    reward_pending: boolean;
  },
  config: BusinessRewardConfig
): LoyaltyProgress | null {
  if (!config.reward_enabled || config.reward_threshold <= 0) {
    return null;
  }

  const current =
    config.reward_type === "spend"
      ? roundMoney(customer.total_spend - customer.loyalty_baseline_spend)
      : Math.max(0, customer.visit_count - customer.loyalty_baseline_visits);

  const threshold = config.reward_threshold;
  const remaining = Math.max(0, threshold - current);
  const percent = Math.min(100, Math.round((current / threshold) * 100));

  return {
    reward_type: config.reward_type,
    current,
    threshold,
    remaining,
    percent,
    reward_pending: customer.reward_pending,
    reward_description: config.reward_description,
  };
}

export function formatLoyaltyProgressLine(progress: LoyaltyProgress): string {
  const rewardLabel = progress.reward_description?.trim() || "reward";

  if (progress.reward_pending) {
    return `🎁 Reward ready — ${rewardLabel}!`;
  }

  if (progress.reward_type === "visits") {
    const current = Math.floor(progress.current);
    const threshold = Math.floor(progress.threshold);
    const remaining = Math.ceil(progress.remaining);

    if (remaining <= 0) {
      return `${current}/${threshold} visits — ${rewardLabel} milne wala hai!`;
    }

    const visitWord = remaining === 1 ? "visit" : "visits";
    return `${current}/${threshold} visits — ${remaining} aur ${visitWord}, phir ${rewardLabel}!`;
  }

  const current = roundMoney(progress.current);
  const threshold = roundMoney(progress.threshold);
  const remaining = roundMoney(progress.remaining);

  if (remaining <= 0) {
    return `₹${current.toLocaleString("en-IN")}/₹${threshold.toLocaleString("en-IN")} — ${rewardLabel} milne wala hai!`;
  }

  return `₹${current.toLocaleString("en-IN")}/₹${threshold.toLocaleString("en-IN")} — ₹${remaining.toLocaleString("en-IN")} aur spend karein, phir ${rewardLabel}!`;
}
