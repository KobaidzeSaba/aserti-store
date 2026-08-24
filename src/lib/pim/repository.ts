// ─────────────────────────────────────────────────────────────────────────────
// Repository — the ONLY bridge between Prisma rows and the pure PIM domain.
//
// Everything above this file (matching, export, review queue) is DB-free and
// unit-tested. This file maps `pim_*` tables to the domain types and assembles
// the inputs those pure functions need. Keeping the mapping here means the core
// logic never imports Prisma.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import { CategoryResolver } from "./categories";
import { runExport } from "./export";
import { buildReviewQueue, type ReviewItem } from "./reviewQueue";
import { diffFina, resolveFinaRows, toFinaSync, type FinaDiff, type FinaRawRow, type UnmatchedRow } from "./fina";
import type { ChannelContext, ExportInput, ExportReport } from "./channels/types";
import type {
  ChannelCategoryMap,
  FinaSync,
  PimCategory,
  PimImage,
  PimProduct,
  ProductCode,
} from "./types";

const iso = (d: Date | null | undefined): string => (d ? d.toISOString() : "");
const isoOrNull = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);

// Which stock locations each channel draws from. In a fuller build this lives in
// a channel-config table; kept explicit and inspectable here.
export const CHANNEL_STOCK_LOCATIONS: Record<string, string[]> = {
  online_store: ["საწყობი", "გალერეა", "მოლი"],
  wolt: ["გალერეა", "მოლი"],
  glovo: ["მოლი"],
  chatbot: ["საწყობი", "გალერეა", "მოლი"],
};

export const PUBLISH_CHANNELS = ["online_store", "wolt", "glovo", "chatbot"];

// ── loaders ──────────────────────────────────────────────────────────────────

export async function loadDomain() {
  const [products, codes, fina, images, categories, categoryMaps] = await Promise.all([
    prisma.pimProduct.findMany(),
    prisma.pimProductCode.findMany({ orderBy: { validFrom: "desc" } }),
    prisma.pimFinaSync.findMany(),
    prisma.pimImage.findMany(),
    prisma.pimCategory.findMany(),
    prisma.pimChannelCategoryMap.findMany(),
  ]);

  return {
    products: products.map(mapProduct),
    codes: codes.map(mapCode),
    fina: fina.map(mapFina),
    images: images.map(mapImage),
    categories: categories.map(mapCategory),
    categoryMaps: categoryMaps.map(mapCategoryMap),
  };
}

export async function buildQueue(): Promise<ReviewItem[]> {
  const d = await loadDomain();
  return buildReviewQueue({
    products: d.products,
    images: d.images,
    fina: d.fina,
    unmatchedFinaRows: [], // surfaced live during the Fina import/diff step
    categories: d.categories,
    categoryMaps: d.categoryMaps,
    channels: PUBLISH_CHANNELS,
  });
}

/** Assemble ExportInputs and run a channel export against live data. */
export async function exportChannel(channel: string): Promise<{ report: ExportReport; ctx: ChannelContext; inputs: ExportInput[] }> {
  const d = await loadDomain();
  const ctx: ChannelContext = {
    channel,
    categories: new CategoryResolver(d.categories, d.categoryMaps),
    stockLocations: CHANNEL_STOCK_LOCATIONS[channel] ?? [],
    allowPriceOverride: false,
  };

  const inputs: ExportInput[] = d.products.map((product) => ({
    product,
    images: d.images.filter((i) => i.productId === product.productId),
    fina: d.fina.filter((r) => r.productId === product.productId),
    codes: d.codes.filter((c) => c.productId === product.productId),
    priceOverride: null,
  }));

  return { report: runExport(channel, inputs, ctx), ctx, inputs };
}

// ── Fina import (dry-run diff, then commit) ──────────────────────────────────

export interface FinaImportResult {
  scheme: string;
  diff: FinaDiff;
  unmatched: UnmatchedRow[];
  committed: boolean;
}

