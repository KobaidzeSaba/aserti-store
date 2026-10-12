import type { Product } from "@prisma/client";
import type { Locale } from "@/i18n/config";
import { prisma } from "./prisma";
import { catalog } from "@/data/catalog";
import {
  objectPresentation,
  type ObjectPresentation,
} from "@/data/objectPresentation";

export type LocalizedProduct = {
  presentation: ObjectPresentation;
  id: string;
  slug: string;
  models: string[];
  category: string;
  material: string;
  gem: string | null;
  sizeInfo: string | null;
  weight: number;
  price: number;
  featured: boolean;
  name: string;
  description: string;
  hasSizes: boolean;
  images: string[];
};

export function localizeProduct(p: Product, locale: Locale): LocalizedProduct {
  const name =
    locale === "ka" ? p.nameKa : locale === "ru" ? p.nameRu : p.nameEn;
  const description =
    locale === "ka" ? p.descKa : locale === "ru" ? p.descRu : p.descEn;
  const hasSizes =
    !!p.sizeInfo &&
    /17\.5|19\.5|S|L/.test(p.sizeInfo) &&
    !/adjust/i.test(p.sizeInfo);
  const images = p.images
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    presentation: objectPresentation[p.slug] ?? {},
    id: p.id,
    slug: p.slug,
    models: p.models
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
    category: p.category,
    material: p.material,
    gem: p.gem,
    sizeInfo: p.sizeInfo,
    weight: p.weight,
    price: p.price,
    featured: p.featured,
    name,
    description,
    hasSizes,
    images,
  };
}

export async function getAllProducts(
  locale: Locale,
): Promise<LocalizedProduct[]> {
  if (isCatalogPreview()) return previewProducts(locale);
  const rows = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { price: "asc" }],
  });
  return rows.map((p) => localizeProduct(p, locale));
}

export async function getProductsByCategory(
  locale: Locale,
  category: string,
): Promise<LocalizedProduct[]> {
  if (isCatalogPreview())
    return previewProducts(locale).filter((p) => p.category === category);
  const rows = await prisma.product.findMany({
    where: { active: true, category },
    orderBy: { price: "asc" },
  });
  return rows.map((p) => localizeProduct(p, locale));
}

export async function getFeaturedProducts(
  locale: Locale,
): Promise<LocalizedProduct[]> {
  if (isCatalogPreview())
    return previewProducts(locale).filter((p) => p.featured);
  const rows = await prisma.product.findMany({
    where: { active: true, featured: true },
    orderBy: { price: "asc" },
  });
  return rows.map((p) => localizeProduct(p, locale));
}

export async function getProductBySlug(
  locale: Locale,
  slug: string,
): Promise<LocalizedProduct | null> {
  if (isCatalogPreview())
    return previewProducts(locale).find((p) => p.slug === slug) ?? null;
  const row = await prisma.product.findUnique({ where: { slug } });
  return row?.active ? localizeProduct(row, locale) : null;
}

/** Explicit read-only preview, never a fallback for a failed production database. */
export function isCatalogPreview(): boolean {
  return process.env.CATALOG_PREVIEW === "1";
}

function previewProducts(locale: Locale): LocalizedProduct[] {
  return catalog.map((p) =>
    localizeProduct(
      {
        id: p.slug,
        slug: p.slug,
        models: p.models.join(","),
        category: p.category,
        material: p.material,
        gem: p.gem ?? null,
        sizeInfo: p.sizeInfo ?? null,
        weight: p.weight,
        price: p.price,
        featured: p.featured ?? false,
        active: true,
        images: (p.images?.length
          ? p.images
          : [`/products/${p.slug}.jpg`]
        ).join(","),
        nameKa: p.name.ka,
        nameEn: p.name.en,
        nameRu: p.name.ru,
        descKa: p.desc.ka,
        descEn: p.desc.en,
        descRu: p.desc.ru,
        createdAt: new Date("2026-01-01"),
      },
      locale,
    ),
  );
}
