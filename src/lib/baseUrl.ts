/**
 * Resolve the public base URL of the site.
 *
 * Priority:
 *  1. NEXT_PUBLIC_BASE_URL (explicit — set this for a custom domain)
 *  2. The incoming request origin (when available)
 *  3. Vercel-provided deployment URLs (zero-config on Vercel)
 *  4. localhost fallback (dev)
 */
export function getBaseUrl(req?: { nextUrl: { origin: string } }): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  if (req?.nextUrl?.origin) return req.nextUrl.origin;

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd}`;

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}
