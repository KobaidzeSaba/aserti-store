// ─────────────────────────────────────────────────────────────────────────────
// Online Store adapter (JSON) — the first channel taken end-to-end.
//
// Follows product-import-template.json exactly. Encodes the store's own
// validation rules and runs them BEFORE producing the file (Failure #7). The
// hard rule — `isActive` cannot be true without a price — is enforced here, so
// we discover it in preflight, not on a rejected import.
//
// Price and stock come only from Fina (Failure #4). This adapter never invents
// either; a missing Fina price is a validation error, not a default.
// ─────────────────────────────────────────────────────────────────────────────

import { summarizeStock, stockForChannel } from "../stock";
import type {
  ChannelAdapter,
  ChannelContext,
  ExportInput,
  ValidationIssue,
} from "./types";

interface OnlineStoreImage {
  url: string;
  role: string;
  sortOrder: number;
  alt: { ka: string; en: string; ru: string };
}

interface OnlineStoreProduct {
  externalId: string;
  barcode: string | null;
  barcodeScheme: string | null;
  translations: {
    ka: { name: string; description: string };
    en: { name: string; description: string };
    ru: { name: string; description: string };
  };
  brand: string | null;
  categorySlugs: string[];
  price: number | null;
  currency: "GEL";
  stockQuantity: number;
  isActive: boolean;
  images: OnlineStoreImage[];
}

function effectivePrice(input: ExportInput): number | null {
  // Fina is authoritative; a channel override may only apply where allowed and
  // is validated by the caller. Base price is always the Fina price.
  const { price } = summarizeStock(input.fina);
  return input.priceOverride ?? price;
}

export const onlineStoreAdapter: ChannelAdapter = {
  channel: "online_store",
  format: "json",

  validate(input: ExportInput, ctx: ChannelContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const id = input.product.productId;
    const price = effectivePrice(input);
    const wantsActive = input.product.status === "active";

    // Only active products are published. A draft "exists, has images, is not
    // yet publishable" — it is held back (and shown in the needs-barcode queue),
    // never emitted as an inactive row. Discontinued products are withdrawn.
    if (input.product.status !== "active") {
      const why =
        input.product.status === "draft"
          ? "Product is a draft — not publishable yet (needs a barcode; see the needs-barcode review queue)."
          : "Product is discontinued — withdrawn from the online store.";
      issues.push({ productId: id, field: "status", severity: "error", message: why });
      return issues;
    }

    // Draft / discontinued products are never active on the store.
    const willBeActive = wantsActive;

    // THE hard rule: active requires a price.
    if (willBeActive && (price == null || Number.isNaN(price))) {
      issues.push({
        productId: id,
        field: "isActive/price",
        severity: "error",
        message: "isActive is true but price is null — the store importer rejects this. Sync a Fina price or set status to draft.",
      });
    }

    // Category must resolve to a real store slug set (controlled vocabulary).
    if (!input.product.categorySlug || !ctx.categories.isInVocabulary(input.product.categorySlug)) {
      issues.push({
        productId: id,
        field: "categorySlugs",
        severity: "error",
        message: `Category "${input.product.categorySlug ?? "(none)"}" is not in the controlled vocabulary.`,
      });
    } else if (ctx.categories.tryResolve(ctx.channel, input.product.categorySlug) == null) {
      issues.push({
        productId: id,
        field: "categorySlugs",
        severity: "error",
        message: `No online_store category mapping for "${input.product.categorySlug}".`,
      });
    }

    // An active product with no confirmed image is a warning (sellable but bare).
    const confirmedImages = input.images.filter((i) => i.confirmedBy);
    if (willBeActive && confirmedImages.length === 0) {
      issues.push({
        productId: id,
        field: "images",
        severity: "warning",
        message: "Active product has no confirmed image.",
      });
    }

    // A barcode is required to be active (a draft speaker with no barcode stays draft).
    if (willBeActive) {
      issues.push(...requireBarcode(input));
    }

    return issues;
  },

  build(input: ExportInput, ctx: ChannelContext): OnlineStoreProduct {
    const price = effectivePrice(input);
    const isActive = input.product.status === "active";
    const stockQuantity = stockForChannel(input.fina, ctx.stockLocations);
    const category = ctx.categories.resolve(ctx.channel, input.product.categorySlug); // may throw — loud by design

    const images = [...input.images]
      .filter((i) => i.confirmedBy)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => ({
        url: i.url,
        role: i.role,
        sortOrder: i.sortOrder,
        alt: { ka: i.alt.ka, en: i.alt.en, ru: i.alt.ru },
      }));

    const barcode = pickActiveCode(input);

    return {
      externalId: input.product.productId,
      barcode: barcode?.code ?? null,
      barcodeScheme: barcode?.scheme ?? null,
      translations: {
        ka: { name: input.product.name.ka, description: input.product.description.ka },
        en: { name: input.product.name.en, description: input.product.description.en },
        ru: { name: input.product.name.ru, description: input.product.description.ru },
      },
      brand: input.product.brand,
      categorySlugs: [category],
      price,
      currency: "GEL",
      stockQuantity,
      isActive,
      images,
    };
  },

  serialize(payloads: unknown[]) {
    const body = JSON.stringify(
      { formatVersion: "1.0", products: payloads },
      null,
      2,
    );
    return {
      filename: "online-store-import.json",
      contentType: "application/json",
      body,
    };
  },
};

function pickActiveCode(input: ExportInput): { scheme: string; code: string } | undefined {
  // Codes are supplied newest valid_from first; the first is the active barcode.
  const c = input.codes[0];
  return c ? { scheme: c.scheme, code: c.code } : undefined;
}

function requireBarcode(input: ExportInput): ValidationIssue[] {
  const code = pickActiveCode(input);
  if (code) return [];
  return [
    {
      productId: input.product.productId,
      field: "barcode",
      severity: "error",
      message: "Active product has no external code (barcode). It must stay in draft until one is assigned.",
    },
  ];
}
