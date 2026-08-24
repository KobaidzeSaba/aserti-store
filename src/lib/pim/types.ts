// ─────────────────────────────────────────────────────────────────────────────
// Product Master (PIM) — domain types
//
// These are the plain, inspectable shapes the PIM core reasons about. They are
// intentionally decoupled from Prisma / the database so the eight failure tests
// can run without any DB. Persistence maps these onto Prisma models in
// prisma/schema.prisma (tables prefixed `pim_`).
//
// The single most important invariant in this whole system:
//   `productId` (internal, stable, never reused) is the ONLY join key.
//   An external barcode is NEVER a global primary key — see codes.ts.
// ─────────────────────────────────────────────────────────────────────────────

export type Lang = "ka" | "en" | "ru";

/** Multilingual string. Georgian is the operational default. */
export type Multilingual = Record<Lang, string>;

export type ProductStatus = "draft" | "active" | "discontinued";

/** Roles an image can play for a product, in rough display priority. */
export type ImageRole = "hero" | "angle" | "packaging" | "lifestyle";

export interface PimProduct {
  productId: string; // internal, stable, never reused
  name: Multilingual;
  description: Multilingual;
  brand: string | null;
  status: ProductStatus;
  categorySlug: string | null; // internal controlled-vocabulary slug
  ageLabel: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/**
 * An external code (barcode / accounting code) belonging to a product, scoped
 * to a scheme. Many codes per product. The same literal `code` value may exist
 * under two different schemes and mean two different products — that is exactly
 * the real-world failure this table exists to survive.
 */
export interface ProductCode {
  productId: string;
  scheme: string; // e.g. "fina_2025", "fina_2026", "ean13"
  code: string;
  validFrom: string; // ISO
}

/**
 * A stock/price reading for a product AT A LOCATION, sourced from Fina.
 * Fina is the single source of truth for `price` and `stock`; these fields are
 * read-only everywhere else in the system.
 */
export interface FinaSync {
  productId: string;
  location: string; // საწყობი | გალერეა | მოლი | ...
  quantity: number;
  price: number; // GEL
  cost: number | null;
  syncedAt: string; // ISO — surfaced in the UI next to price/stock
  sourceRow: string; // provenance: which file/sheet/row this came from
}

export interface PimImage {
  imageId: string;
  productId: string;
  url: string;
  role: ImageRole;
  sortOrder: number;
  alt: Multilingual;
  isAiGenerated: boolean;
  sourcePhotoRef: string | null; // original upload / WhatsApp filename
  confirmedBy: string | null; // staff identity; null = not yet confirmed
  confirmedAt: string | null;
}

export interface PimCategory {
  slug: string; // internal controlled vocabulary
  name: Multilingual;
}

/** internal category slug → the target channel's own category string. */
export interface ChannelCategoryMap {
  channel: string;
  internalSlug: string;
  channelCategory: string;
}

/** Per-channel listing / publish state for a product. */
export interface ChannelListing {
  productId: string;
  channel: string;
  published: boolean;
  priceOverride: number | null; // only if the channel allows it
  lastExportAt: string | null;
  lastExportResult: string | null;
}

export type LinkKind = "image_to_product" | "fina_row_to_product";
export type LinkDecision = "proposed" | "accepted" | "rejected";

/**
 * Every automated proposal is recorded here. Fuzzy matching may only ever
 * PROPOSE (decision = "proposed"); a human moves it to accepted/rejected.
 * Nothing in the system auto-commits a fuzzy link.
 */
export interface LinkAudit {
  id: string;
  kind: LinkKind;
  leftRef: string; // e.g. image_id / fina source row
  rightProductId: string | null; // the product it was matched to
  score: number; // 0..1 confidence
  decision: LinkDecision;
  decidedBy: string | null;
  decidedAt: string | null;
  note: string | null;
}
