"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatPrice } from "@/lib/money";

export function SandboxPay({
  locale,
  dict,
  reference,
  amount,
}: {
  locale: Locale;
  dict: Dictionary;
  reference: string;
  amount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "success" | "fail">(null);

  async function complete(outcome: "success" | "fail") {
    setBusy(outcome);
    try {
      await fetch("/api/sandbox/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: reference, outcome }),
      });
    } catch {
      /* ignore — still route to the order page which shows real status */
    }
    router.push(`/${locale}/order/${reference}`);
  }

  return (
    <div className="mx-auto max-w-md rounded-sm border border-silver-muted/20 bg-ink-soft p-8">
      <p className="text-center text-xs uppercase tracking-luxe text-champagne">
        Sandbox · Test payment
      </p>
      <h1 className="heading-serif mt-3 text-center text-3xl text-silver">
        {dict.checkout.payment}
      </h1>

      <div className="mt-6 space-y-2 rounded-sm border border-silver-muted/15 bg-ink p-5 text-sm">
        <div className="flex justify-between">
          <span className="text-silver-muted">{dict.confirmation.reference}</span>
          <span className="text-silver">{reference}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-silver-muted">{dict.checkout.total}</span>
          <span className="text-champagne">{formatPrice(amount, locale)}</span>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-silver-muted">
        {dict.checkout.sandboxNote}
      </p>

      <div className="mt-6 grid gap-3">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => complete("success")}
          className="btn-gold w-full"
        >
          {busy === "success" ? dict.checkout.processing : `✓ ${dict.confirmation.paid}`}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => complete("fail")}
          className="btn-outline w-full"
        >
          {busy === "fail" ? dict.checkout.processing : `✕ ${dict.confirmation.failed}`}
        </button>
      </div>
    </div>
  );
}
