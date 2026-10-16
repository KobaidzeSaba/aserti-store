import { bogGateway } from "./bog";
import { flittGateway } from "./flitt";
import { sandboxGateway } from "./sandbox";
import type { PaymentGateway, PaymentProvider } from "./types";

export * from "./types";
import { PaymentConfigError } from "./types";
import { integrationStatus, paymentMode, flittTestMerchant } from "../integrationConfig";

/** True when a provider has real API credentials configured. */
export function hasCreds(provider: PaymentProvider): boolean {
  const status = integrationStatus();
  return provider === "flitt" ? status.flitt : provider === "bog" ? status.bog : false;
}

/** Explicit sandbox only; unavailable live providers fail closed. */
export function getGateway(requested: PaymentProvider): PaymentGateway {
  if (paymentMode() === "sandbox") return sandboxGateway;
  if (paymentMode() === "test" && requested === "flitt" && flittTestMerchant()) return flittGateway;
  if (paymentMode() !== "live" || !hasCreds(requested) || (requested === "flitt" && flittTestMerchant())) {
    throw new PaymentConfigError("Payment provider unavailable");
  }
  return requested === "flitt" ? flittGateway : bogGateway;
}

/** True when the chosen provider will use the in-app mock (no real creds). */
export function isMockProvider(requested: PaymentProvider): boolean {
  return paymentMode() === "sandbox";
}

/** Reconcile an existing payment with its original provider, regardless of current checkout mode. */
export function getStoredGateway(provider: string): PaymentGateway {
  if ((provider !== "bog" && provider !== "flitt") || !hasCreds(provider)) throw new PaymentConfigError("Stored payment provider unavailable");
  return provider === "bog" ? bogGateway : flittGateway;
}
export function providerAvailable(provider: PaymentProvider): boolean {
  try { getGateway(provider); return true; } catch { return false; }
}
