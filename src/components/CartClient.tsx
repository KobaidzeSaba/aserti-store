"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatPrice, shippingFor } from "@/lib/money";
import { ProductMedia } from "./ProductMedia";
import { useCart } from "./CartProvider";

export function CartClient({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const { items, subtotal, setQuantity, remove, ready } = useCart();

  if (!ready) {
    return <p className="py-20 text-center text-silver-muted">{dict.common.loading}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-silver-muted">{dict.cart.empty}</p>
        <Link href={`/${locale}/shop`} className="btn-outline mt-8">
          {dict.cart.continueShopping}
        </Link>
      </div>
    );
  }

  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

  return (
    <div className="grid gap-12 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ul className="divide-y divide-silver-muted/10 border-y border-silver-muted/10">
          {items.map((item) => (
            <li
              key={`${item.slug}-${item.size ?? ""}`}
              className="flex gap-4 py-5"
            >
              <Link
                href={`/${locale}/product/${item.slug}`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-sm border border-silver-muted/15"
              >
                <ProductMedia
                  category={item.category}
                  images={item.image ? [item.image] : []}
                  alt={item.name}
                  sizes="96px"
                  className="h-full w-full"
                />
              </Link>

              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-3">
                  <div>
                    <Link
                      href={`/${locale}/product/${item.slug}`}
                      className="heading-serif text-lg text-silver hover:text-champagne"
                    >
                      {item.name}
                    </Link>
                    {item.size && (
                      <p className="text-xs uppercase tracking-luxe text-silver-muted">
                        {dict.product.size}: {item.size}
                      </p>
                    )}
                  </div>
                  <span className="text-silver">
                    {formatPrice(item.price * item.quantity, locale)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-sm border border-silver-muted/30 text-sm">
                    <button
                      type="button"
                      aria-label="decrease"
                      onClick={() =>
                        setQuantity(item.slug, item.size, item.quantity - 1)
                      }
                      className="px-3 py-1.5 text-silver hover:text-champagne"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-silver">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="increase"
                      onClick={() =>
                        setQuantity(item.slug, item.size, item.quantity + 1)
                      }
                      className="px-3 py-1.5 text-silver hover:text-champagne"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.slug, item.size)}
                    className="text-xs uppercase tracking-luxe text-silver-muted hover:text-champagne"
                  >
                    {dict.cart.remove}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-sm border border-silver-muted/15 bg-ink-soft p-6">
        <h2 className="heading-serif text-xl text-silver">{dict.cart.total}</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-silver-muted">{dict.cart.subtotal}</dt>
            <dd className="text-silver">{formatPrice(subtotal, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-silver-muted">{dict.checkout.shippingCost}</dt>
            <dd className="text-silver">
              {shipping === 0
                ? dict.checkout.freeShipping
                : formatPrice(shipping, locale)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-silver-muted/10 pt-3 text-base">
            <dt className="text-silver">{dict.checkout.total}</dt>
            <dd className="text-champagne">{formatPrice(total, locale)}</dd>
          </div>
        </dl>
        <Link href={`/${locale}/checkout`} className="btn-gold mt-6 w-full">
          {dict.cart.checkout}
        </Link>
        <Link
          href={`/${locale}/shop`}
          className="mt-3 block text-center text-xs uppercase tracking-luxe text-silver-muted hover:text-champagne"
        >
          {dict.cart.continueShopping}
        </Link>
      </aside>
    </div>
  );
}
