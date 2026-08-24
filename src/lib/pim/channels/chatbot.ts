// ─────────────────────────────────────────────────────────────────────────────
// Chatbot adapter — consuming format PENDING YOUR ANSWER.
//
// The prompt says: "Ask me what the consuming system expects before designing
// this one." Until you answer (Q5), this emits a retrieval-friendly JSONL shape
// — one product per line, name + description + price + stock + image URL +
// category — which is the safe default for RAG ingestion. Swap the row shape in
// build()/serialize() once you tell me the consumer (e.g. a vector store schema,
// a specific JSON contract, or a flat CSV).
// ─────────────────────────────────────────────────────────────────────────────

import { summarizeStock, stockForChannel } from "../stock";
import type {
  ChannelAdapter,
  ChannelContext,
  ExportInput,
  ValidationIssue,
} from "./types";

export const chatbotAdapter: ChannelAdapter = {
  channel: "chatbot",
  format: "jsonl",

  validate(input: ExportInput, ctx: ChannelContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    if (ctx.categories.tryResolve(ctx.channel, input.product.categorySlug) == null) {
      issues.push({ productId: input.product.productId, field: "category", severity: "warning", message: `No chatbot category mapping for "${input.product.categorySlug ?? "(none)"}".` });
    }
    if (!input.product.description.ka && !input.product.description.en) {
      issues.push({ productId: input.product.productId, field: "description", severity: "warning", message: "No description text for retrieval." });
    }
    return issues;
  },

  build(input: ExportInput, ctx: ChannelContext) {
    const { price } = summarizeStock(input.fina);
    const image = [...input.images].filter((i) => i.confirmedBy).sort((a, b) => a.sortOrder - b.sortOrder)[0];
    return {
      product_id: input.product.productId,
      name: input.product.name,
      description: input.product.description,
      price,
      stock: stockForChannel(input.fina, ctx.stockLocations),
      image_url: image?.url ?? null,
      category: ctx.categories.tryResolve(ctx.channel, input.product.categorySlug),
    };
  },

  serialize(payloads: unknown[]) {
    const body = payloads.map((p) => JSON.stringify(p)).join("\n");
    return { filename: "chatbot-knowledge.jsonl", contentType: "application/x-ndjson", body };
  },
};
