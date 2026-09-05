"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries";

export function ShopControls({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const sort = params.get("sort") || "";
  const gem = params.get("gem") || "";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <label className="flex items-center gap-2 text-xs uppercase tracking-luxe text-silver-muted">
        {dict.shop.sort}
        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="rounded-none border border-silver-muted/30 bg-ink-soft px-3 py-2 text-sm normal-case tracking-normal text-silver outline-none focus:border-champagne"
        >
          <option value="">{dict.shop.sortDefault}</option>
          <option value="price-asc">{dict.shop.sortPriceAsc}</option>
          <option value="price-desc">{dict.shop.sortPriceDesc}</option>
        </select>
      </label>

      <label className="flex cursor-pointer items-center gap-2 text-xs uppercase tracking-luxe text-silver-muted">
        <input
          type="checkbox"
          checked={gem === "moissanite"}
          onChange={(e) => setParam("gem", e.target.checked ? "moissanite" : "")}
          className="accent-champagne"
        />
        {dict.shop.moissaniteOnly}
      </label>
    </div>
  );
}

/** Apply sort + gem filter to a product list (shared by shop pages). */
export function applyShopQuery<T extends { price: number; gem: string | null }>(
  products: T[],
  query: { sort?: string; gem?: string },
): T[] {
  let out = products;
  if (query.gem === "moissanite") {
    out = out.filter((p) => (p.gem || "").toLowerCase().includes("moissanite"));
  }
  if (query.sort === "price-asc") {
    out = [...out].sort((a, b) => a.price - b.price);
  } else if (query.sort === "price-desc") {
    out = [...out].sort((a, b) => b.price - a.price);
  }
  return out;
}
