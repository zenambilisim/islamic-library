/**
 * Canonical site origin for SEO (robots, sitemap, OG).
 * Prefers NEXT_PUBLIC_SITE_URL, then VERCEL_URL.
 */
export function getSiteBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  return 'http://localhost:3000';
}
