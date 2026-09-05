import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { getGateway, type PaymentProvider } from "@/lib/payments";
import { markOrderFailed, markOrderPaid } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: { locale: Locale; reference: string };
}) {
  const { locale, reference } = params;
  const dict = getDictionary(locale);

  let order = await prisma.order.findUnique({
    where: { reference },
    include: { items: true },
  });
  if (!order) notFound();

  // Live mode: if the customer returned before the webhook landed, re-query
  // the provider so this page reflects the authoritative status.
  if (
    order.status === "pending" &&
    order.paymentId &&
    (order.paymentProvider === "flitt" || order.paymentProvider === "bog")
  ) {
    try {
      const gateway = getGateway(order.paymentProvider as PaymentProvider);
      const status = await gateway.getStatus(order.paymentId, order.reference);
      if (status === "paid") await markOrderPaid(reference, order.paymentId);
      else if (status === "failed") await markOrderFailed(reference);
      order = await prisma.order.findUnique({
        where: { reference },
        include: { items: true },
      });
      if (!order) notFound();
    } catch {
      /* keep showing pending */
    }
  }

  if (!order) notFound();

  const paid = order.status === "paid" || order.status === "shipped";
  const failed = order.status === "failed";

  const statusLabel = paid
    ? dict.confirmation.paid
    : failed
      ? dict.confirmation.failed
      : dict.confirmation.pending;

  const statusColor = paid
    ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
    : failed
      ? "text-red-300 border-red-500/40 bg-red-500/10"
      : "text-champagne border-champagne/40 bg-champagne/10";

  return (
    <div className="container-x max-w-2xl py-20">
      <div className="text-center">
        <span
          className={`inline-block rounded-full border px-4 py-1.5 text-xs uppercase tracking-luxe ${statusColor}`}
        >
          {statusLabel}
        </span>
        <h1 className="heading-serif mt-6 text-4xl text-silver">
          {paid ? dict.confirmation.thankYou : failed ? dict.confirmation.failed : dict.confirmation.thankYou}
        </h1>
        <p className="mt-3 text-silver-muted">
          {dict.confirmation.reference}:{" "}
          <span className="text-silver">{order.reference}</span>
        </p>
      </div>

      {failed && (
        <div className="mt-8 rounded-sm border border-red-500/30 bg-red-500/5 p-6 text-center">
          <p className="text-silver-muted">{dict.confirmation.failedBody}</p>
          <Link href={`/${locale}/checkout`} className="btn-gold mt-5">
            {dict.confirmation.retry}
          </Link>
        </div>
      )}

      {paid && (
        <div className="mt-8 rounded-sm border border-silver-muted/15 bg-ink-soft p-6 text-center">
          <p className="text-silver-muted">{dict.confirmation.weWillShip}</p>
          {order.trackingCode && (
            <p className="mt-3 text-sm">
              <span className="text-silver-muted">
                {dict.confirmation.tracking}:{" "}
              </span>
              <span className="text-champagne">{order.trackingCode}</span>
            </p>
          )}
        </div>
      )}

      {/* Items */}
      <div className="mt-10 rounded-sm border border-silver-muted/15">
        <ul className="divide-y divide-silver-muted/10">
          {order.items.map((it) => (
            <li key={it.id} className="flex justify-between gap-3 px-5 py-4 text-sm">
              <span className="text-silver-muted">
                {it.nameSnapshot}
                {it.size ? ` · ${it.size}` : ""} × {it.quantity}
              </span>
              <span className="text-silver">
                {formatPrice(it.lineTotal, locale)}
              </span>
            </li>
          ))}
        </ul>
        <div className="space-y-2 border-t border-silver-muted/10 px-5 py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-silver-muted">{dict.checkout.subtotal}</span>
            <span className="text-silver">{formatPrice(order.subtotal, locale)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-silver-muted">{dict.checkout.shippingCost}</span>
            <span className="text-silver">
              {order.shippingCost === 0
                ? dict.checkout.freeShipping
                : formatPrice(order.shippingCost, locale)}
            </span>
          </div>
          <div className="flex justify-between border-t border-silver-muted/10 pt-2 text-base">
            <span className="text-silver">{dict.checkout.total}</span>
            <span className="text-champagne">{formatPrice(order.total, locale)}</span>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link
          href={`/${locale}`}
          className="text-xs uppercase tracking-luxe text-silver-muted hover:text-champagne"
        >
          ← {dict.confirmation.backHome}
        </Link>
      </div>
    </div>
  );
}
