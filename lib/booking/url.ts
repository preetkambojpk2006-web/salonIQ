export function buildPublicBookingPath(slug: string): string {
  return `/book/${encodeURIComponent(slug)}`;
}

export function buildPublicBookingUrl(slug: string, origin?: string): string {
  const base =
    origin ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://salon-iq-five.vercel.app";
  return `${base.replace(/\/$/, "")}${buildPublicBookingPath(slug)}`;
}

export function buildWhatsAppShareUrl(bookingUrl: string, salonName: string): string {
  const message = `Namaste! ${salonName} par apni appointment yahan book karein: ${bookingUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
