// ─────────────────────────────────────────────────────────────────────────────
// Controlled category vocabulary + per-channel mapping — defence against
// Failure #6.
//
// Invented slugs made the store importer offer to create three brand-new
// categories, which would have fragmented the catalogue. Categories are a
// controlled vocabulary; each channel maps internal slug → that channel's
// category string; export FAILS LOUDLY when a mapping is missing and never
// invents one.
// ─────────────────────────────────────────────────────────────────────────────

import type { ChannelCategoryMap, PimCategory } from "./types";

export class MissingCategoryMappingError extends Error {
  constructor(
    public channel: string,
    public internalSlug: string,
  ) {
    super(`No ${channel} category mapping for internal category "${internalSlug}". ` +
      `Add a mapping in channel_category_map — the exporter will not invent one.`);
    this.name = "MissingCategoryMappingError";
  }
}

export class CategoryResolver {
  private vocab = new Set<string>();
  private map = new Map<string, string>(); // `${channel}::${slug}` -> channelCategory

  constructor(categories: PimCategory[], maps: ChannelCategoryMap[]) {
    for (const c of categories) this.vocab.add(c.slug);
    for (const m of maps) this.map.set(`${m.channel}::${m.internalSlug}`, m.channelCategory);
  }

  isInVocabulary(slug: string): boolean {
    return this.vocab.has(slug);
  }

  /** Resolve internal slug → channel category, or throw. Never fabricates. */
  resolve(channel: string, internalSlug: string | null): string {
    if (!internalSlug || !this.vocab.has(internalSlug)) {
      throw new MissingCategoryMappingError(channel, internalSlug ?? "(none)");
    }
    const mapped = this.map.get(`${channel}::${internalSlug}`);
    if (mapped == null) throw new MissingCategoryMappingError(channel, internalSlug);
    return mapped;
  }

  /** Non-throwing variant for building the review queue. */
  tryResolve(channel: string, internalSlug: string | null): string | null {
    try {
      return this.resolve(channel, internalSlug);
    } catch {
      return null;
    }
  }
}
