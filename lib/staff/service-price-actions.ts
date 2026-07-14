"use server";

import { getOwnerBusinessId } from "@/lib/customers/queries";
import {
  applyHappyHourDiscount,
  resolveHappyHourDiscount,
} from "@/lib/pricing/happy-hours";
import { resolveServicePrice } from "@/lib/staff/service-price";
import { createClient } from "@/lib/supabase/server";

export type ResolvedServicePriceResult =
  | {
      ok: true;
      price: number;
      originalPrice?: number;
      happyHour?: { discountPercent: number; ruleName: string };
    }
  | { ok: false; error: string };

export async function getResolvedServicePrice(
  staffId: string | null,
  serviceId: string,
  bookingDateTimeIso?: string | null
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
  const basePrice = await resolveServicePrice(
    businessId,
    staffId?.trim() || null,
    trimmedServiceId,
    supabase
  );

  const bookingDateTime = bookingDateTimeIso?.trim();
  if (!bookingDateTime) {
    return { ok: true, price: basePrice };
  }

  const happyHour = await resolveHappyHourDiscount(
    businessId,
    bookingDateTime,
    supabase
  );

  if (!happyHour) {
    return { ok: true, price: basePrice };
  }

  return {
    ok: true,
    price: applyHappyHourDiscount(basePrice, happyHour.discountPercent),
    originalPrice: basePrice,
    happyHour,
  };
}
