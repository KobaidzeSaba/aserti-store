import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma';
import { markOrderPaid, markOrderFailed } from '../src/lib/orders';
const url = new URL(process.env.DATABASE_URL || 'http://invalid');
if (url.hostname !== '127.0.0.1' || url.pathname !== '/aserti_test') throw new Error('Database tests require the isolated local aserti_test database');
process.env.SHIPPING_MODE = 'manual';
process.env.EMAIL_MODE = 'disabled';
const refs: string[] = [];
async function order(provider: string) {
  const reference = `TEST-${crypto.randomUUID()}`; refs.push(reference);
  return prisma.order.create({ data: { reference, paymentProvider: provider, paymentId: 'test-payment', total: 100, subtotal: 100, customerName: 'Integration test', email: 'test@example.invalid', phone: '555000000', city: 'Tbilisi', address: 'Test' } });
}
test.after(async () => {
  await prisma.integrationJob.deleteMany({ where: { reference: { in: refs } } });
  await prisma.order.deleteMany({ where: { reference: { in: refs } } });
  await prisma.$disconnect();
});
test('concurrent settlement produces one payment transition and one pair of durable jobs', async () => {
  const created = await order('bog');
  await Promise.all(Array.from({ length: 12 }, () => markOrderPaid(created.reference, 'test-payment')));
  const settled = await prisma.order.findUniqueOrThrow({ where: { reference: created.reference } });
  const jobs = await prisma.integrationJob.findMany({ where: { reference: created.reference } });
  assert.equal(settled.status, 'paid'); assert.ok(settled.paidAt); assert.equal(settled.trackingCode, null);
  assert.equal(jobs.length, 2); assert.ok(jobs.every(job => job.status === 'blocked' && job.attempts === 1));
});
test('concurrent failed callbacks cannot overwrite successful settlement', async () => {
  const created = await order('sandbox');
  await Promise.all([markOrderFailed(created.reference), markOrderPaid(created.reference), markOrderFailed(created.reference)]);
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { reference: created.reference } })).status, 'paid');
  assert.equal(await prisma.integrationJob.count({ where: { reference: created.reference } }), 0);
});

test('duplicate callbacks make exactly one courier request and retain real tracking', async t => {
  Object.assign(process.env, { SHIPPING_MODE: 'live', QUICKSHIPPER_API_KEY: 'test', QUICKSHIPPER_SENDER_PHONE: '555000000', QUICKSHIPPER_SENDER_ADDRESS: 'Test', QUICKSHIPPER_SENDER_LAT: '41.7', QUICKSHIPPER_SENDER_LNG: '44.8' });
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => { requests++; return Response.json({ success: true, orderId: 123, trackingUrl: 'https://example.invalid/track/123' }); });
  const created = await order('bog');
  await Promise.all(Array.from({ length: 12 }, () => markOrderPaid(created.reference)));
  const settled = await prisma.order.findUniqueOrThrow({ where: { reference: created.reference } });
  assert.equal(requests, 1); assert.equal(settled.shipmentId, '123'); assert.equal(settled.trackingCode, 'https://example.invalid/track/123');
  process.env.SHIPPING_MODE = 'manual';
});

test('provider test orders never create fulfillment jobs even with live side effects enabled', async () => {
  const created = await order('flitt');
  await prisma.order.update({ where: { reference: created.reference }, data: { isTest: true } });
  process.env.SHIPPING_MODE = 'live'; process.env.EMAIL_MODE = 'live';
  await markOrderPaid(created.reference);
  assert.equal(await prisma.integrationJob.count({ where: { reference: created.reference } }), 0);
  const settled = await prisma.order.findUniqueOrThrow({ where: { reference: created.reference } });
  assert.equal(settled.status, 'paid'); assert.equal(settled.shipmentId, null);
  process.env.SHIPPING_MODE = 'manual'; process.env.EMAIL_MODE = 'disabled';
});
