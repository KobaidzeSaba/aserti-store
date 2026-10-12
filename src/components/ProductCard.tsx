import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { formatPrice } from "@/lib/money";
import type { LocalizedProduct } from "@/lib/products";
import { ProductMedia } from "./ProductMedia";

export function ProductCard({
  product,
  locale,
  index,
}: {
  product: LocalizedProduct;
  locale: Locale;
  index?: number;
}) {
  return (
    <Link
      href={`/${locale}/product/${product.slug}`}
      className="object-card"
      aria-label={`${product.name} — ${formatPrice(product.price, locale)}`}
    >
      <div className="object-card-image">
        <ProductMedia
          category={product.category}
          gem={product.gem}
          images={product.images}
          alt={product.name}
          className="h-full w-full"
          sizes="(max-width: 700px) 90vw, (max-width: 1050px) 45vw, 42vw"
        />
        <span className="object-card-number micro">
          {index ? String(index).padStart(2, "0") : product.models[0]}
        </span>
      </div>
      <div className="object-card-info">
        <h3 className="object-card-name">
          {product.presentation.title ?? product.name}
        </h3>
        <span className="object-card-price">
          {formatPrice(product.price, locale)}
        </span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <p className="object-card-meta micro">
          {product.presentation.year && (
            <>{product.presentation.year} &nbsp; / &nbsp; </>
          )}
          {product.material}
          {product.gem ? ` / ${product.gem}` : ""}
        </p>
        <span className="object-card-arrow" aria-hidden>
          ↗
        </span>
      </div>
    </Link>
  );
}
