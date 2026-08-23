import type { Product } from "@prisma/client";
import type { Locale } from "@/i18n/config";
import { prisma } from "./prisma";

export type LocalizedProduct = {
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
  const name = locale === "ka" ? p.nameKa : locale === "ru" ? p.nameRu : p.nameEn;
  const description = locale === "ka" ? p.descKa : locale === "ru" ? p.descRu : p.descEn;
  const hasSizes = !!p.sizeInfo && /17\.5|19\.5|S|L/.test(p.sizeInfo) && !/adjust/i.test(p.sizeInfo);
  const images = p.images
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    id: p.id,
    slug: p.slug,
    models: p.models.split(",").map((m) => m.trim()).filter(Boolean),
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

export async function getAllProducts(locale: Locale): Promise<LocalizedProduct[]> {
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
  const rows = await prisma.product.findMany({
    where: { active: true, category },
    orderBy: { price: "asc" },
  });
  return rows.map((p) => localizeProduct(p, locale));
}

export async function getFeaturedProducts(locale: Locale): Promise<LocalizedProduct[]> {
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
  const row = await prisma.product.findUnique({ where: { slug } });
  return row ? localizeProduct(row, locale) : null;
}
