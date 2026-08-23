import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatPrice } from "@/lib/money";
import {
  getProductBySlug,
  getProductsByCategory,
} from "@/lib/products";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductPurchase } from "@/components/ProductPurchase";
import { ProductCard } from "@/components/ProductCard";

export default async function ProductPage({
  params,
}: {
  params: { locale: Locale; slug: string };
}) {
  const { locale, slug } = params;
  const dict = getDictionary(locale);
  const product = await getProductBySlug(locale, slug);
  if (!product) notFound();

  const related = (await getProductsByCategory(locale, product.category))
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

  const specs: { label: string; value: string }[] = [
    { label: dict.product.model, value: product.models.join(", ") },
    { label: dict.product.material, value: product.material },
    ...(product.gem ? [{ label: dict.product.gem, value: product.gem }] : []),
    ...(product.sizeInfo
      ? [{ label: dict.product.size, value: product.sizeInfo }]
      : []),
    {
      label: dict.product.weight,
      value: `${product.weight} ${dict.product.grams}`,
    },
  ];

  return (
    <div className="container-x py-12">
      <Link
        href={`/${locale}/shop`}
        className="text-xs uppercase tracking-luxe text-silver-muted hover:text-champagne"
      >
        ← {dict.product.backToShop}
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        <ProductGallery
          category={product.category}
          gem={product.gem}
          images={product.images}
          alt={product.name}
        />

        <div>
          <p className="text-xs uppercase tracking-luxe text-champagne">
            {dict.product.inStock}
          </p>
          <h1 className="heading-serif mt-3 text-4xl text-silver">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl text-silver-muted">
            {formatPrice(product.price, locale)}
          </p>
          <p className="mt-6 max-w-md leading-relaxed text-silver-muted">
            {product.description}
          </p>

          <dl className="mt-8 divide-y divide-silver-muted/10 border-y border-silver-muted/10">
            {specs.map((s) => (
              <div key={s.label} className="flex justify-between py-3 text-sm">
                <dt className="uppercase tracking-luxe text-silver-muted">
                  {s.label}
                </dt>
                <dd className="text-silver">{s.value}</dd>
              </div>
            ))}
          </dl>

          <ProductPurchase locale={locale} dict={dict} product={product} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="heading-serif text-2xl text-silver">
            {dict.product.relatedTitle}
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
