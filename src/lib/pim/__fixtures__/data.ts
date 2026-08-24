// ─────────────────────────────────────────────────────────────────────────────
// Canonical fixtures reproducing the EIGHT real failures.
//
// These are synthetic stand-ins for the real files (which live outside this
// repo). Every value here is chosen to trigger a specific failure, so the tests
// in test/failures.test.ts are exercising the exact conditions that broke the
// hand-done process — the same barcode meaning two products, near-duplicate
// Georgian names, unbound WhatsApp photos, conflicting prices, a barcode-less
// speaker, an unmapped category, isActive-without-price, split-location stock.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ChannelCategoryMap,
  FinaSync,
  PimCategory,
  PimImage,
  PimProduct,
  ProductCode,
} from "../types";

const now = "2026-08-24T09:00:00.000Z";

// ── Products (internal product_id is the ONLY join key) ──────────────────────
export const products: PimProduct[] = [
  mkProduct("p_lego_car_457", "ლეგო მანქანა (457 ნაწილი)", "LEGO Car (457 pcs)", "active", "toys-construction", "AXIOM"),
  mkProduct("p_building_blocks", "ასაწყობი კუბები", "Building blocks", "active", "toys-construction", "AXIOM"),
  mkProduct("p_lego_stitch_180", "ლეგო სტიჩი 180 დეტ", "LEGO Stitch 180 pcs", "active", "toys-construction", "AXIOM"),
  mkProduct("p_lego_stitch_107", "ლეგო სტიჩი 107 დეტ.", "LEGO Stitch 107 pcs", "active", "toys-construction", "AXIOM"),
  mkProduct("p_marvel_spinner", "მარველის სპინერი", "Marvel spinner", "active", "toys-figures", "AXIOM"),
  mkProduct("p_board_pink", "სახატავი დაფა ვარდისფერი", "Drawing board pink", "active", "toys-creative", "AXIOM"),
  mkProduct("p_board_blue", "სახატავი დაფა ცისფერი", "Drawing board blue", "active", "toys-creative", "AXIOM"),
  // The ZEALOT speaker: photographed and sellable, but NO barcode anywhere → draft.
  mkProduct("p_zealot_speaker", "ZEALOT დინამიკი", "ZEALOT speaker", "draft", "electronics-audio", "ZEALOT"),
  // A product whose category has NO mapping for the online store (Failure #6).
  mkProduct("p_mystery_gadget", "იდუმალი გაჯეტი", "Mystery gadget", "active", "misc-unmapped", "AXIOM"),
];

// ── External codes, PER SCHEME. Note the deliberate collisions (Failure #1). ──
export const codes: ProductCode[] = [
  // 4860129132282 means DIFFERENT products under the two schemes:
  { productId: "p_lego_car_457", scheme: "fina_2026", code: "4860129132282", validFrom: now },
  { productId: "p_building_blocks", scheme: "fina_2025", code: "4860129132282", validFrom: now },
  // 4860129136174: Stitch set under 2026, Marvel spinner under 2025.
  { productId: "p_lego_stitch_180", scheme: "fina_2026", code: "4860129136174", validFrom: now },
  { productId: "p_marvel_spinner", scheme: "fina_2025", code: "4860129136174", validFrom: now },
  // Ordinary, non-colliding codes for the rest.
  { productId: "p_lego_stitch_107", scheme: "fina_2026", code: "4860129136181", validFrom: now },
  { productId: "p_board_pink", scheme: "fina_2026", code: "4860129137001", validFrom: now },
  { productId: "p_board_blue", scheme: "fina_2026", code: "4860129137002", validFrom: now },
  { productId: "p_mystery_gadget", scheme: "fina_2026", code: "4860129139999", validFrom: now },
  // p_zealot_speaker: intentionally has NO code in any scheme.
];

// ── Fina sync rows, PER LOCATION (Failure #8) + a price conflict (Failure #4). ─
export const fina: FinaSync[] = [
  // LEGO car split across three locations; total should be 5+2+1 = 8.
  fs("p_lego_car_457", "საწყობი", 5, 49, now),
  fs("p_lego_car_457", "გალერეა", 2, 49, now),
  fs("p_lego_car_457", "მოლი", 1, 49, now),
  // Building blocks with a PRICE CONFLICT: 49 in one location, 95 in another.
  fs("p_building_blocks", "საწყობი", 3, 49, now),
  fs("p_building_blocks", "გალერეა", 4, 95, "2026-08-24T10:00:00.000Z"),
  // Stitch sets.
  fs("p_lego_stitch_180", "საწყობი", 6, 60, now),
  fs("p_lego_stitch_107", "საწყობი", 6, 45, now),
  fs("p_board_pink", "საწყობი", 10, 30, now),
  fs("p_board_blue", "საწყობი", 10, 30, now),
  fs("p_mystery_gadget", "საწყობი", 2, 120, now),
  // Marvel spinner exists in Fina under the 2025 scheme.
  fs("p_marvel_spinner", "მოლი", 7, 25, now),
  // NOTE: p_zealot_speaker has NO Fina row (no code to key on).
];

