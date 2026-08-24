// ─────────────────────────────────────────────────────────────────────────────
// The eight failures, as acceptance tests.
//
// Each `test` below corresponds one-to-one to a numbered failure in the build
// prompt. They run with no database: the PIM core is pure functions over the
// fixtures in src/lib/pim/__fixtures__, which are built to reproduce the exact
// real-world breakages.
//
//   run:  npm run test:pim
// ─────────────────────────────────────────────────────────────────────────────

import { test } from "node:test";
import assert from "node:assert/strict";

import { CodeIndex } from "@/lib/pim/codes";
import { proposeMatches, isConfidentEnoughToPropose } from "@/lib/pim/matching";
import { bindPhoto, UnboundImageError } from "@/lib/pim/imageIntake";
import { summarizeStock, stockForChannel } from "@/lib/pim/stock";
import { CategoryResolver, MissingCategoryMappingError } from "@/lib/pim/categories";
import { runExport } from "@/lib/pim/export";
import type { ChannelContext, ExportInput } from "@/lib/pim/channels/types";
import { resolveFinaRows, toFinaSync } from "@/lib/pim/fina";
import { parseFinaWorkbook } from "@/lib/pim/fina-xlsx";
import { buildReviewQueue } from "@/lib/pim/reviewQueue";
import { buildFinaWorkbook } from "@/lib/pim/__fixtures__/finaWorkbook";

import * as F from "@/lib/pim/__fixtures__/data";

// Helper: assemble an ExportInput for one product from the fixtures.
function inputFor(productId: string, priceOverride: number | null = null): ExportInput {
  const product = F.products.find((p) => p.productId === productId)!;
  return {
    product,
    images: F.images.filter((i) => i.productId === productId),
    fina: F.fina.filter((r) => r.productId === productId),
    codes: F.codes.filter((c) => c.productId === productId),
    priceOverride,
  };
}

function onlineStoreCtx(): ChannelContext {
  return {
    channel: "online_store",
    categories: new CategoryResolver(F.categories, F.categoryMaps),
    stockLocations: ["საწყობი", "გალერეა", "მოლი"],
    allowPriceOverride: false,
  };
}

// ── Failure 1: same barcode, two different products ──────────────────────────
test("Failure 1: an external barcode is never a global key; scheme disambiguates", () => {
  const index = new CodeIndex(F.codes);

  // The SAME literal barcode resolves to DIFFERENT products per scheme.
  const under2026 = index.resolve("fina_2026", "4860129132282");
  const under2025 = index.resolve("fina_2025", "4860129132282");
  assert.equal(under2026.productId, "p_lego_car_457");
  assert.equal(under2025.productId, "p_building_blocks");
  assert.notEqual(under2026.productId, under2025.productId);

  // There IS a cross-scheme collision to detect — proof a naive join would break.
  const collisions = index.crossSchemeCollisions();
  const codesInCollision = collisions.map((c) => c.code);
  assert.ok(codesInCollision.includes("4860129132282"));
  assert.ok(codesInCollision.includes("4860129136174"));

  // And resolving a code without naming a scheme is simply impossible: there is
  // no cross-scheme resolve method on the index at all.
  assert.equal(typeof (index as unknown as { resolveAnyScheme?: unknown }).resolveAnyScheme, "undefined");
});

// ── Failure 2: fuzzy name matching must only propose, never auto-commit ───────
test("Failure 2: near-duplicate names never auto-bind (107 vs 180, pink vs blue)", () => {
  // Stitch 180 vs 107 — one differing number token.
  const stitch = proposeMatches(
    { ref: "img_stitch_photo", name: "ლეგო სტიჩი 180 დეტ" },
    F.products.map((p) => ({ productId: p.productId, name: p.name.ka })),
    { limit: 3 },
  );
  const top = stitch[0];
  // Best match is the correct 180 product...
  assert.equal(top.rightProductId, "p_lego_stitch_180");
  // ...but the 107 candidate must be flagged as a discriminator conflict and
  // capped below the auto-confidence line.
  const to107 = stitch.find((p) => p.rightProductId === "p_lego_stitch_107")!;
  assert.equal(to107.discriminatorConflict, true);
  assert.ok(to107.score < 0.6, `107 should not be confident, got ${to107.score}`);
  assert.equal(isConfidentEnoughToPropose(to107), false);

  // Pink vs blue drawing board — one differing colour token.
  const board = proposeMatches(
    { ref: "img_board_photo", name: "სახატავი დაფა ვარდისფერი" },
    F.products.map((p) => ({ productId: p.productId, name: p.name.ka })),
    { limit: 3 },
  );
  const toBlue = board.find((p) => p.rightProductId === "p_board_blue")!;
  assert.equal(toBlue.discriminatorConflict, true);
  assert.equal(isConfidentEnoughToPropose(toBlue), false);
});

