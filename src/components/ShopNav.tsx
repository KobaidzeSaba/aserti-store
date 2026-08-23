import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function ShopNav({
  locale,
  dict,
  active,
}: {
  locale: Locale;
  dict: Dictionary;
  active: string; // "all" | "rings" | "earrings" | "crosses"
}) {
  const base = `/${locale}/shop`;
  const tabs = [
    { key: "all", label: dict.shop.all, href: base },
    { key: "rings", label: dict.nav.rings, href: `${base}/rings` },
    { key: "earrings", label: dict.nav.earrings, href: `${base}/earrings` },
    { key: "crosses", label: dict.nav.crosses, href: `${base}/crosses` },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={
            "rounded-full border px-4 py-2 text-xs uppercase tracking-luxe transition-colors " +
            (active === t.key
              ? "border-champagne bg-champagne/10 text-champagne"
              : "border-silver-muted/25 text-silver-muted hover:border-champagne hover:text-champagne")
          }
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
