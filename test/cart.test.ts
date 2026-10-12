import assert from "node:assert/strict";
import { test } from "node:test";
import {
  emptyCart,
  MAX_CART_QUANTITY,
  readCart,
  updateCart,
  type CartItem,
} from "../src/lib/cart";

const ring: CartItem = {
  slug: "silver-ring",
  name: "Silver ring",
  category: "rings",
  price: 100,
  size: "S",
  quantity: 2,
};

test("old saved carts survive the storage format migration", () => {
  const cart = readCart(JSON.stringify([ring]));
  assert.equal(cart.items[0].slug, ring.slug);
  assert.equal(cart.items[0].quantity, 2);
  assert.deepEqual(cart.checkouts, []);
});

test("malformed storage cannot crash the storefront", () => {
  for (const raw of [null, "{", "null", "42", '"text"', '{"items":{}}']) {
    assert.deepEqual(readCart(raw), emptyCart());
  }
  const cart = readCart(
    JSON.stringify([
      null,
      {},
      { ...ring, price: "100" },
      { ...ring, quantity: -1 },
      { ...ring, quantity: null },
      { ...ring, size: {} },
      ring,
    ]),
  );
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].quantity, 2);
});

test("repeated adds and cart increments stay within the checkout limit", () => {
  let cart = updateCart(emptyCart(), {
    type: "add",
    item: { ...ring, quantity: 19 },
  });
  cart = updateCart(cart, { type: "add", item: ring });
  assert.equal(cart.items[0].quantity, MAX_CART_QUANTITY);
  cart = updateCart(cart, { type: "quantity", ...ring, quantity: 100 });
  assert.equal(cart.items[0].quantity, MAX_CART_QUANTITY);
  assert.equal(
    readCart(JSON.stringify([{ ...ring, quantity: 100 }])).items[0].quantity,
    MAX_CART_QUANTITY,
  );
});

test("zero quantities remove a line and invalid additions cannot poison totals", () => {
  const cart = updateCart(emptyCart(), { type: "add", item: ring });
  assert.equal(
    updateCart(cart, { type: "quantity", ...ring, quantity: 0 }).items.length,
    0,
  );
  for (const value of [NaN, Infinity, -1]) {
    assert.deepEqual(
      updateCart(cart, { type: "add", item: { ...ring, quantity: value } }),
      cart,
    );
  }
});

test("leaving for payment retains the cart across reloads for a failed or cancelled attempt", () => {
  const cart = updateCart(emptyCart(), { type: "add", item: ring });
  const pending = updateCart(cart, {
    type: "checkout",
    reference: "AS-ABC123",
    items: cart.items,
  });
  const restored = readCart(JSON.stringify(pending));
  assert.deepEqual(restored.items, cart.items);
  assert.equal(restored.checkouts[0].reference, "AS-ABC123");
});

test("confirmed payment removes purchased quantities while preserving later additions and other sizes", () => {
  let cart = updateCart(emptyCart(), { type: "add", item: ring });
  cart = updateCart(cart, {
    type: "checkout",
    reference: "AS-ABC123",
    items: cart.items,
  });
  cart = updateCart(cart, { type: "add", item: { ...ring, quantity: 1 } });
  cart = updateCart(cart, {
    type: "add",
    item: { ...ring, size: "L", quantity: 1 },
  });
  cart = readCart(JSON.stringify(cart));
  const paid = updateCart(cart, { type: "paid", reference: "AS-ABC123" });
  assert.deepEqual(
    paid.items.map((i) => [i.size, i.quantity]),
    [
      ["S", 1],
      ["L", 1],
    ],
  );
  assert.deepEqual(paid.checkouts, []);
  assert.equal(
    cart.items[0].quantity,
    3,
    "the previous snapshot must not be mutated",
  );
});

test("revisiting a paid order cannot remove items twice, including after reload", () => {
  let cart = updateCart(emptyCart(), { type: "add", item: ring });
  cart = updateCart(cart, {
    type: "checkout",
    reference: "AS-ABC123",
    items: cart.items,
  });
  cart = updateCart(cart, { type: "paid", reference: "AS-ABC123" });
  assert.deepEqual(cart.items, []);
  cart = updateCart(cart, { type: "add", item: ring });
  cart = readCart(JSON.stringify(cart));
  assert.deepEqual(
    updateCart(cart, { type: "paid", reference: "AS-ABC123" }),
    cart,
  );
  assert.deepEqual(
    updateCart(cart, { type: "paid", reference: "AS-OTHER1" }),
    cart,
  );
});

test("checkout snapshots use the submitted cart, even if the cart changed during the request", () => {
  const submitted = [ring];
  let cart = updateCart(emptyCart(), {
    type: "add",
    item: { ...ring, quantity: 5 },
  });
  cart = updateCart(cart, {
    type: "checkout",
    reference: "AS-ABC123",
    items: submitted,
  });
  assert.equal(
    updateCart(cart, { type: "paid", reference: "AS-ABC123" }).items[0]
      .quantity,
    3,
  );
});
