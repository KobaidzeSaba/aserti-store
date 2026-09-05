/**
 * Resolve the public base URL of the site.
 *
 * SECURITY: the incoming request's origin is derived from the Host header,
 * which the client controls. Since this URL is used to build payment
 * return/callback URLs, we must NOT trust the request Host on a trusted host
 * like Vercel — a spoofed Host could redirect the customer to an attacker
 * (open redirect / phishing) or point the bank's callback at the attacker.
 *
 * Priority (most trusted first):
 *  1. NEXT_PUBLIC_BASE_URL   — explicit, operator-configured (set this in prod)
 *  2. VERCEL_PROJECT_PRODUCTION_URL — set by the platform, not client-controllable
 *  3. VERCEL_URL             — per-deployment, platform-set
 *  4. request origin         — only used when no trusted value exists (local dev)
 *  5. localhost fallback
 */
export function getBaseUrl(req?: { nextUrl: { origin: string } }): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd}`;

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  if (req?.nextUrl?.origin) return req.nextUrl.origin;

  return "http://localhost:3000";
}
