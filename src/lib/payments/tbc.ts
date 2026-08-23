import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentGateway,
  PaymentStatus,
} from "./types";
import { PaymentConfigError } from "./types";

/**
 * TBC Bank — E-Commerce (TPay) API gateway.
 *
 * Flow (per TBC TPay docs):
 *  1. POST /v1/tpay/access-token (apikey header + client_id/secret) -> access token
 *  2. POST /v1/tpay/payments -> { payId, links:[{ uri, method, rel }] }
 *     Redirect the customer to the link with rel === "approval" (or "redirect").
 *  3. TBC calls callbackUrl; we confirm via GET /v1/tpay/payments/{payId}.
 *
 * Endpoints are centralised here; verify exact paths against your TBC
 * merchant onboarding documentation before going live.
 */

function apiBase(): string {
  return process.env.TBC_API_BASE?.replace(/\/$/, "") || "https://api.tbcbank.ge";
}

function requireCreds() {
  const clientId = process.env.TBC_CLIENT_ID;
  const clientSecret = process.env.TBC_CLIENT_SECRET;
  const apikey = process.env.TBC_APIKEY;
  if (!clientId || !clientSecret || !apikey) {
    throw new PaymentConfigError(
      "TBC credentials missing (TBC_CLIENT_ID / TBC_CLIENT_SECRET / TBC_APIKEY).",
    );
  }
  return { clientId, clientSecret, apikey };
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, apikey } = requireCreds();

  const res = await fetch(`${apiBase()}/v1/tpay/access-token`, {
    method: "POST",
    headers: {
      apikey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`TBC auth failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

function authHeaders(token: string) {
  return {
    apikey: process.env.TBC_APIKEY as string,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export const tbcGateway: PaymentGateway = {
  provider: "tbc",

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const token = await getAccessToken();

    const body = {
      amount: {
        currency: input.currency,
        total: Number(input.amount.toFixed(2)),
      },
      returnurl: input.returnUrl,
      callbackUrl: input.callbackUrl,
      preAuth: false,
      language: input.locale,
      merchantPaymentId: input.reference,
      description: `ASERTI order ${input.reference}`,
    };

    const res = await fetch(`${apiBase()}/v1/tpay/payments`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`TBC create payment failed: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as {
      payId: string;
      links?: { uri: string; method: string; rel: string }[];
    };

    const link =
      data.links?.find((l) => l.rel === "approval") ??
      data.links?.find((l) => l.rel === "redirect") ??
      data.links?.[0];

    if (!link?.uri) throw new Error("TBC response missing approval link.");

    return { redirectUrl: link.uri, providerPaymentId: data.payId };
  },

  async getStatus(providerPaymentId: string): Promise<PaymentStatus> {
    const token = await getAccessToken();
    const res = await fetch(
      `${apiBase()}/v1/tpay/payments/${encodeURIComponent(providerPaymentId)}`,
      { headers: authHeaders(token), cache: "no-store" },
    );
    if (!res.ok) return "pending";

    const data = (await res.json()) as { status?: string };
    const status = (data.status || "").toLowerCase();
    if (["succeeded", "success", "paid", "captured"].includes(status)) return "paid";
    if (["failed", "expired", "rejected", "cancelled"].includes(status)) return "failed";
    return "pending";
  },
};
