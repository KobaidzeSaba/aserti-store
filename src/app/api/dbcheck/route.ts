import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * TEMPORARY diagnostic. Reports what DATABASE_URL the running function sees
 * (host/user/password length + a non-reversible hash — never the password)
 * and whether a live query works. Remove after debugging.
 */
export async function GET() {
  const url = process.env.DATABASE_URL || "";
  const info: Record<string, unknown> = { hasUrl: Boolean(url) };

  try {
    const u = new URL(url);
    info.host = u.hostname;
    info.user = u.username;
    info.pwLen = u.password.length;
    info.pwSha8 = u.password
      ? crypto.createHash("sha256").update(u.password).digest("hex").slice(0, 8)
      : null;
    info.params = u.search;
  } catch (e) {
    info.parseError = String(e);
  }

  try {
    const count = await prisma.product.count();
    info.query = `OK: ${count} products`;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    info.query = `FAIL: ${msg.split("\n").map((l) => l.trim()).filter(Boolean)[0]?.slice(0, 160)}`;
  }

  return NextResponse.json(info);
}
