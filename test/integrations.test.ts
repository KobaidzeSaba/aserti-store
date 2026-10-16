import test from 'node:test';
import assert from 'node:assert/strict';
import { getGateway, getStoredGateway, providerAvailable } from '../src/lib/payments';
import { createShipment } from '../src/lib/shipping/quickshipper';
import { flittGateway, flittSignature } from '../src/lib/payments/flitt';
import { bogGateway } from '../src/lib/payments/bog';

const initial = { ...process.env };
test.afterEach(() => { process.env = { ...initial }; });

test('sandbox is explicit; live credentials never silently fall back to mock', () => {
  process.env.PAYMENTS_MODE = 'sandbox';
  process.env.BOG_CLIENT_ID = 'configured'; process.env.BOG_CLIENT_SECRET = 'configured';
  assert.equal(getGateway('bog').provider, 'sandbox');
  assert.equal(getStoredGateway('bog').provider, 'bog');
  process.env.PAYMENTS_MODE = 'live'; delete process.env.BOG_CLIENT_SECRET;
  assert.throws(() => getGateway('bog'));
  assert.equal(providerAvailable('bog'), false);
  delete process.env.PAYMENTS_MODE;
  assert.throws(() => getGateway('sandbox'));
});

test('courier requires explicit activation and never fabricates tracking after rejection', async t => {
  const request = { reference: 'AS-TEST', recipientName: 'Test', phone: '+995555000000', city: 'Tbilisi', address: 'Test', declaredValue: 100, weightGrams: 50 };
  let calls = 0; let body: any;
  t.mock.method(globalThis, 'fetch', async (_url: any, init: any) => { calls++; body = JSON.parse(init.body); return new Response('{}', { status: 500 }); });
  delete process.env.SHIPPING_MODE;
  await assert.rejects(createShipment(request)); assert.equal(calls, 0);
  Object.assign(process.env, { SHIPPING_MODE: 'live', QUICKSHIPPER_API_KEY: 'test', QUICKSHIPPER_SENDER_PHONE: '555000000', QUICKSHIPPER_SENDER_ADDRESS: 'Test', QUICKSHIPPER_SENDER_LAT: '41.7', QUICKSHIPPER_SENDER_LNG: '44.8' });
  delete process.env.QUICKSHIPPER_CLIENT_ID;
  await assert.rejects(createShipment(request), /uncertain/);
  assert.equal(calls, 1); assert.equal(body.cartWeight, .05);
  assert.equal(body.integrationOrderId, 'AS-TEST'); assert.ok(body.pickUpInfo); assert.ok(body.dropOffInfo); assert.ok(body.provider);
});

test('Flitt only settles a signed response for the expected merchant, order and amount', async t => {
  Object.assign(process.env, { FLITT_MERCHANT_ID: '123', FLITT_SECRET_KEY: 'secret' });
  const response: Record<string, string | number> = { response_status: 'success', order_status: 'approved', order_id: 'AS-TEST', merchant_id: 123, amount: 10000, currency: 'GEL' };
  t.mock.method(globalThis, 'fetch', async () => { response.signature = flittSignature('secret', response); return Response.json({ response }); });
  assert.equal(await flittGateway.getStatus('id', 'AS-TEST', { amount: 100, currency: 'GEL' }), 'paid');
  await assert.rejects(flittGateway.getStatus('id', 'AS-OTHER', { amount: 100, currency: 'GEL' }), /identity/);
  await assert.rejects(flittGateway.getStatus('id', 'AS-TEST', { amount: 200, currency: 'GEL' }), /amount/);
});

test('BOG status errors are retryable and receipts must match the purchase', async t => {
  Object.assign(process.env, { BOG_CLIENT_ID: 'test', BOG_CLIENT_SECRET: 'test' });
  let receiptStatus = 200;
  t.mock.method(globalThis, 'fetch', async (url: any) => String(url).includes('openid-connect') ? Response.json({ access_token: 'test' }) : Response.json({ order_id: 'id', external_order_id: 'AS-TEST', order_status: { key: 'completed' }, purchase_units: { request_amount: 100, currency_code: 'GEL' } }, { status: receiptStatus }));
  assert.equal(await bogGateway.getStatus('id', 'AS-TEST', { amount: 100, currency: 'GEL' }), 'paid');
  await assert.rejects(bogGateway.getStatus('id', 'AS-TEST', { amount: 200, currency: 'GEL' }), /amount/);
  receiptStatus = 503;
  await assert.rejects(bogGateway.getStatus('id', 'AS-TEST'), /unavailable/);
});

test('callbacks reject altered Flitt payloads and validate raw RSA signatures for BOG', async () => {
  const { verifyCallback } = await import('../src/lib/payments/callbackSignature');
  const { generateKeyPairSync, sign } = await import('node:crypto');
  process.env.FLITT_SECRET_KEY = 'secret';
  const body: Record<string, string | number> = { order_id: 'AS-TEST', amount: 10000, order_status: 'approved' };
  body.signature = flittSignature('secret', body);
  assert.equal(verifyCallback('flitt', JSON.stringify(body), 'application/json'), true);
  body.amount = 1;
  assert.equal(verifyCallback('flitt', JSON.stringify(body), 'application/json'), false);
  const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  process.env.BOG_CALLBACK_PUBLIC_KEY = keys.publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const raw = '{"body":{"order_id":"123"}}';
  const signature = sign('RSA-SHA256', Buffer.from(raw), keys.privateKey).toString('base64');
  assert.equal(verifyCallback('bog', raw, 'application/json', signature), true);
  assert.equal(verifyCallback('bog', raw + ' ', 'application/json', signature), false);
});

test('email transport errors propagate to the durable job instead of silently succeeding', async t => {
  const { default: nodemailer } = await import('nodemailer');
  const { sendOrderConfirmationEmail } = await import('../src/lib/email');
  const order = { reference: 'TEST', email: 'test@example.invalid', customerName: 'Test', city: 'Tbilisi', address: 'Test', subtotal: 100, shippingCost: 0, total: 100, trackingCode: null, items: [] };
  process.env.EMAIL_MODE = 'disabled';
  await assert.rejects(sendOrderConfirmationEmail(order, 'en'), /disabled/);
  Object.assign(process.env, { EMAIL_MODE: 'live', SMTP_HOST: 'smtp.example.invalid', SMTP_FROM: 'test@example.invalid' });
  t.mock.method(nodemailer, 'createTransport', () => ({ sendMail: async () => { throw new Error('Connection failed'); } }));
  await assert.rejects(sendOrderConfirmationEmail(order, 'en'), /delivery failed/);
});

test('provider test mode enables only the public Flitt test merchant and live mode rejects it', () => {
  Object.assign(process.env, { PAYMENTS_MODE: 'test', FLITT_MERCHANT_ID: '1549901', FLITT_SECRET_KEY: 'test', BOG_CLIENT_ID: 'configured', BOG_CLIENT_SECRET: 'configured' });
  assert.equal(getGateway('flitt').provider, 'flitt');
  assert.equal(providerAvailable('bog'), false);
  process.env.PAYMENTS_MODE = 'live';
  assert.throws(() => getGateway('flitt'));
  process.env.PAYMENTS_MODE = 'test'; process.env.FLITT_MERCHANT_ID = '123';
  assert.throws(() => getGateway('flitt'));
});
