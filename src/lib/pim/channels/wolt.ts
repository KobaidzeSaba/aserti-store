// ─────────────────────────────────────────────────────────────────────────────
// Wolt adapter (Excel).
//
// Per-location stock, category as a comma-separated Georgian string from Wolt's
// controlled vocabulary, one image URL per row. Same interface as every other
// channel. The exact column layout mirrors the existing Wolt/ sample; when the
// real sample lands, only the COLUMNS constant and row shaping change here.
// ─────────────────────────────────────────────────────────────────────────────

import * as XLSX from "xlsx";
import { summarizeStock, stockForChannel } from "../stock";
import type {
  ChannelAdapter,
  ChannelContext,
  ExportInput,
  ValidationIssue,
} from "./types";

interface WoltRow {
  name_ka: string;
  category_ka: string; // comma-separated Georgian vocabulary
  price: number;
  stock: number;
  image_url: string;
  barcode: string;
}

const COLUMNS: Array<{ key: keyof WoltRow; header: string }> = [
  { key: "name_ka", header: "დასახელება" },
  { key: "category_ka", header: "კატეგორია" },
  { key: "price", header: "ფასი" },
  { key: "stock", header: "ნაშთი" },
  { key: "image_url", header: "სურათი" },
  { key: "barcode", header: "შტრიხკოდი" },
];

export const woltAdapter: ChannelAdapter = {
  channel: "wolt",
  format: "xlsx",

  validate(input: ExportInput, ctx: ChannelContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const id = input.product.productId;
    const { price } = summarizeStock(input.fina);
    const effective = input.priceOverride ?? price;

    if (input.product.status === "active" && (effective == null || Number.isNaN(effective))) {
      issues.push({ productId: id, field: "price", severity: "error", message: "No Fina price for an active Wolt listing." });
    }
    if (ctx.categories.tryResolve(ctx.channel, input.product.categorySlug) == null) {
      issues.push({ productId: id, field: "category", severity: "error", message: `No wolt category mapping for "${input.product.categorySlug ?? "(none)"}".` });
    }
    if (input.images.filter((i) => i.confirmedBy).length === 0) {
      issues.push({ productId: id, field: "image_url", severity: "error", message: "Wolt requires an image URL per row; none confirmed." });
    }
    return issues;
  },

  build(input: ExportInput, ctx: ChannelContext): WoltRow {
    const { price } = summarizeStock(input.fina);
    const image = [...input.images].filter((i) => i.confirmedBy).sort((a, b) => a.sortOrder - b.sortOrder)[0];
    return {
      name_ka: input.product.name.ka,
      category_ka: ctx.categories.resolve(ctx.channel, input.product.categorySlug),
      price: input.priceOverride ?? price ?? 0,
      stock: stockForChannel(input.fina, ctx.stockLocations),
      image_url: image?.url ?? "",
      barcode: input.codes[0]?.code ?? "",
    };
  },

  serialize(payloads: unknown[]) {
    const rows = payloads as WoltRow[];
    const aoa = [
      COLUMNS.map((c) => c.header),
      ...rows.map((r) => COLUMNS.map((c) => r[c.key])),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Wolt");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return { filename: "wolt-import.xlsx", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", body: buf };
  },
};
