import { createClient } from "@/lib/supabase/server";
import type { WalkinQueueRow, WalkinQueueStatus } from "@/lib/walkin/types";

export type { WalkinQueueRow, WalkinQueueStatus } from "@/lib/walkin/types";

const VALID_STATUSES: WalkinQueueStatus[] = [
  "waiting",
  "called",
  "in_service",
  "done",
  "left",
  "no_show",
];

export async function listTodayWalkinQueue(
  businessId: string
): Promise<WalkinQueueRow[]> {
  const supabase = createClient();

  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const nowInIst = new Date(now.getTime() + istOffsetMs);
  nowInIst.setUTCHours(0, 0, 0, 0);
  const startOfTodayUtc = new Date(nowInIst.getTime() - istOffsetMs);

  const { data, error } = await supabase
    .from("walkin_queue")
    .select("*")
    .eq("business_id", businessId)
    .in("status", VALID_STATUSES)
    .gte("joined_at", startOfTodayUtc.toISOString())
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("listTodayWalkinQueue:", error.message);
    return [];
  }

  return (data ?? []) as WalkinQueueRow[];
}

export async function updateWalkinStatus(
  id: string,
  status: string,
  extraFields?: Partial<WalkinQueueRow>
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!VALID_STATUSES.includes(status as WalkinQueueStatus)) {
    return { ok: false, error: "Invalid walk-in status" };
  }

  const supabase = createClient();
  const payload = {
    status,
    ...extraFields,
  };

  const { data, error } = await supabase
    .from("walkin_queue")
    .update(payload)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("updateWalkinStatus:", error.message);
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: "Could not update walk-in entry" };
  }

  return { ok: true };
}
