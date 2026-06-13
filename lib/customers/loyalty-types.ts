export type RewardType = "visits" | "spend";

export type BusinessRewardConfig = {
  reward_enabled: boolean;
  reward_type: RewardType;
  reward_threshold: number;
  reward_description: string | null;
};

export type LoyaltyProgress = {
  reward_type: RewardType;
  current: number;
  threshold: number;
  remaining: number;
  percent: number;
  reward_pending: boolean;
  reward_description: string | null;
};
