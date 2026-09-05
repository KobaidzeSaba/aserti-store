import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getFeaturedProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";

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
        {/* Raw-stone texture background */}
        <Image
          src="/brand/raw-stone.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30"
        />
        {/* Left-weighted dark overlay keeps the headline legible */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/55" />
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(80% 60% at 70% 10%, rgba(255,255,255,0.10) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
        <div className="container-x relative grid gap-12 py-20 lg:grid-cols-2 lg:items-center lg:py-32">
          <div>
            <p className="text-xs uppercase tracking-luxe text-champagne">
              {dict.home.heroKicker}
            </p>
            <h1 className="heading-serif mt-5 text-6xl leading-[0.95] text-silver sm:text-7xl">
              {dict.home.heroTitle}
            </h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-silver-muted">
              {dict.home.heroSubtitle}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href={`${base}/shop`} className="btn-gold">
                {dict.home.heroCta}
              </Link>
              <Link href={`${base}/about`} className="btn-outline">
                {dict.nav.about}
              </Link>
            </div>
          </div>
          <div className="group relative mx-auto aspect-square w-full max-w-md overflow-hidden border border-silver-muted/15">
            <Image
              src="/brand/fusion.jpg"
              alt="ASERTI — the fusion of raw stone and mirror silver"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
              <span className="text-[10px] uppercase tracking-luxe text-silver">
                The Fusion
              </span>
              <span className="text-[10px] uppercase tracking-luxe text-silver-muted">
                Stone / Mirror
              </span>
            </div>
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
              className="group relative aspect-[4/3] overflow-hidden rounded-none border border-silver-muted/15 transition-colors duration-300 hover:border-silver-muted/40"
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

      {/* Visual code — over raw stone */}
      <section className="relative overflow-hidden border-t border-silver-muted/15">
        <Image
          src="/brand/raw-stone.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/85 to-ink" />
        <div className="container-x relative py-24">
          <p className="text-center text-xs uppercase tracking-luxe text-champagne">
            Order in Chaos · 101
          </p>
          <h2 className="heading-serif mt-4 text-center text-3xl text-silver sm:text-4xl">
            {dict.home.valuesTitle}
          </h2>
          <div className="mx-auto mt-12 grid max-w-4xl gap-px overflow-hidden border border-silver-muted/15 sm:grid-cols-3">
            {dict.home.values.map((v) => (
              <div
                key={v.title}
                className="bg-ink/50 p-8 text-center backdrop-blur-sm"
              >
                <h3 className="heading-serif text-lg text-champagne">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-silver-muted">
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
