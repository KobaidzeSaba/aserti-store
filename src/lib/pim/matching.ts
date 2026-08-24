// ─────────────────────────────────────────────────────────────────────────────
// Fuzzy matching — the defence against Failure #2.
//
// Matching by Georgian name bound "ლეგო სტიჩი 180 დეტ" to "ლეგო სტიჩი 107 დეტ."
// and gave the pink board the blue one's image. Names differing by a single
// token (107 vs 180, ვარდისფერი vs ცისფერი) score ~0.95 similar.
//
// Hard rule enforced by TYPES here: this module returns *proposals* only. There
// is no function in this file that commits a link. A proposal must be confirmed
// by a human (see LinkAudit.decision / confirmedBy) before anything binds.
//
// It also actively DEMOTES matches that differ only by a "discriminator" token
// — a number (107 vs 180) or a colour word (ვარდისფერი vs ცისფერი) — because
// those are precisely the tokens that carry the product's identity here.
// ─────────────────────────────────────────────────────────────────────────────

export interface MatchProposal {
  leftRef: string; // the thing being matched (image id, fina row, free text)
  rightProductId: string;
  score: number; // 0..1
  /** Human-readable reasons — shown in the review queue so a person can judge. */
  reasons: string[];
  /** True when discriminator tokens differ; such proposals must never be
   *  auto-accepted even at high overall similarity. */
  discriminatorConflict: boolean;
}

/** Georgian/Latin colour words that flip a product's identity. Extendable. */
const COLOUR_TOKENS = new Set<string>([
  "ვარდისფერი", // pink
  "ცისფერი", // light blue
  "ლურჯი", // blue
  "წითელი", // red
  "მწვანე", // green
  "ყვითელი", // yellow
  "შავი", // black
  "თეთრი", // white
  "pink",
  "blue",
  "red",
  "green",
  "black",
  "white",
]);

export function tokenize(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[.,()/–—-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Numbers and colour words are "discriminators": they carry identity here. */
function discriminators(tokens: string[]): Set<string> {
  const out = new Set<string>();
  for (const t of tokens) {
    if (/^\d+$/.test(t)) out.add(t);
    if (COLOUR_TOKENS.has(t)) out.add(t);
  }
  return out;
}

/** Jaccard similarity over token sets — deliberately simple and inspectable. */
export function nameSimilarity(a: string, b: string): number {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  if (ta.size === 0 && tb.size === 0) return 1;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return union === 0 ? 0 : inter / union;
}

const AUTO_ACCEPT_FORBIDDEN = true; // documents intent; there is no auto-accept path.

/**
 * Propose the best matches of `query` against candidate products by name.
 * Returns proposals sorted best-first. NEVER commits anything.
 *
 * When two names differ only by a discriminator token, we flag
 * discriminatorConflict AND cap the score below any confidence threshold, so
 * the near-duplicate cannot masquerade as a confident match.
 */
export function proposeMatches(
  query: { ref: string; name: string },
  candidates: Array<{ productId: string; name: string }>,
  opts: { limit?: number } = {},
): MatchProposal[] {
  void AUTO_ACCEPT_FORBIDDEN;
  const qTokens = tokenize(query.name);
  const qDisc = discriminators(qTokens);

  const proposals: MatchProposal[] = candidates.map((c) => {
    const cTokens = tokenize(c.name);
    const cDisc = discriminators(cTokens);
    let score = nameSimilarity(query.name, c.name);
    const reasons: string[] = [`token similarity ${(score * 100).toFixed(0)}%`];

    // Discriminator conflict: same shape, different identity token.
    const discDiffer =
      symmetricDiff(qDisc, cDisc).size > 0 && (qDisc.size > 0 || cDisc.size > 0);
    if (discDiffer) {
      reasons.push(
        `differs on identity token(s): ${[...symmetricDiff(qDisc, cDisc)].join(", ")}`,
      );
      // Hard cap well below any auto-confidence line.
      score = Math.min(score, 0.49);
    }

    return {
      leftRef: query.ref,
      rightProductId: c.productId,
      score,
      reasons,
      discriminatorConflict: discDiffer,
    };
  });

  proposals.sort((a, b) => b.score - a.score);
  return typeof opts.limit === "number" ? proposals.slice(0, opts.limit) : proposals;
}

function symmetricDiff<T>(a: Set<T>, b: Set<T>): Set<T> {
  const out = new Set<T>();
  for (const x of a) if (!b.has(x)) out.add(x);
  for (const x of b) if (!a.has(x)) out.add(x);
  return out;
}

/**
 * The only gate that would ever let something auto-bind. It exists so callers
 * can ask "is this safe to auto-accept?" and always get `false` for
 * discriminator conflicts — and, by policy, we do not auto-accept at all.
 */
export function isConfidentEnoughToPropose(p: MatchProposal): boolean {
  return p.score >= 0.6 && !p.discriminatorConflict;
}
