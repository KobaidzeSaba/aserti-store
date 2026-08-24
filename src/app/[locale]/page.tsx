import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getFeaturedProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { ProductMedia } from "@/components/ProductMedia";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = params;
  const dict = getDictionary(locale);
  const featured = await getFeaturedProducts(locale);
  const base = `/${locale}`;

  const categories = [
    { key: "rings", label: dict.nav.rings, gem: null },
    { key: "earrings", label: dict.nav.earrings, gem: "Moissanite" },
    { key: "crosses", label: dict.nav.crosses, gem: "Moissanite" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-silver-muted/15">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(80% 60% at 70% 10%, rgba(255,255,255,0.10) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
        <div className="container-x relative grid gap-10 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <p className="text-xs uppercase tracking-luxe text-champagne">
              {dict.home.heroKicker}
            </p>
            <h1 className="heading-serif mt-4 text-5xl leading-tight text-silver sm:text-6xl">
              {dict.home.heroTitle}
            </h1>
            <p className="mt-6 max-w-md text-lg text-silver-muted">
              {dict.home.heroSubtitle}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href={`${base}/shop`} className="btn-gold">
                {dict.home.heroCta}
              </Link>
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <div
              className="absolute -inset-4 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.14), rgba(0,0,0,0) 65%)",
              }}
            />
            <ProductMedia
              category="crosses"
              images={["/products/big-cross.jpg"]}
              alt={dict.brand}
              priority
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="relative h-full w-full rounded-full border border-silver-muted/15"
            />
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container-x py-20">
          <h2 className="heading-serif text-3xl text-silver">{dict.home.featured}</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="container-x py-10 pb-20">
        <h2 className="heading-serif text-3xl text-silver">
          {dict.home.categoriesTitle}
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.key}
              href={`${base}/shop/${c.key}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-sm border border-silver-muted/15"
            >
              <ProductImage
                category={c.key}
                gem={c.gem}
                className="h-full w-full transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/80 to-transparent p-5">
                <span className="heading-serif text-2xl text-silver group-hover:text-champagne">
                  {c.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-silver-muted/15 bg-ink-soft">
        <div className="container-x py-16">
          <h2 className="heading-serif text-center text-3xl text-silver">
            {dict.home.valuesTitle}
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {dict.home.values.map((v) => (
              <div key={v.title} className="text-center">
                <h3 className="heading-serif text-xl text-champagne">{v.title}</h3>
                <p className="mt-2 text-sm text-silver-muted">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
