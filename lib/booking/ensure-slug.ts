import { createClient } from "@/lib/supabase/server";

export async function ensureBusinessBookingSlug(
  businessId: string,
  businessName: string
): Promise<string | null> {
  const supabase = createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("businesses")
    .select("booking_slug")
    .eq("id", businessId)
    .maybeSingle();

  if (fetchError) {
    console.error("ensureBusinessBookingSlug fetch:", fetchError.message);
    return null;
  }

  if (existing?.booking_slug) {
    return existing.booking_slug;
  }

  const { data: slug, error: slugError } = await supabase.rpc(
    "generate_booking_slug",
    {
      p_name: businessName,
      p_business_id: businessId,
    }
  );

  if (slugError || !slug) {
    console.error("ensureBusinessBookingSlug rpc:", slugError?.message);
    return null;
  }

  const { error: updateError } = await supabase
    .from("businesses")
    .update({ booking_slug: slug })
    .eq("id", businessId);

  if (updateError) {
    console.error("ensureBusinessBookingSlug update:", updateError.message);
    return null;
  }

  return slug as string;
}
