import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatPrice, CURRENCY } from "@/lib/money";
import { getBaseUrl } from "@/lib/baseUrl";
import { getProductBySlug, getProductsByCategory } from "@/lib/products";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductPurchase } from "@/components/ProductPurchase";
import { ProductCard } from "@/components/ProductCard";
import { editorial, categoryLabel } from "@/lib/editorial";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.locale, params.slug);
  if (!product) return { title: "Not found" };
  const image = product.images[0];
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: `${product.name} · ASERTI`,
      description: product.description,
      type: "website",
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: image ? [image] : undefined,
    },
  };
}

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

  const t = editorial(locale);
  const presentation = product.presentation;
  const specs: { label: string; value: string }[] = [
    {
      label: t.type,
      value: presentation.type ?? categoryLabel(product.category, locale),
    },
    ...(presentation.year
      ? [{ label: t.year, value: String(presentation.year) }]
      : []),
    ...(presentation.collection
      ? [{ label: t.collection, value: presentation.collection }]
      : []),
    ...(presentation.edition
      ? [{ label: t.edition, value: presentation.edition }]
      : []),
    ...(presentation.dimensions
      ? [{ label: t.dimensions, value: presentation.dimensions }]
      : []),
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

  const base = getBaseUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((img) => `${base}${img}`),
    sku: product.models.join(", "),
    category: product.category,
    material: product.material,
    brand: { "@type": "Brand", name: "ASERTI" },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: CURRENCY,
      availability: "https://schema.org/InStock",
      url: `${base}/${locale}/product/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="object-intro">
        <div className="object-intro-top micro">
          <Link href={`/${locale}/shop`}>← {t.back}</Link>
          <span className="muted">{product.models[0]}</span>
        </div>
        <div className="object-title-row">
          <h1>{presentation.title ?? product.name}</h1>
          <p className="micro">
            {presentation.year}
            <br />
            {product.material}
            {product.gem ? ` / ${product.gem}` : ""}
          </p>
        </div>
      </div>
      <ProductGallery
        category={product.category}
        gem={product.gem}
        images={product.images}
        alt={product.name}
        material={
          product.gem
            ? `${product.material} / ${product.gem}`
            : product.material
        }
        detailLabel={t.detail}
        video={presentation.video}
      />
      <section className="object-acquisition" aria-labelledby="object-details">
        <div>
          <h2 className="micro" id="object-details">
            {t.details}
          </h2>
          <dl className="object-specs">
            {specs.map((spec) => (
              <div key={spec.label}>
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="object-buy">
          <div className="flex items-baseline justify-between gap-4">
            <p className="object-price">{formatPrice(product.price, locale)}</p>
            <span className="micro muted">{dict.product.inStock}</span>
          </div>
          <ProductPurchase locale={locale} dict={dict} product={product} />
          <p className="object-description">{product.description}</p>
        </div>
      </section>
      {related.length > 0 && (
        <section className="object-related">
          <div className="section-heading">
            <div>
              <p className="micro section-index">CONTINUE EXPLORING</p>
              <h2>{t.nextObjects}</h2>
            </div>
          </div>
          <div className="object-related-grid">
            {related.slice(0, 3).map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
