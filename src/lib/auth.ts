import crypto from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "aserti_admin";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

/** The configured signing secret, or null if the operator set none. */
function configuredSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

function secret(): string {
  // The dev fallback is only ever used for local signing; isAuthenticated()
  // refuses to accept cookies when no real secret is configured, so a token
  // signed with this fallback can never authenticate in a real deployment.
  return configuredSecret() ?? "aserti-dev-secret-change-me";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Validate a username/password pair against the configured admin credentials. */
export function checkCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD || "";
  if (!expectedPass) return false; // refuse login if no password is configured
  return safeEqual(username, expectedUser) && safeEqual(password, expectedPass);
}

/** Create a signed session token of the form "<expiry>.<hmac>". */
export function createSessionToken(): string {
  const expiry = String(Date.now() + SESSION_TTL_MS);
  return `${expiry}.${sign(expiry)}`;
}

function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expiry, sig] = token.split(".");
  if (!expiry || !sig) return false;
  if (!safeEqual(sig, sign(expiry))) return false;
  return Number(expiry) > Date.now();
}

/** True when the current request carries a valid admin session cookie. */
export function isAuthenticated(): boolean {
  // Fail closed: without a configured secret, reject everything (prevents a
  // cookie forged with the public dev fallback from granting admin access).
  if (!configuredSecret()) return false;
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}
