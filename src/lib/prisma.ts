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

function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
