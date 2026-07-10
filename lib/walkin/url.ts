import { getSiteUrl } from "@/lib/site-url";

export function buildPublicQueuePath(slug: string): string {
  return `/queue/${encodeURIComponent(slug)}`;
}

export function buildPublicQueueUrl(slug: string, origin?: string): string {
  const base = origin ?? getSiteUrl();
  return `${base.replace(/\/+$/, "")}${buildPublicQueuePath(slug)}`;
}