// ── Failure 3: no image may enter the library unbound ────────────────────────
test("Failure 3: binding an image without a product is rejected", () => {
  const staged = {
    tempId: "t1",
    originalFilename: "WhatsApp Image 2026-08-07 at 10.13.13 PM.jpeg",
    url: "https://staging/x.jpg",
    isHeic: false,
  };

  assert.throws(
    () =>
      bindPhoto(staged, {
        tempId: "t1",
        productId: "", // no product
        role: "hero",
        sortOrder: 0,
        alt: { ka: "", en: "", ru: "" },
        confirmedBy: "staff@aserti",
      }, () => "img_new"),
    UnboundImageError,
  );

  // A proper bind succeeds and stamps provenance + confirmer.
  const bound = bindPhoto(staged, {
    tempId: "t1",
    productId: "p_lego_car_457",
    role: "hero",
    sortOrder: 0,
    alt: { ka: "მთავარი", en: "hero", ru: "" },
    confirmedBy: "staff@aserti",
  }, () => "img_new");
  assert.equal(bound.productId, "p_lego_car_457");
  assert.equal(bound.sourcePhotoRef, staged.originalFilename);
  assert.equal(bound.confirmedBy, "staff@aserti");
});

// ── Failure 4: Fina is the only writer of price; conflicts surface ───────────
test("Failure 4: price comes only from Fina and conflicts are surfaced", () => {
  const rows = F.fina.filter((r) => r.productId === "p_building_blocks");
  const s = summarizeStock(rows);
  assert.equal(s.priceConflict, true); // 49 vs 95 across locations
  assert.ok(s.syncedAt, "price must carry a synced_at timestamp");

  // The ExportInput type gives adapters price only via Fina rows / override —
  // there is no product.price field to write.
  const product = F.products.find((p) => p.productId === "p_building_blocks")!;
  assert.equal((product as unknown as Record<string, unknown>).price, undefined);
});

// ── Failure 5: draft products (no barcode) are held, not published ───────────
test("Failure 5: a barcode-less product stays draft and is skipped from export", () => {
  const report = runExport("online_store", [inputFor("p_zealot_speaker")], onlineStoreCtx());
  assert.equal(report.exported.length, 0);
  assert.equal(report.skipped.length, 1);
  const reasons = report.skipped[0].issues.map((i) => i.message).join(" | ");
  assert.match(reasons, /barcode|external code/i);

  // And it appears in the "needs barcode" review queue.
  const queue = buildReviewQueue({
    products: [F.products.find((p) => p.productId === "p_zealot_speaker")!],
    images: F.images.filter((i) => i.productId === "p_zealot_speaker"),
    fina: [],
    unmatchedFinaRows: [],
    categories: F.categories,
    categoryMaps: F.categoryMaps,
    channels: ["online_store"],
  });
  assert.ok(queue.some((q) => q.kind === "missing_barcode"));
});

// ── Failure 6: unmapped category fails loudly, never invents one ─────────────
test("Failure 6: missing channel category mapping throws, never fabricates", () => {
  const resolver = new CategoryResolver(F.categories, F.categoryMaps);
  assert.throws(() => resolver.resolve("online_store", "misc-unmapped"), MissingCategoryMappingError);

  // Through the exporter, the mystery gadget is skipped with a clear reason,
  // not silently given a new category.
  const report = runExport("online_store", [inputFor("p_mystery_gadget")], onlineStoreCtx());
  assert.equal(report.exported.length, 0);
  assert.equal(report.skipped.length, 1);
  assert.ok(report.skipped[0].issues.some((i) => /category/i.test(i.message)));
});

