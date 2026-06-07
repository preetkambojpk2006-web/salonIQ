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
  created_at: string;
};
