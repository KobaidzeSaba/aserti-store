import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { categoryLabel } from "@/lib/editorial";

export function ShopNav({
  locale,
  dict,
  active,
  categories,
}: {
  locale: Locale;
  dict: Dictionary;
  active: string;
  categories: string[];
}) {
  const base = `/${locale}/shop`;
  const tabs = [
    { key: "all", label: dict.shop.all, href: base },
    ...categories.map((category) => ({
      key: category,
      label: categoryLabel(category, locale),
      href: `${base}/${category}`,
    })),
  ];
  return (
    <nav className="shop-tabs" aria-label="Object categories">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={active === tab.key ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
