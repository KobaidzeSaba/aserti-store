import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { CATEGORIES } from "@/data/catalog";
import { getProductsByCategory } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { ShopNav } from "@/components/ShopNav";
import { ShopControls, applyShopQuery } from "@/components/ShopControls";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { locale: Locale; category: string };
  searchParams: { sort?: string; gem?: string };
}) {
  const { locale, category } = params;
  if (!(CATEGORIES as readonly string[]).includes(category)) notFound();

  const dict = getDictionary(locale);
  const products = applyShopQuery(
    await getProductsByCategory(locale, category),
    searchParams,
  );

  const title =
    category === "rings"
      ? dict.nav.rings
      : category === "earrings"
        ? dict.nav.earrings
        : dict.nav.crosses;

  return (
    <div className="container-x py-14">
      <h1 className="heading-serif text-4xl text-silver">{title}</h1>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
        <ShopNav locale={locale} dict={dict} active={category} />
        <Suspense fallback={null}>
          <ShopControls dict={dict} />
        </Suspense>
      </div>

      {products.length === 0 ? (
        <p className="mt-16 text-silver-muted">{dict.shop.empty}</p>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
