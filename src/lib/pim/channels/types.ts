// ─────────────────────────────────────────────────────────────────────────────
// Channel adapter interface.
//
// Every channel (Online Store, Wolt, Glovo, Chatbot) implements this ONE
// interface. Core logic never branches on the channel name; new channels
// (Glovo, whose format is not yet confirmed) drop in without touching anything
// else. This is the seam the prompt asks for.
// ─────────────────────────────────────────────────────────────────────────────

import type { CategoryResolver } from "../categories";
import type { FinaSync, PimImage, PimProduct, ProductCode } from "../types";

/** Everything an adapter needs about one product to decide export. */
export interface ExportInput {
  product: PimProduct;
  images: PimImage[];
  fina: FinaSync[]; // per-location rows
  codes: ProductCode[]; // external codes (barcodes), newest valid_from first
  priceOverride: number | null;
}

export type Severity = "error" | "warning";

export interface ValidationIssue {
  productId: string;
  field: string;
  severity: Severity;
  message: string;
}

/** Outcome for one product in an export run. */
export interface RowOutcome {
  productId: string;
  status: "exported" | "skipped";
  issues: ValidationIssue[];
  /** The channel-shaped payload, present only when exported. */
  payload?: unknown;
}

export interface ExportReport {
  channel: string;
  generatedAt: string;
  exported: RowOutcome[];
  skipped: RowOutcome[];
  /** All issues across every row, for a single "what would fail and why" view. */
  issues: ValidationIssue[];
}

export interface ChannelContext {
  channel: string;
  categories: CategoryResolver;
  /** Which stock locations this channel is allowed to draw from. */
  stockLocations: string[];
  /** Whether the channel permits a per-listing price override. */
  allowPriceOverride: boolean;
}

export interface ChannelAdapter {
  readonly channel: string;
  /** File extension / format the export produces, e.g. "json" | "xlsx". */
  readonly format: string;

  /**
   * Validate one product for this channel WITHOUT producing output. Returns the
   * issues; an empty array (no `error` severity) means it would export.
   */
  validate(input: ExportInput, ctx: ChannelContext): ValidationIssue[];

  /**
   * Build this channel's payload for one product. Only called for products that
   * pass validation. May still throw MissingCategoryMappingError — that is a
   * loud failure by design.
   */
  build(input: ExportInput, ctx: ChannelContext): unknown;

  /**
   * Serialize an array of built payloads into the channel's file bytes/string.
   */
  serialize(payloads: unknown[]): { filename: string; contentType: string; body: string | Buffer };
}
