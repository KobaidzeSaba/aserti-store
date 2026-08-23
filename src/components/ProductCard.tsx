import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { formatPrice } from "@/lib/money";
import type { LocalizedProduct } from "@/lib/products";
import { ProductMedia } from "./ProductMedia";

export function ProductCard({
  product,
  locale,
}: {
  product: LocalizedProduct;
  locale: Locale;
}) {
  return (
    <Link
      href={`/${locale}/product/${product.slug}`}
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden rounded-sm border border-silver-muted/10">
        <ProductMedia
          category={product.category}
          gem={product.gem}
          images={product.images}
          alt={product.name}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        {product.gem && (
          <span className="absolute left-3 top-3 rounded-full border border-champagne/40 bg-ink/60 px-2.5 py-1 text-[10px] uppercase tracking-luxe text-champagne">
            {product.gem}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <h3 className="heading-serif text-xl text-silver group-hover:text-champagne">
          {product.name}
        </h3>
        <span className="whitespace-nowrap text-sm text-silver-muted">
          {formatPrice(product.price, locale)}
        </span>
      </div>
    </Link>
  );
}
