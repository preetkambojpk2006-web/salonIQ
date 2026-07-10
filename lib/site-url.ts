const DEFAULT_SITE_URL = "https://saloniq.in";

/** Canonical site origin (no trailing slash). Safe on server and client. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, "");
}

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}
