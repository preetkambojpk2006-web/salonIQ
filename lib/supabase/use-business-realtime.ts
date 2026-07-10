"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Tables with a business_id column, enabled for tenant-scoped realtime refresh. */
export const REALTIME_TABLE_SETS = {
  calendar: ["appointments", "payments"] as const,
  today: ["appointments", "payments"] as const,
  money: ["payments", "staff_earnings"] as const,
  attendance: ["staff_attendance"] as const,
} as const;

export type RealtimeTableSet = keyof typeof REALTIME_TABLE_SETS;

type UseBusinessRealtimeRefreshOptions = {
  businessId: string | null | undefined;
  tableSet: RealtimeTableSet;
  enabled?: boolean;
  debounceMs?: number;
};

/**
 * Subscribes to Supabase Realtime postgres_changes for the current business.
 * Debounced router.refresh() re-runs server components without polling.
 */
export function useBusinessRealtimeRefresh({
  businessId,
  tableSet,
  enabled = true,
  debounceMs = 400,
}: UseBusinessRealtimeRefreshOptions) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !businessId) {
      return;
    }

    const tables = REALTIME_TABLE_SETS[tableSet];
    const supabase = createClient();
    const channelName = `realtime:${tableSet}:${businessId}`;

    const scheduleRefresh = () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        router.refresh();
      }, debounceMs);
    };

    let channel = supabase.channel(channelName);

    for (const table of tables) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `business_id=eq.${businessId}`,
        },
        scheduleRefresh
      );
    }

    channel.subscribe();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [businessId, debounceMs, enabled, router, tableSet]);
}
