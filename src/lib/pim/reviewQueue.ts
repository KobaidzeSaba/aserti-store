// ─────────────────────────────────────────────────────────────────────────────
// Review queue — one screen for every unresolved thing.
//
// Aggregates the six kinds of blockers the prompt names:
//  1. unmatched Fina rows           4. categories with no channel mapping
//  2. unbound images                5. products with no image
//  3. products missing barcodes (draft "needs barcode" queue)
//                                   ( + price conflicts, surfaced as a warning )
//
// Sorted by what blocks the most revenue: each item carries a
// `blockedRevenue` estimate (Fina price × stock where known) and we sort desc.
// Pure and inspectable — the caller assembles the inputs from the DB.
// ─────────────────────────────────────────────────────────────────────────────

import { CategoryResolver } from "./categories";
import { summarizeStock } from "./stock";
import type { UnmatchedRow } from "./fina";
import type {
  ChannelCategoryMap,
  FinaSync,
  PimCategory,
  PimImage,
  PimProduct,
} from "./types";

export type ReviewKind =
  | "unmatched_fina_row"
  | "unbound_image"
  | "missing_barcode"
  | "missing_category_mapping"
  | "no_image"
  | "price_conflict";

export interface ReviewItem {
  kind: ReviewKind;
  ref: string; // productId or image id or fina source row
  title: string;
  detail: string;
  blockedRevenue: number; // for sorting; 0 when unknown
}

export interface ReviewInputs {
  products: PimProduct[];
  images: PimImage[];
  fina: FinaSync[];
  unmatchedFinaRows: UnmatchedRow[];
  categories: PimCategory[];
  categoryMaps: ChannelCategoryMap[];
  channels: string[]; // channels we publish to
}

export function buildReviewQueue(input: ReviewInputs): ReviewItem[] {
  const items: ReviewItem[] = [];

  const finaByProduct = new Map<string, FinaSync[]>();
  for (const r of input.fina) {
    const list = finaByProduct.get(r.productId) ?? [];
    list.push(r);
    finaByProduct.set(r.productId, list);
  }
  const revenueOf = (productId: string): number => {
    const rows = finaByProduct.get(productId);
    if (!rows || rows.length === 0) return 0;
    const s = summarizeStock(rows);
    return (s.price ?? 0) * s.total;
  };

  // 1. Unmatched Fina rows — money sitting in the accounting system, unlinked.
  for (const u of input.unmatchedFinaRows) {
    items.push({
      kind: "unmatched_fina_row",
      ref: u.row.sourceRow,
      title: `Unmatched Fina row: ${u.row.name || u.row.code}`,
      detail: `code "${u.row.code}" (${u.reason}${u.candidates.length ? `, candidates: ${u.candidates.join(", ")}` : ""})`,
      blockedRevenue: u.row.unitPrice * u.row.quantity,
    });
  }

  // 2. Unbound images.
  for (const img of input.images) {
    if (!img.productId || !img.confirmedBy) {
      items.push({
        kind: "unbound_image",
        ref: img.imageId,
        title: `Unbound image: ${img.sourcePhotoRef ?? img.imageId}`,
        detail: img.productId ? "bound but not confirmed" : "no product",
        blockedRevenue: img.productId ? revenueOf(img.productId) : 0,
      });
    }
  }

  const imagesByProduct = new Map<string, PimImage[]>();
  for (const img of input.images) {
    if (!img.productId) continue;
    const list = imagesByProduct.get(img.productId) ?? [];
    list.push(img);
    imagesByProduct.set(img.productId, list);
  }

  const resolver = new CategoryResolver(input.categories, input.categoryMaps);

  for (const p of input.products) {
    const revenue = revenueOf(p.productId);

    // 3. Missing barcode → the "needs barcode" queue (draft products).
    //    (A product with no Fina rows and status draft is the classic case.)
    const hasFina = (finaByProduct.get(p.productId)?.length ?? 0) > 0;
    if (p.status === "draft") {
      items.push({
        kind: "missing_barcode",
        ref: p.productId,
        title: `Needs barcode: ${p.name.ka || p.name.en}`,
        detail: hasFina ? "has Fina data but held as draft" : "no external code anywhere",
        blockedRevenue: revenue,
      });
    }

    // 4. Category has no mapping for a channel we publish to.
    for (const ch of input.channels) {
      if (resolver.tryResolve(ch, p.categorySlug) == null) {
        items.push({
          kind: "missing_category_mapping",
          ref: p.productId,
          title: `No ${ch} category for "${p.categorySlug ?? "(none)"}"`,
          detail: `${p.name.ka || p.name.en} cannot export to ${ch} until mapped`,
          blockedRevenue: revenue,
        });
      }
    }

    // 5. No image at all.
    if ((imagesByProduct.get(p.productId)?.length ?? 0) === 0 && p.status !== "discontinued") {
      items.push({
        kind: "no_image",
        ref: p.productId,
        title: `No image: ${p.name.ka || p.name.en}`,
        detail: "product has no image",
        blockedRevenue: revenue,
      });
    }

    // 6. Price conflict across locations — surfaced as a warning-level item.
    const rows = finaByProduct.get(p.productId);
    if (rows && summarizeStock(rows).priceConflict) {
      items.push({
        kind: "price_conflict",
        ref: p.productId,
        title: `Price conflict: ${p.name.ka || p.name.en}`,
        detail: `Fina rows disagree on price across locations`,
        blockedRevenue: revenue,
      });
    }
  }

  items.sort((a, b) => b.blockedRevenue - a.blockedRevenue);
  return items;
}
