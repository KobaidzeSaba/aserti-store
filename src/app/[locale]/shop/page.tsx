import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAllProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { ShopNav } from "@/components/ShopNav";
import { ShopControls, applyShopQuery } from "@/components/ShopControls";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { sort?: string; gem?: string };
}) {
  const { locale } = params;
  const dict = getDictionary(locale);
  const products = applyShopQuery(await getAllProducts(locale), searchParams);

  return (
    <div className="container-x py-14">
      <h1 className="heading-serif text-4xl text-silver">{dict.shop.title}</h1>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
        <ShopNav locale={locale} dict={dict} active="all" />
        <ShopControls dict={dict} />
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
