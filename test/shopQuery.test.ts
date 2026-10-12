import assert from "node:assert/strict";
import { test } from "node:test";
import { applyShopQuery } from "../src/lib/shopQuery";

const objects = [
  { slug: "silver", price: 222, gem: null },
  { slug: "stone", price: 680, gem: "Moissanite" },
  { slug: "small-stone", price: 260, gem: "Moissanite" },
];

test("material filtering and price sorting compose without changing the source catalog", () => {
  const before = structuredClone(objects);
  assert.deepEqual(
    applyShopQuery(objects, { gem: "moissanite", sort: "price-desc" }).map(
      (p) => p.slug,
    ),
    ["stone", "small-stone"],
  );
  assert.deepEqual(objects, before);
});

test("ascending prices and empty material results stay predictable", () => {
  assert.deepEqual(
    applyShopQuery(objects, { sort: "price-asc" }).map((p) => p.price),
    [222, 260, 680],
  );
  assert.deepEqual(applyShopQuery([objects[0]], { gem: "moissanite" }), []);
});
