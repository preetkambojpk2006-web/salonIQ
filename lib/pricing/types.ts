export type HappyHourRule = {
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  discount_percent: number;
  is_active?: boolean;
};

export type HappyHourMatch = {
  discountPercent: number;
  ruleName: string;
};

export type HappyHourRecord = {
  id: string;
  business_id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  discount_percent: number;
  is_active: boolean;
  created_at: string;
};
