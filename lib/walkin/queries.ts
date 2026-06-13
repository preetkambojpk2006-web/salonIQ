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

function startOfTodayIstIso(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const todayIst = new Date(now.getTime() + istOffset);
  todayIst.setUTCHours(0, 0, 0, 0);
  const startOfTodayIst = new Date(todayIst.getTime() - istOffset);
  return startOfTodayIst.toISOString();
}

export async function listTodayWalkinQueue(
  businessId: string
): Promise<WalkinQueueRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("walkin_queue")
    .select("*")
    .eq("business_id", businessId)
    .in("status", VALID_STATUSES)
    .gte("joined_at", startOfTodayIstIso())
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
