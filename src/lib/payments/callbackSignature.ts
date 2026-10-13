import { verify, timingSafeEqual } from 'node:crypto';
import { flittSignature } from './flitt';
// Published by BOG: https://api.bog.ge/docs/en/payments/standard-process/callback
const BOG_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQh
zHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q
1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrr
TYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvhx
tcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/g
4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhPn
PwIDAQAB
-----END PUBLIC KEY-----`;
export function verifyCallback(provider: string, raw: string, contentType: string, signature?: string | null): boolean {
  try {
    if (provider === 'bog') {
      return Boolean(signature && verify('RSA-SHA256', Buffer.from(raw), (process.env.BOG_CALLBACK_PUBLIC_KEY || BOG_PUBLIC_KEY).replace(/\\n/g, '\n'), Buffer.from(signature, 'base64')));
    }
    if (provider !== 'flitt' || !process.env.FLITT_SECRET_KEY) return false;
    const body = contentType.includes('application/json') ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw));
    const params = body.response || body;
    const received = String(params.signature || '').toLowerCase();
    const expected = flittSignature(process.env.FLITT_SECRET_KEY, params);
    return /^[a-f0-9]{40}$/.test(received) && timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  } catch { return false; }
}
