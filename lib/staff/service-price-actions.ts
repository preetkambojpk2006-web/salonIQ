"use server";

import { getOwnerBusinessId } from "@/lib/customers/queries";
import { resolveServicePrice } from "@/lib/staff/service-price";
import { createClient } from "@/lib/supabase/server";

export type ResolvedServicePriceResult =
  | { ok: true; price: number }
  | { ok: false; error: string };

export async function getResolvedServicePrice(
  staffId: string | null,
  serviceId: string
): Promise<ResolvedServicePriceResult> {
  const businessId = await getOwnerBusinessId();
  if (!businessId) {
    return { ok: false, error: "Set up your salon first." };
  }

  const trimmedServiceId = serviceId?.trim();
  if (!trimmedServiceId) {
    return { ok: false, error: "Service missing." };
  }

  const supabase = createClient();
  const price = await resolveServicePrice(
    businessId,
    staffId?.trim() || null,
    trimmedServiceId,
    supabase
  );

  return { ok: true, price };
}
