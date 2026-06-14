import { createClient } from "@/lib/supabase/server";

const BLOCKING_STATUSES = ["pending", "confirmed", "completed"] as const;

function toMs(iso: string): number {
  return new Date(iso).getTime();
}

function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

export async function hasAppointmentOverlap(params: {
  businessId: string;
  staffName: string | null;
  startTime: string;
  endTime: string;
  excludeAppointmentId?: string;
}): Promise<boolean> {
  const staff = params.staffName?.trim();
  if (!staff) return false;

  const supabase = createClient();
  const startMs = toMs(params.startTime);
  const endMs = toMs(params.endTime);

  const { data, error } = await supabase
    .from("appointments")
    .select("id, start_time, end_time")
    .eq("business_id", params.businessId)
    .ilike("staff_name", staff)
    .in("status", [...BLOCKING_STATUSES]);

  if (error || !data?.length) {
    return false;
  }

  return data.some((row) => {
    if (params.excludeAppointmentId && row.id === params.excludeAppointmentId) {
      return false;
    }
    const rowStart = toMs(row.start_time);
    const rowEnd = row.end_time ? toMs(row.end_time) : rowStart + 3_600_000;
    return rangesOverlap(startMs, endMs, rowStart, rowEnd);
  });
}
