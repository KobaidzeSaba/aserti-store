import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentGateway,
  PaymentStatus,
} from "./types";

/**
 * Sandbox gateway — no real bank calls.
 * Redirects the customer to an in-app mock payment page where they can
 * simulate a successful or failed payment. Used when PAYMENTS_MODE !== "live"
 * or when live credentials are not configured.
 */
export const sandboxGateway: PaymentGateway = {
  provider: "sandbox",

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = new URL(`/${input.locale}/sandbox/pay`, base);
    url.searchParams.set("ref", input.reference);
    return {
      redirectUrl: url.toString(),
      providerPaymentId: `sandbox-${input.reference}`,
    };
  },

  async getStatus(): Promise<PaymentStatus> {
    // In sandbox, status is driven by the mock payment page, not polled here.
    return "pending";
  },
};