/**
 * Resolve raw Fina rows against stored codes within `scheme`, diff the resulting
 * sync rows against what's stored, and — only when `commit` is true — persist.
 * Unmatched rows are NEVER guessed into a product; they come back for review.
 * A dry run (commit=false) writes nothing, which is the "show me before it
 * commits" step.
 */
export async function importFina(
  rows: FinaRawRow[],
  scheme: string,
  opts: { commit: boolean } = { commit: false },
): Promise<FinaImportResult> {
  const codes = (await prisma.pimProductCode.findMany()).map(mapCode);
  const resolved = resolveFinaRows(rows, scheme, codes);
  const syncedAt = new Date().toISOString();
  const incoming = toFinaSync(resolved.matched, syncedAt);

  const current = (await prisma.pimFinaSync.findMany()).map(mapFina);
  const diff = diffFina(current, incoming);

  if (!opts.commit) {
    return { scheme, diff, unmatched: resolved.unmatched, committed: false };
  }

  // Commit: upsert every matched row by (productId, location). We do NOT delete
  // "disappeared" rows automatically — a vanished row is surfaced in the diff
  // for a human to act on, never silently dropped.
  for (const r of incoming) {
    await prisma.pimFinaSync.upsert({
      where: { productId_location: { productId: r.productId, location: r.location } },
      update: { quantity: r.quantity, price: r.price, syncedAt: new Date(r.syncedAt), sourceRow: r.sourceRow },
      create: {
        productId: r.productId,
        location: r.location,
        quantity: r.quantity,
        price: r.price,
        cost: r.cost,
        syncedAt: new Date(r.syncedAt),
        sourceRow: r.sourceRow,
      },
    });
  }

  return { scheme, diff, unmatched: resolved.unmatched, committed: true };
}

// ── row → domain mappers ─────────────────────────────────────────────────────

type Row = Record<string, unknown>;

function mapProduct(p: Row): PimProduct {
  return {
    productId: p.productId as string,
    name: { ka: p.nameKa as string, en: p.nameEn as string, ru: p.nameRu as string },
    description: { ka: p.descKa as string, en: p.descEn as string, ru: p.descRu as string },
    brand: (p.brand as string) ?? null,
    status: p.status as PimProduct["status"],
    categorySlug: (p.categorySlug as string) ?? null,
    ageLabel: (p.ageLabel as string) ?? null,
    createdAt: iso(p.createdAt as Date),
    updatedAt: iso(p.updatedAt as Date),
  };
}

function mapCode(c: Row): ProductCode {
  return {
    productId: c.productId as string,
    scheme: c.scheme as string,
    code: c.code as string,
    validFrom: iso(c.validFrom as Date),
  };
}

function mapFina(f: Row): FinaSync {
  return {
    productId: f.productId as string,
    location: f.location as string,
    quantity: f.quantity as number,
    price: f.price as number,
    cost: (f.cost as number) ?? null,
    syncedAt: iso(f.syncedAt as Date),
    sourceRow: f.sourceRow as string,
  };
}

function mapImage(i: Row): PimImage {
  return {
    imageId: i.id as string,
    productId: (i.productId as string) ?? "",
    url: i.url as string,
    role: i.role as PimImage["role"],
    sortOrder: i.sortOrder as number,
    alt: { ka: i.altKa as string, en: i.altEn as string, ru: i.altRu as string },
    isAiGenerated: i.isAiGenerated as boolean,
    sourcePhotoRef: (i.sourcePhotoRef as string) ?? null,
    confirmedBy: (i.confirmedBy as string) ?? null,
    confirmedAt: isoOrNull(i.confirmedAt as Date),
  };
}

function mapCategory(c: Row): PimCategory {
  return { slug: c.slug as string, name: { ka: c.nameKa as string, en: c.nameEn as string, ru: c.nameRu as string } };
}

function mapCategoryMap(m: Row): ChannelCategoryMap {
  return { channel: m.channel as string, internalSlug: m.internalSlug as string, channelCategory: m.channelCategory as string };
}
