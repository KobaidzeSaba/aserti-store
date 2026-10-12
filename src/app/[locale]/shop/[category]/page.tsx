import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAllProducts } from "@/lib/products";
import { categoryLabel, editorial } from "@/lib/editorial";
import { ProductCard } from "@/components/ProductCard";
import { ShopNav } from "@/components/ShopNav";
import { ShopControls } from "@/components/ShopControls";
import { applyShopQuery } from "@/lib/shopQuery";
export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { locale: Locale; category: string };
  searchParams: { sort?: string; gem?: string };
}) {
  const { locale, category } = params;
  const dict = getDictionary(locale);
  const t = editorial(locale);
  const all = await getAllProducts(locale);
  const categories = Array.from(new Set(all.map((p) => p.category)));
  if (!categories.includes(category)) notFound();
  const products = applyShopQuery(
    all.filter((p) => p.category === category),
    searchParams,
  );
  return (
    <>
      <div className="page-intro">
        <p className="micro">ASERTI / {t.index}</p>
        <h1 className="page-title category-title">
          {categoryLabel(category, locale)}
          <span className="shop-count">
            ({String(products.length).padStart(2, "0")})
          </span>
        </h1>
      </div>
      <div className="shop-toolbar">
        <ShopNav
          locale={locale}
          dict={dict}
          active={category}
          categories={categories}
        />
        <Suspense fallback={null}>
          <ShopControls dict={dict} />
        </Suspense>
      </div>
      {products.length === 0 ? (
        <p className="container-x py-20">{dict.shop.empty}</p>
      ) : (
        <div className="shop-grid">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              index={index + 1}
            />
          ))}
        </div>
      )}
    </>
  );
}
