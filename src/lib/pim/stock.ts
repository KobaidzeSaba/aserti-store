// ─────────────────────────────────────────────────────────────────────────────
// Per-location stock — the defence against Failure #8.
//
// Fina tracks the same product in საწყობი / გალერეა / მოლი. Merging naively lost
// the breakdown. Here stock is always per-location with a computed total, and
// each channel declares WHICH locations it draws from.
// ─────────────────────────────────────────────────────────────────────────────

import type { FinaSync } from "./types";

export interface LocationStock {
  location: string;
  quantity: number;
}

export interface ProductStock {
  productId: string;
  byLocation: LocationStock[];
  total: number;
  /** The authoritative price for the product (Fina). Read-only downstream. */
  price: number | null;
  /** When Fina last wrote these numbers — surfaced next to price/stock. */
  syncedAt: string | null;
}

/**
 * Collapse a product's per-location Fina rows into a per-location breakdown with
 * a computed total. Price is taken as authoritative; if locations disagree on
 * price we keep the most recently synced one and note nothing silently — the
 * disagreement is surfaced by `priceConflict`.
 */
export function summarizeStock(rows: FinaSync[]): ProductStock & { priceConflict: boolean } {
  if (rows.length === 0) {
    return {
      productId: "",
      byLocation: [],
      total: 0,
      price: null,
      syncedAt: null,
      priceConflict: false,
    };
  }
  const productId = rows[0].productId;
  const byLocation = rows.map((r) => ({ location: r.location, quantity: r.quantity }));
  const total = byLocation.reduce((s, l) => s + l.quantity, 0);

  const sorted = [...rows].sort((a, b) => (a.syncedAt < b.syncedAt ? 1 : -1));
  const price = sorted[0].price;
  const priceConflict = new Set(rows.map((r) => r.price)).size > 1;

  return { productId, byLocation, total, price, syncedAt: sorted[0].syncedAt, priceConflict };
}

/**
 * Stock a channel is allowed to sell: the sum over the channel's chosen
 * locations only. A channel that draws from ["საწყობი"] must not advertise the
 * გალერეა display units.
 */
export function stockForChannel(rows: FinaSync[], channelLocations: string[]): number {
  const allowed = new Set(channelLocations);
  return rows.filter((r) => allowed.has(r.location)).reduce((s, r) => s + r.quantity, 0);
}
