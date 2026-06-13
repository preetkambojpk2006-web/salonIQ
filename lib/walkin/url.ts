export function buildPublicQueuePath(slug: string): string {
  return `/queue/${encodeURIComponent(slug)}`;
}

export function buildPublicQueueUrl(slug: string, origin?: string): string {
  const base =
    origin ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://salon-iq-five.vercel.app";
  return `${base.replace(/\/$/, "")}${buildPublicQueuePath(slug)}`;
}
