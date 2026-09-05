import { bogGateway } from "./bog";
import { flittGateway } from "./flitt";
import { sandboxGateway } from "./sandbox";
import type { PaymentGateway, PaymentProvider } from "./types";

export * from "./types";

/** True when a provider has real API credentials configured. */
export function hasCreds(provider: PaymentProvider): boolean {
  if (provider === "flitt") {
    return Boolean(process.env.FLITT_MERCHANT_ID && process.env.FLITT_SECRET_KEY);
  }
  if (provider === "bog") {
    return Boolean(process.env.BOG_CLIENT_ID && process.env.BOG_CLIENT_SECRET);
  }
  return false;
}

/**
 * Resolve the gateway for a requested provider.
 *
 * If the provider has real credentials configured, the real gateway is used
 * (Flitt / BOG — including their sandbox/test merchants). Otherwise the in-app
 * sandbox mock gateway is used so the store still completes an order
 * end-to-end during development.
 */
export function getGateway(requested: PaymentProvider): PaymentGateway {
  if (requested === "flitt" && hasCreds("flitt")) return flittGateway;
  if (requested === "bog" && hasCreds("bog")) return bogGateway;
  return sandboxGateway;
}

/** True when the chosen provider will use the in-app mock (no real creds). */
export function isMockProvider(requested: PaymentProvider): boolean {
  return getGateway(requested).provider === "sandbox";
}
