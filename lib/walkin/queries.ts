import { getDayBoundsIso } from "@/lib/payments/date-utils";
import { createClient } from "@/lib/supabase/server";

export type WalkinQueueStatus =
  | "waiting"
  | "called"
  | "in_service"
  | "done"
  | "left"
  | "no_show";

export type WalkinQueueRow = {
  id: string;
  business_id: string;
  customer_name: string;
  customer_phone: string;
  public_token: string;
  daily_token_number: number;
  status: WalkinQueueStatus;
  joined_at: string;
  called_at: string | null;
  service_started_at: string | null;
  completed_at: string | null;
  estimated_wait_mins: number | null;
};

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
  const { startIso, endIsoExclusive } = getDayBoundsIso();

  const { data, error } = await supabase
    .from("walkin_queue")
    .select("*")
    .eq("business_id", businessId)
    .gte("joined_at", startIso)
    .lt("joined_at", endIsoExclusive)
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
