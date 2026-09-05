import type { MetadataRoute } from "next";
import { catalog, CATEGORIES } from "@/data/catalog";
import { locales } from "@/i18n/config";
import { getBaseUrl } from "@/lib/baseUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    entries.push(
      { url: `${base}/${locale}`, lastModified: now, changeFrequency: "weekly", priority: 1 },
      { url: `${base}/${locale}/shop`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
      { url: `${base}/${locale}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    );
    for (const category of CATEGORIES) {
      entries.push({
        url: `${base}/${locale}/shop/${category}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const product of catalog) {
      entries.push({
        url: `${base}/${locale}/product/${product.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
