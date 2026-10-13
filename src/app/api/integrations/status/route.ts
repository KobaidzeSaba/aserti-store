import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { integrationStatus } from '@/lib/integrationConfig';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const secret = process.env.INTEGRATIONS_HEALTH_SECRET;
  const provided = req.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  if (!secret || Buffer.byteLength(provided) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await prisma.$queryRaw`SELECT 1`;
    const outstandingJobs = await prisma.integrationJob.count({ where: { status: { not: 'succeeded' } } });
    return NextResponse.json({ ...integrationStatus(), database: true, outstandingJobs }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ ...integrationStatus(), database: false }, { status: 503 }); }
}
