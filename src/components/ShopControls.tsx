"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { Dictionary } from "@/i18n/dictionaries";

export function ShopControls({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const sort = params.get("sort") || "";
  const gem = params.get("gem") || "";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    startTransition(() =>
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }),
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-5" aria-busy={pending}>
      <label className="flex items-center gap-2 text-xs uppercase tracking-luxe text-silver-muted">
        {dict.shop.sort}
        <select
          disabled={pending}
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
          disabled={pending}
          checked={gem === "moissanite"}
          onChange={(e) =>
            setParam("gem", e.target.checked ? "moissanite" : "")
          }
          className="accent-champagne"
        />
        {dict.shop.moissaniteOnly}
      </label>
    </div>
  );
}