// ── Failure 7: validation runs before the file; isActive requires price ──────
test("Failure 7: isActive cannot be true without a price; report explains skips", () => {
  // A synthetic active product with NO Fina price.
  const priceless: ExportInput = {
    product: {
      ...F.products.find((p) => p.productId === "p_lego_car_457")!,
      productId: "p_priceless",
    },
    images: [],
    fina: [], // no Fina price at all
    codes: [{ productId: "p_priceless", scheme: "fina_2026", code: "111", validFrom: "2026-01-01" }],
    priceOverride: null,
  };

  const report = runExport("online_store", [priceless], onlineStoreCtx());
  assert.equal(report.exported.length, 0);
  const msg = report.skipped[0].issues.map((i) => i.message).join(" | ");
  assert.match(msg, /isActive.*price|price.*null/i);

  // A properly priced active product exports cleanly (and never silently drops).
  const ok = runExport("online_store", [inputFor("p_lego_car_457")], onlineStoreCtx());
  assert.equal(ok.exported.length, 1);
  assert.equal(ok.exported.length + ok.skipped.length, 1); // every row accounted for
});

// ── Failure 8: stock is per-location with a computed total; channel selects ──
test("Failure 8: per-location stock keeps its breakdown and computed total", () => {
  const rows = F.fina.filter((r) => r.productId === "p_lego_car_457");
  const s = summarizeStock(rows);
  assert.equal(s.byLocation.length, 3);
  assert.equal(s.total, 8); // 5 + 2 + 1

  // A channel drawing only from საწყობი sees 5, not 8.
  assert.equal(stockForChannel(rows, ["საწყობი"]), 5);
  assert.equal(stockForChannel(rows, ["საწყობი", "მოლი"]), 6);
});

// ── End-to-end: real .xlsx parse → scheme-scoped resolve → Fina sync ─────────
test("Fina import: parses a Georgian .xlsx and resolves codes within its scheme", () => {
  // Two workbooks: the SAME barcode, different products, different schemes.
  const wb2026 = buildFinaWorkbook({
    საწყობი: [{ code: "4860129132282", name: "ლეგო მანქანა (457 ნაწილი)", unit: "ცალი", quantity: 5, unitPrice: 49 }],
  });
  const wb2025 = buildFinaWorkbook({
    საწყობი: [{ code: "4860129132282", name: "ასაწყობი კუბები", unit: "ცალი", quantity: 3, unitPrice: 95 }],
  });

  const parsed2026 = parseFinaWorkbook(wb2026, "fina_2026.xlsx");
  const parsed2025 = parseFinaWorkbook(wb2025, "fina_2025.xlsx");
  assert.equal(parsed2026.rows.length, 1);
  assert.equal(parsed2026.rows[0].location, "საწყობი");

  const r2026 = resolveFinaRows(parsed2026.rows, "fina_2026", F.codes);
  const r2025 = resolveFinaRows(parsed2025.rows, "fina_2025", F.codes);
  assert.equal(r2026.matched[0].productId, "p_lego_car_457");
  assert.equal(r2025.matched[0].productId, "p_building_blocks");

  const sync = toFinaSync(r2026.matched, "2026-08-24T09:00:00.000Z");
  assert.equal(sync[0].price, 49);
  assert.equal(sync[0].location, "საწყობი");
});

// ── Unmatched rows go to review, never guessed ───────────────────────────────
test("Fina import: an unknown code is not guessed — it goes to review", () => {
  const wb = buildFinaWorkbook({
    საწყობი: [{ code: "0000000000000", name: "უცნობი", unit: "ცალი", quantity: 1, unitPrice: 10 }],
  });
  const parsed = parseFinaWorkbook(wb, "fina_2026.xlsx");
  const res = resolveFinaRows(parsed.rows, "fina_2026", F.codes);
  assert.equal(res.matched.length, 0);
  assert.equal(res.unmatched.length, 1);
  assert.equal(res.unmatched[0].reason, "unknown_code");
});
