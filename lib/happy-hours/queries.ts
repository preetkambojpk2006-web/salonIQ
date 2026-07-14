import type { HappyHourRecord } from "@/lib/pricing/types";
import { createClient } from "@/lib/supabase/server";

type HappyHourRow = {
  id: string;
  business_id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  discount_percent: number | string;
  is_active: boolean;
  created_at: string;
};

function normalizeTime(value: string): string {
  return value.slice(0, 5);
}

function mapHappyHourRow(row: HappyHourRow): HappyHourRecord {
  return {
    id: row.id,
    business_id: row.business_id,
    name: row.name,
    day_of_week: Number(row.day_of_week),
    start_time: normalizeTime(String(row.start_time)),
    end_time: normalizeTime(String(row.end_time)),
    discount_percent: Number(row.discount_percent),
    is_active: row.is_active,
    created_at: row.created_at,
  };
}

export async function listHappyHours(
  businessId: string
): Promise<HappyHourRecord[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("happy_hours")
    .select(
      "id, business_id, name, day_of_week, start_time, end_time, discount_percent, is_active, created_at"
    )
    .eq("business_id", businessId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("listHappyHours:", error.message);
    return [];
  }

  return ((data as HappyHourRow[] | null) ?? []).map(mapHappyHourRow);
}
