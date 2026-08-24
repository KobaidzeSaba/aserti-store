// ─────────────────────────────────────────────────────────────────────────────
// Scheme detection for incoming Fina files.
//
// A Fina export belongs to a code scheme (fina_2025, fina_2026, …). We do NOT
// infer the scheme from the code values themselves — that is guessing, and
// guessing is exactly what produced the barcode-collision failure. Instead the
// scheme is an explicit property of the import: it is declared by the operator
// (or read from a recognised marker in the workbook) and refused if unknown.
// ─────────────────────────────────────────────────────────────────────────────

export interface SchemeRegistryEntry {
  scheme: string;
  label: string;
  /** Optional substrings that, if present in a workbook's file/sheet metadata,
   *  suggest this scheme. A hint is a convenience, never an auto-commit. */
  filenameHints: string[];
}

export const KNOWN_SCHEMES: SchemeRegistryEntry[] = [
  { scheme: "fina_2025", label: "Fina export (2025 code scheme)", filenameHints: ["2025", "fina_2025"] },
  { scheme: "fina_2026", label: "Fina export (2026 code scheme)", filenameHints: ["2026", "fina_2026"] },
  { scheme: "ean13", label: "EAN-13 barcodes", filenameHints: ["ean"] },
];

export function isKnownScheme(scheme: string): boolean {
  return KNOWN_SCHEMES.some((s) => s.scheme === scheme);
}

export interface SchemeDetection {
  /** Non-null only when a declared scheme was supplied or a single hint matched. */
  scheme: string | null;
  /** Schemes whose hints matched the filename — for the operator to choose from. */
  suggestions: string[];
  /** True when the caller must ask a human to pick before importing. */
  needsConfirmation: boolean;
}

/**
 * Decide the scheme for an import. A declared scheme always wins (and is
 * validated). Otherwise we only *suggest* from filename hints and demand
 * confirmation. We never silently pick one.
 */
export function detectScheme(opts: { declaredScheme?: string; filename?: string }): SchemeDetection {
  if (opts.declaredScheme) {
    if (!isKnownScheme(opts.declaredScheme)) {
      return { scheme: null, suggestions: [], needsConfirmation: true };
    }
    return { scheme: opts.declaredScheme, suggestions: [opts.declaredScheme], needsConfirmation: false };
  }

  const name = (opts.filename ?? "").toLowerCase();
  const suggestions = KNOWN_SCHEMES.filter((s) =>
    s.filenameHints.some((h) => name.includes(h.toLowerCase())),
  ).map((s) => s.scheme);

  // A single unambiguous hint may pre-fill the choice, but we still ask.
  return { scheme: null, suggestions, needsConfirmation: true };
}
