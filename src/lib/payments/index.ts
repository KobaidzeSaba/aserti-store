import { bogGateway } from "./bog";
import { sandboxGateway } from "./sandbox";
import { tbcGateway } from "./tbc";
import type { PaymentGateway, PaymentProvider } from "./types";

export * from "./types";

export function isSandboxMode(): boolean {
  return (process.env.PAYMENTS_MODE || "sandbox").toLowerCase() !== "live";
}

function hasCreds(provider: PaymentProvider): boolean {
  if (provider === "tbc") {
    return Boolean(
      process.env.TBC_CLIENT_ID &&
        process.env.TBC_CLIENT_SECRET &&
        process.env.TBC_APIKEY,
    );
  }
  if (provider === "bog") {
    return Boolean(process.env.BOG_CLIENT_ID && process.env.BOG_CLIENT_SECRET);
  }
  return true;
}

/**
 * Resolve the gateway for a requested provider.
 * Falls back to the sandbox gateway when not in live mode or when the
 * chosen provider's credentials are not configured — so the store always
 * completes an order end-to-end during development.
 */
export function getGateway(requested: PaymentProvider): PaymentGateway {
  if (isSandboxMode()) return sandboxGateway;

  if (requested === "tbc" && hasCreds("tbc")) return tbcGateway;
  if (requested === "bog" && hasCreds("bog")) return bogGateway;

  console.warn(
    `[payments] Live mode requested "${requested}" but credentials are missing — using sandbox.`,
  );
  return sandboxGateway;
}
