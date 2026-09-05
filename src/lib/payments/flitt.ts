import crypto from "crypto";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentGateway,
  PaymentStatus,
} from "./types";
import { PaymentConfigError } from "./types";

/**
 * Flitt (pay.flitt.com) — hosted-checkout gateway.
 *
 * Docs: https://docs.flitt.com
 *  - Create:  POST /api/checkout/url   -> { response: { checkout_url, payment_id } }
 *  - Status:  POST /api/status/order_id -> { response: { order_status } }
 *  - Signature: SHA1( secret | v1 | v2 | ... ) where values are the request
 *    params (excluding `signature` and empty values) sorted by key name.
 *
 * Test credentials (from the docs): merchant_id 1549901, secret "test".
 */

function apiBase(): string {
  return process.env.FLITT_API_BASE?.replace(/\/$/, "") || "https://pay.flitt.com";
}

function requireCreds() {
  const merchantId = process.env.FLITT_MERCHANT_ID;
  const secret = process.env.FLITT_SECRET_KEY;
  if (!merchantId || !secret) {
    throw new PaymentConfigError(
      "Flitt credentials missing (FLITT_MERCHANT_ID / FLITT_SECRET_KEY).",
    );
  }
  return { merchantId: Number(merchantId), secret };
}

/** Flitt signature: sha1 of "secret|<sorted non-empty param values joined by |>". */
export function flittSignature(
  secret: string,
  params: Record<string, string | number>,
): string {
  const keys = Object.keys(params)
    .filter((k) => k !== "signature" && k !== "response_signature_string")
    .filter((k) => {
      const v = params[k];
      return v !== "" && v !== null && v !== undefined;
    })
    .sort();
  const parts = [secret, ...keys.map((k) => String(params[k]))];
  return crypto.createHash("sha1").update(parts.join("|"), "utf8").digest("hex");
}

function mapStatus(status: string): PaymentStatus {
  const s = (status || "").toLowerCase();
  if (["approved"].includes(s)) return "paid";
  if (["declined", "expired", "reversed"].includes(s)) return "failed";
  return "pending"; // "processing", "created", etc.
}

export const flittGateway: PaymentGateway = {
  provider: "flitt",

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const { merchantId, secret } = requireCreds();

    const request: Record<string, string | number> = {
      merchant_id: merchantId,
      order_id: input.reference,
      order_desc: `ASERTI order ${input.reference}`,
      // Flitt expects the amount in the currency's minor units (tetri/cents).
      amount: Math.round(input.amount * 100),
      currency: input.currency,
      server_callback_url: input.callbackUrl,
      response_url: input.returnUrl,
      lang: input.locale,
    };
    request.signature = flittSignature(secret, request);

    const res = await fetch(`${apiBase()}/api/checkout/url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request }),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Flitt create failed: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as {
      response?: {
        response_status?: string;
        checkout_url?: string;
        payment_id?: string;
        error_message?: string;
      };
    };
    const r = data.response;
    if (r?.response_status !== "success" || !r.checkout_url) {
      throw new Error(`Flitt error: ${r?.error_message || JSON.stringify(data)}`);
    }

    return {
      redirectUrl: r.checkout_url,
      providerPaymentId: r.payment_id || input.reference,
    };
  },

  async getStatus(_providerPaymentId, reference): Promise<PaymentStatus> {
    const { merchantId, secret } = requireCreds();

    const request: Record<string, string | number> = {
      merchant_id: merchantId,
      order_id: reference,
    };
    request.signature = flittSignature(secret, request);

    const res = await fetch(`${apiBase()}/api/status/order_id`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request }),
      cache: "no-store",
    });
    if (!res.ok) return "pending";

    const data = (await res.json()) as {
      response?: { order_status?: string; response_status?: string };
    };
    return mapStatus(data.response?.order_status || "");
  },
};
