export type CustomerReliability = "good" | "warning" | "blacklisted";

export type Customer = {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  gender: string | null;
  birthday: string | null;
  notes: string | null;
  tags: string[] | null;
  total_spend: number;
  visit_count: number;
  last_visit_at: string | null;
  no_show_count: number;
  reliability: CustomerReliability;
  reward_pending: boolean;
  reward_earned_at: string | null;
  reward_notified_at: string | null;
  reward_redeemed_at: string | null;
  loyalty_baseline_visits: number;
  loyalty_baseline_spend: number;
  created_at: string;
};
