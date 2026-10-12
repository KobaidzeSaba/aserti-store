import { Suspense } from "react";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getAllProducts } from "@/lib/products";
import { editorial } from "@/lib/editorial";
import { ProductCard } from "@/components/ProductCard";
import { ShopNav } from "@/components/ShopNav";
import { ShopControls } from "@/components/ShopControls";
import { applyShopQuery } from "@/lib/shopQuery";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Objects",
  description: "The ASERTI object index. Forms, materials and available works.",
};

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { sort?: string; gem?: string };
}) {
  const { locale } = params;
  const dict = getDictionary(locale);
  const t = editorial(locale);
  const all = await getAllProducts(locale);
  const categories = Array.from(new Set(all.map((p) => p.category)));
  const products = applyShopQuery(all, searchParams);
  return (
    <>
      <div className="page-intro">
        <p className="micro">ASERTI / {t.index}</p>
        <h1 className="page-title">
          Objects
          <span className="shop-count">
            ({String(products.length).padStart(2, "0")})
          </span>
        </h1>
      </div>
      <div className="shop-toolbar">
        <ShopNav
          locale={locale}
          dict={dict}
          active="all"
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
