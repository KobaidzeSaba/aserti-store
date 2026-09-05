export type PaymentProvider = "flitt" | "bog" | "sandbox";

export type PaymentStatus = "pending" | "paid" | "failed";

export type PaymentBasketItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

export type CreatePaymentInput = {
  /** Our internal order id. */
  orderId: string;
  /** Human-friendly reference shown to the customer. */
  reference: string;
  amount: number;
  currency: string;
  locale: string;
  basket: PaymentBasketItem[];
  /** Where the bank returns the customer after payment (browser redirect). */
  returnUrl: string;
  /** Server-to-server webhook the bank calls with the final status. */
  callbackUrl: string;
};

export type CreatePaymentResult = {
  /** URL to redirect the customer's browser to, to complete payment. */
  redirectUrl: string;
  /** Provider-side payment/order identifier, stored on our Order. */
  providerPaymentId: string;
};

export interface PaymentGateway {
  readonly provider: PaymentProvider;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  /**
   * Query the provider for the authoritative payment status.
   * @param providerPaymentId provider-side id (used by BOG's receipt endpoint)
   * @param reference our order reference (used by Flitt's status-by-order_id)
   */
  getStatus(providerPaymentId: string, reference: string): Promise<PaymentStatus>;
}

export class PaymentConfigError extends Error {}
