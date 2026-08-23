"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useCart } from "./CartProvider";

type Props = {
  locale: Locale;
  dict: Dictionary;
  product: {
    slug: string;
    name: string;
    price: number;
    category: string;
    hasSizes: boolean;
    sizeInfo: string | null;
    images: string[];
  };
};

export function ProductPurchase({ locale, dict, product }: Props) {
  const { add } = useCart();
  const [size, setSize] = useState<string | null>(product.hasSizes ? "S" : null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add(
      {
        slug: product.slug,
        name: product.name,
        price: product.price,
        category: product.category,
        image: product.images[0] ?? null,
        size,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  return (
    <div className="mt-8 space-y-6">
      {product.hasSizes && (
        <div>
          <span className="label">{dict.product.chooseSize}</span>
          <div className="flex gap-3">
            {[
              { key: "S", label: dict.product.sizeS },
              { key: "L", label: dict.product.sizeL },
            ].map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSize(s.key)}
                className={
                  "rounded-sm border px-5 py-2.5 text-sm transition-colors " +
                  (size === s.key
                    ? "border-champagne bg-champagne/10 text-champagne"
                    : "border-silver-muted/30 text-silver hover:border-champagne")
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-sm border border-silver-muted/30">
          <button
            type="button"
            aria-label="decrease"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-4 py-2.5 text-silver hover:text-champagne"
          >
            −
          </button>
          <span className="w-10 text-center text-silver">{qty}</span>
          <button
            type="button"
            aria-label="increase"
            onClick={() => setQty((q) => Math.min(20, q + 1))}
            className="px-4 py-2.5 text-silver hover:text-champagne"
          >
            +
          </button>
        </div>

        <button type="button" onClick={handleAdd} className="btn-gold flex-1">
          {added ? dict.product.added : dict.product.addToCart}
        </button>
      </div>

      <Link
        href={`/${locale}/cart`}
        className="inline-block text-xs uppercase tracking-luxe text-silver-muted underline-offset-4 hover:text-champagne hover:underline"
      >
        {dict.nav.cart} →
      </Link>
    </div>
  );
}
