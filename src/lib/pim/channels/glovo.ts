// ─────────────────────────────────────────────────────────────────────────────
// Glovo adapter — format NOT YET CONFIRMED.
//
// Deliberately a thin, honest stub that satisfies the ChannelAdapter interface
// so core logic already routes to it. When Glovo's format is confirmed, only
// build() and serialize() here change — nothing in the orchestrator, review
// queue, or other channels is touched. That is the whole point of the seam.
// ─────────────────────────────────────────────────────────────────────────────

import { summarizeStock, stockForChannel } from "../stock";
import type {
  ChannelAdapter,
  ChannelContext,
  ExportInput,
  ValidationIssue,
} from "./types";

export const glovoAdapter: ChannelAdapter = {
  channel: "glovo",
  format: "json", // provisional until confirmed

  validate(input: ExportInput, ctx: ChannelContext): ValidationIssue[] {
    // Shared baseline rules until Glovo's real constraints are known.
    const issues: ValidationIssue[] = [];
    const { price } = summarizeStock(input.fina);
    if (input.product.status === "active" && price == null) {
      issues.push({ productId: input.product.productId, field: "price", severity: "error", message: "No Fina price for active Glovo listing." });
    }
    if (ctx.categories.tryResolve(ctx.channel, input.product.categorySlug) == null) {
      issues.push({ productId: input.product.productId, field: "category", severity: "error", message: `No glovo category mapping for "${input.product.categorySlug ?? "(none)"}".` });
    }
    return issues;
  },

  build(input: ExportInput, ctx: ChannelContext) {
    const { price } = summarizeStock(input.fina);
    return {
      id: input.product.productId,
      name: input.product.name.ka,
      price: input.priceOverride ?? price,
      stock: stockForChannel(input.fina, ctx.stockLocations),
      category: ctx.categories.resolve(ctx.channel, input.product.categorySlug),
      // NOTE: real Glovo fields to be filled in once the format is confirmed.
      _formatConfirmed: false,
    };
  },

  serialize(payloads: unknown[]) {
    return {
      filename: "glovo-import.json",
      contentType: "application/json",
      body: JSON.stringify({ note: "PROVISIONAL Glovo format — awaiting confirmation", products: payloads }, null, 2),
    };
  },
};
