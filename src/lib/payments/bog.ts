import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentGateway,
  PaymentStatus,
} from "./types";
import { PaymentConfigError } from "./types";

/**
 * Bank of Georgia — E-Commerce API gateway.
 *
 * Flow (per BOG e-commerce docs):
 *  1. OAuth2 client-credentials -> access token (oauth2.bog.ge)
 *  2. POST /payments/v1/ecommerce/orders -> { id, _links.redirect.href }
 *  3. Redirect customer to the redirect href.
 *  4. BOG calls our callback_url with the order id; we fetch the receipt
 *     via GET /payments/v1/receipt/{id} to confirm status.
 *
 * Endpoints are centralised here; verify exact paths against your BOG
 * merchant onboarding documentation before going live.
 */

const AUTH_URL =
  "https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token";

function apiBase(): string {
  return process.env.BOG_API_BASE?.replace(/\/$/, "") || "https://api.bog.ge";
}

function requireCreds() {
  const clientId = process.env.BOG_CLIENT_ID;
  const clientSecret = process.env.BOG_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new PaymentConfigError(
      "BOG credentials missing (BOG_CLIENT_ID / BOG_CLIENT_SECRET).",
    );
  }
  return { clientId, clientSecret };
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret } = requireCreds();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`BOG auth failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export const bogGateway: PaymentGateway = {
  provider: "bog",

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const token = await getAccessToken();

    const body = {
      callback_url: input.callbackUrl,
      external_order_id: input.reference,
      purchase_units: {
        currency: input.currency,
        total_amount: Number(input.amount.toFixed(2)),
        basket: input.basket.map((b, i) => ({
          product_id: `item-${i + 1}`,
          description: b.name,
          quantity: b.quantity,
          unit_price: Number(b.unitPrice.toFixed(2)),
        })),
      },
      redirect_urls: {
        success: input.returnUrl,
        fail: input.returnUrl,
      },
    };

    const res = await fetch(`${apiBase()}/payments/v1/ecommerce/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept-Language": input.locale,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`BOG create order failed: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as {
      id: string;
      _links?: { redirect?: { href?: string } };
    };
    const redirectUrl = data._links?.redirect?.href;
    if (!redirectUrl) throw new Error("BOG response missing redirect link.");

    return { redirectUrl, providerPaymentId: data.id };
  },

  async getStatus(providerPaymentId: string): Promise<PaymentStatus> {
    const token = await getAccessToken();
    const res = await fetch(
      `${apiBase()}/payments/v1/receipt/${encodeURIComponent(providerPaymentId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) return "pending";

    const data = (await res.json()) as {
      order_status?: { key?: string };
    };
    const key = (data.order_status?.key || "").toLowerCase();
    if (["completed", "success", "captured", "paid"].includes(key)) return "paid";
    if (["rejected", "failed", "error", "expired", "cancelled"].includes(key))
      return "failed";
    return "pending";
  },
};
