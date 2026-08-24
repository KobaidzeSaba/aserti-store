// ─────────────────────────────────────────────────────────────────────────────
// Fina import — the trustworthy master's front door.
//
// Ingests Fina rows (from .xlsx today; see fina-xlsx.ts for the IO layer, kept
// separate so an API connector can replace it without touching this logic).
//
// Guarantees:
//  • Codes are resolved WITHIN a declared scheme only (Failure #1). Unmatched
//    rows never guess a product — they go to a review queue.
//  • Produces a DIFF before committing: what changed, what's new, what
//    disappeared (the "show me before it writes" requirement).
//  • Only Fina writes price/stock; the committed FinaSync rows are the sole
//    source for those fields downstream (Failure #4).
// ─────────────────────────────────────────────────────────────────────────────

import { CodeIndex } from "./codes";
import type { FinaSync, ProductCode } from "./types";

/** One normalized row read from a Fina sheet. */
export interface FinaRawRow {
  code: string; // კოდი
  name: string; // დასახელება
  unit: string; // საზომი ერთეული
  quantity: number; // ნაშთი
  unitPrice: number; // ერთეულის ფასი
  location: string; // sheet name: საწყობი | გალერეა | მოლი
  sourceRow: string; // provenance string
}

export interface MatchedRow {
  row: FinaRawRow;
  productId: string;
}

export interface UnmatchedRow {
  row: FinaRawRow;
  reason: "unknown_code" | "ambiguous_within_scheme";
  candidates: string[];
}

export interface FinaResolveResult {
  scheme: string;
  matched: MatchedRow[];
  unmatched: UnmatchedRow[]; // → review queue; never guessed into a product
}

/**
 * Resolve raw rows to productIds within one declared scheme. Refuses to guess:
 * unknown or ambiguous codes are returned as unmatched, not force-joined.
 */
export function resolveFinaRows(
  rows: FinaRawRow[],
  scheme: string,
  codes: ProductCode[],
): FinaResolveResult {
  const index = new CodeIndex(codes);
  const matched: MatchedRow[] = [];
  const unmatched: UnmatchedRow[] = [];

  for (const row of rows) {
    const res = index.resolve(scheme, row.code);
    if (res.productId) {
      matched.push({ row, productId: res.productId });
    } else {
      unmatched.push({
        row,
        reason: res.reason === "ambiguous_within_scheme" ? "ambiguous_within_scheme" : "unknown_code",
        candidates: res.candidates,
      });
    }
  }
  return { scheme, matched, unmatched };
}

/** Turn matched rows into FinaSync records ready to persist. */
export function toFinaSync(matched: MatchedRow[], syncedAt: string): FinaSync[] {
  return matched.map((m) => ({
    productId: m.productId,
    location: m.row.location,
    quantity: m.row.quantity,
    price: m.row.unitPrice,
    cost: null,
    syncedAt,
    sourceRow: m.row.sourceRow,
  }));
}

// ── Diff before commit ──────────────────────────────────────────────────────

export interface FinaDiffLine {
  productId: string;
  location: string;
  kind: "new" | "changed" | "unchanged" | "disappeared";
  before?: { quantity: number; price: number };
  after?: { quantity: number; price: number };
}

export interface FinaDiff {
  lines: FinaDiffLine[];
  counts: { new: number; changed: number; unchanged: number; disappeared: number };
}

function keyOf(r: { productId: string; location: string }): string {
  return `${r.productId}::${r.location}`;
}

/**
 * Diff incoming FinaSync rows against the currently stored ones (by
 * product+location). Shown to the operator BEFORE any write.
 */
export function diffFina(current: FinaSync[], incoming: FinaSync[]): FinaDiff {
  const cur = new Map(current.map((r) => [keyOf(r), r] as const));
  const inc = new Map(incoming.map((r) => [keyOf(r), r] as const));
  const lines: FinaDiffLine[] = [];
  const counts = { new: 0, changed: 0, unchanged: 0, disappeared: 0 };

  for (const [k, r] of inc) {
    const prev = cur.get(k);
    if (!prev) {
      lines.push({ productId: r.productId, location: r.location, kind: "new", after: { quantity: r.quantity, price: r.price } });
      counts.new++;
    } else if (prev.quantity !== r.quantity || prev.price !== r.price) {
      lines.push({
        productId: r.productId,
        location: r.location,
        kind: "changed",
        before: { quantity: prev.quantity, price: prev.price },
        after: { quantity: r.quantity, price: r.price },
      });
      counts.changed++;
    } else {
      lines.push({ productId: r.productId, location: r.location, kind: "unchanged", after: { quantity: r.quantity, price: r.price } });
      counts.unchanged++;
    }
  }
  for (const [k, r] of cur) {
    if (!inc.has(k)) {
      lines.push({ productId: r.productId, location: r.location, kind: "disappeared", before: { quantity: r.quantity, price: r.price } });
      counts.disappeared++;
    }
  }
  return { lines, counts };
}
