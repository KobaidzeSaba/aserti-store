// ─────────────────────────────────────────────────────────────────────────────
// External code resolution — the defence against Failure #1.
//
// "4860129132282" is "ლეგო მანქანა (457 ნაწილი)" under one scheme and
// "ასაწყობი კუბები" under another. Joining on the bare barcode silently produced
// wrong prices on almost every row.
//
// Rule enforced here: an external code is resolved to a productId ONLY within a
// declared scheme. We never fall back to "match the code under any scheme", and
// when a code is ambiguous we REFUSE (return unresolved) rather than guess.
// ─────────────────────────────────────────────────────────────────────────────

import type { ProductCode } from "./types";

export interface CodeResolution {
  scheme: string;
  code: string;
  productId: string | null;
  /** Why resolution failed, when productId is null. */
  reason: "ok" | "unknown_code" | "ambiguous_within_scheme";
  /** Candidate productIds, when ambiguous (a data-quality bug to surface). */
  candidates: string[];
}

/** A collision-proof map key for a (scheme, code) pair — JSON so no separator
 *  character can ever appear inside a value and corrupt the key. */
function pairKey(scheme: string, code: string): string {
  return JSON.stringify([scheme, normalizeCode(code)]);
}
function unpairKey(key: string): { scheme: string; code: string } {
  const [scheme, code] = JSON.parse(key) as [string, string];
  return { scheme, code };
}

/**
 * Index a set of ProductCode rows for fast, scheme-scoped lookup.
 * The key is ALWAYS (scheme, code) — never `code` alone. This is what makes the
 * two-scheme barcode collision survivable.
 */
export class CodeIndex {
  private bySchemeCode = new Map<string, string[]>();

  constructor(codes: Iterable<ProductCode>) {
    for (const c of codes) this.add(c);
  }

  add(c: ProductCode): void {
    const k = pairKey(c.scheme, c.code);
    const list = this.bySchemeCode.get(k);
    if (list) {
      if (!list.includes(c.productId)) list.push(c.productId);
    } else {
      this.bySchemeCode.set(k, [c.productId]);
    }
  }

  /**
   * Resolve a code WITHIN a specific scheme. Returns productId only when there
   * is exactly one owner. Ambiguity and unknown codes are reported, never
   * papered over.
   */
  resolve(scheme: string, code: string): CodeResolution {
    const owners = this.bySchemeCode.get(pairKey(scheme, code)) ?? [];
    if (owners.length === 1) {
      return { scheme, code, productId: owners[0], reason: "ok", candidates: owners };
    }
    if (owners.length === 0) {
      return { scheme, code, productId: null, reason: "unknown_code", candidates: [] };
    }
    return {
      scheme,
      code,
      productId: null,
      reason: "ambiguous_within_scheme",
      candidates: owners,
    };
  }

  /**
   * Diagnostic: find codes whose literal value is shared across DIFFERENT
   * schemes and resolves to DIFFERENT products. These are the landmines that a
   * naive "join on barcode" would step on. Purely informational — the resolver
   * above already refuses to cross scheme boundaries.
   */
  crossSchemeCollisions(): Array<{ code: string; owners: Array<{ scheme: string; productId: string }> }> {
    const byCode = new Map<string, Array<{ scheme: string; productId: string }>>();
    for (const [k, owners] of this.bySchemeCode) {
      const { scheme, code } = unpairKey(k);
      for (const productId of owners) {
        const list = byCode.get(code) ?? [];
        list.push({ scheme, productId });
        byCode.set(code, list);
      }
    }
    const collisions: Array<{ code: string; owners: Array<{ scheme: string; productId: string }> }> = [];
    for (const [code, owners] of byCode) {
      const products = new Set(owners.map((o) => o.productId));
      const schemes = new Set(owners.map((o) => o.scheme));
      if (products.size > 1 && schemes.size > 1) collisions.push({ code, owners });
    }
    return collisions;
  }
}

/** Normalize a code for comparison without changing its meaning (trim, strip spaces). */
export function normalizeCode(code: string): string {
  return code.trim().replace(/\s+/g, "");
}
