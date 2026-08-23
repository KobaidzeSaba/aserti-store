import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

// Neon's serverless driver talks to the database over WebSocket/HTTP instead of
// a raw TCP socket. This is reliable on Vercel's serverless functions (where raw
// TCP to Neon can fail/time out) and wakes suspended computes instantly.
// In Node it needs a WebSocket implementation.
neonConfig.webSocketConstructor = ws;
// Route one-shot queries over HTTPS fetch (fast, and avoids the WebSocket path
// for the common read case); transactions still use the WebSocket connection.
neonConfig.poolQueryViaFetch = true;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// The Neon serverless driver authenticates over a proxied transport that can't
// perform SCRAM channel binding, so a `channel_binding=require` parameter in the
// URL (Neon includes it by default) causes "password authentication failed".
// Strip it defensively so the exact same URL works for the serverless driver.
function sanitizeConnectionString(url?: string): string | undefined {
  if (!url) return url;
  try {
    const u = new URL(url);
    u.searchParams.delete("channel_binding");
    return u.toString();
  } catch {
    return url;
  }
}

function createPrisma(): PrismaClient {
  const connectionString = sanitizeConnectionString(process.env.DATABASE_URL);
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