// ── Images, including UNBOUND WhatsApp photos (Failure #3). ───────────────────
export const images: PimImage[] = [
  img("img_car_hero", "p_lego_car_457", "hero", "staff@aserti", "lego-car.jpg"),
  img("img_stitch180_hero", "p_lego_stitch_180", "hero", "staff@aserti", "stitch180.jpg"),
  img("img_board_pink_hero", "p_board_pink", "hero", "staff@aserti", "board-pink.jpg"),
  img("img_zealot_hero", "p_zealot_speaker", "hero", "staff@aserti", "zealot.jpg"),
  // Unbound: no product, no confirmation — must land in the review queue.
  unbound("img_whatsapp_1", "WhatsApp Image 2026-08-07 at 10.13.13 PM.jpeg"),
  unbound("img_whatsapp_2", "WhatsApp Image 2026-08-07 at 10.14.02 PM.jpeg"),
];

// ── Categories (controlled vocabulary) + channel maps (missing one on purpose) ─
export const categories: PimCategory[] = [
  cat("toys-construction", "კონსტრუქტორები", "Construction toys"),
  cat("toys-figures", "ფიგურები", "Figures"),
  cat("toys-creative", "შემოქმედებითი", "Creative"),
  cat("electronics-audio", "აუდიო", "Audio"),
  cat("misc-unmapped", "სხვადასხვა", "Misc"), // in vocab, but NOT mapped to online_store
];

export const categoryMaps: ChannelCategoryMap[] = [
  cmap("online_store", "toys-construction", "toys-construction"),
  cmap("online_store", "toys-figures", "toys-figures"),
  cmap("online_store", "toys-creative", "toys-creative"),
  cmap("online_store", "electronics-audio", "electronics-audio"),
  // DELIBERATELY missing: online_store ← misc-unmapped (Failure #6).
  cmap("wolt", "toys-construction", "სათამაშოები, კონსტრუქტორები"),
];

// ── helpers ──────────────────────────────────────────────────────────────────
function mkProduct(
  id: string,
  ka: string,
  en: string,
  status: PimProduct["status"],
  categorySlug: string,
  brand: string,
): PimProduct {
  return {
    productId: id,
    name: { ka, en, ru: en },
    description: { ka: `${ka} — აღწერა`, en: `${en} description`, ru: `${en} описание` },
    brand,
    status,
    categorySlug,
    ageLabel: "3+",
    createdAt: now,
    updatedAt: now,
  };
}

function fs(productId: string, location: string, quantity: number, price: number, syncedAt: string): FinaSync {
  return { productId, location, quantity, price, cost: null, syncedAt, sourceRow: `fixture#${location}` };
}

function img(imageId: string, productId: string, role: PimImage["role"], confirmedBy: string, src: string): PimImage {
  return {
    imageId,
    productId,
    url: `https://res.cloudinary.com/demo/image/upload/axiom-smart-products/${imageId}.jpg`,
    role,
    sortOrder: 0,
    alt: { ka: "", en: "", ru: "" },
    isAiGenerated: false,
    sourcePhotoRef: src,
    confirmedBy,
    confirmedAt: now,
  };
}

function unbound(imageId: string, src: string): PimImage {
  return {
    imageId,
    productId: "",
    url: `https://res.cloudinary.com/demo/image/upload/staging/${imageId}.jpg`,
    role: "hero",
    sortOrder: 0,
    alt: { ka: "", en: "", ru: "" },
    isAiGenerated: false,
    sourcePhotoRef: src,
    confirmedBy: null,
    confirmedAt: null,
  };
}

function cat(slug: string, ka: string, en: string): PimCategory {
  return { slug, name: { ka, en, ru: en } };
}

function cmap(channel: string, internalSlug: string, channelCategory: string): ChannelCategoryMap {
  return { channel, internalSlug, channelCategory };
}
