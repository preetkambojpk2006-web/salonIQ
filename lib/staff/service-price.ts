import type { SupabaseClient } from "@supabase/supabase-js";

type PriceClient = Pick<SupabaseClient, "from">;

export type StaffServicePriceOverride = {
  id: string;
  business_id: string;
  staff_id: string;
  service_id: string;
  price: number;
};

export type PublicStaffServicePrice = {
  staff_name: string;
  service_name: string;
  price: number;
};

/** Resolve price for staff+service; falls back to service default (never null). */
export async function resolveServicePrice(
  businessId: string,
  staffId: string | null | undefined,
  serviceId: string,
  supabase: PriceClient
): Promise<number> {
  if (staffId) {
    const { data: override } = await supabase
      .from("staff_service_prices")
      .select("price")
      .eq("business_id", businessId)
      .eq("staff_id", staffId)
      .eq("service_id", serviceId)
      .maybeSingle();

    if (override?.price != null) {
      const overridePrice = Number(override.price);
      if (Number.isFinite(overridePrice) && overridePrice >= 0) {
        return overridePrice;
      }
    }
  }

  const { data: service } = await supabase
    .from("services")
    .select("price")
    .eq("business_id", businessId)
    .eq("id", serviceId)
    .maybeSingle();

  const defaultPrice = Number(service?.price ?? 0);
  return Number.isFinite(defaultPrice) && defaultPrice >= 0 ? defaultPrice : 0;
}

export function resolvePublicServicePrice(params: {
  serviceName: string;
  defaultPrice: number;
  staffName?: string | null;
  overrides?: PublicStaffServicePrice[];
}): number {
  const staffName = params.staffName?.trim();
  if (!staffName) {
    return params.defaultPrice;
  }

  const match = (params.overrides ?? []).find(
    (row) =>
      row.staff_name === staffName && row.service_name === params.serviceName
  );

  if (match) {
    const price = Number(match.price);
    if (Number.isFinite(price) && price >= 0) {
      return price;
    }
  }

  return params.defaultPrice;
}
