export const MAX_CART_QUANTITY = 20;
export const CART_STORAGE_KEY = "aserti-cart-v1";

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  category: string;
  image?: string | null;
  size?: string | null;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
  checkouts: { reference: string; items: CartItem[] }[];
};

export function emptyCart(): CartState {
  return { items: [], checkouts: [] };
}

function sameLine(a: CartItem, b: Pick<CartItem, "slug" | "size">) {
  return a.slug === b.slug && (a.size || null) === (b.size || null);
}

function quantity(value: number): number {
  return Number.isFinite(value)
    ? Math.max(0, Math.min(MAX_CART_QUANTITY, Math.floor(value)))
    : 0;
}

function readItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const items: CartItem[] = [];
  for (const item of value) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.slug !== "string" ||
      !item.slug.trim() ||
      typeof item.name !== "string" ||
      typeof item.category !== "string" ||
      typeof item.price !== "number" ||
      !Number.isFinite(item.price) ||
      item.price < 0 ||
      typeof item.quantity !== "number" ||
      quantity(item.quantity) === 0 ||
      (item.size != null && typeof item.size !== "string") ||
      (item.image != null && typeof item.image !== "string")
    )
      continue;

    const line: CartItem = {
      slug: item.slug,
      name: item.name,
      category: item.category,
      price: item.price,
      size: item.size || null,
      image: item.image || null,
      quantity: quantity(item.quantity),
    };
    const existing = items.find((i) => sameLine(i, line));
    if (existing)
      existing.quantity = quantity(existing.quantity + line.quantity);
    else items.push(line);
  }
  return items;
}

/** Accept the original array format as well as the checkout-aware format. */
export function readCart(raw: string | null): CartState {
  try {
    const value = raw ? JSON.parse(raw) : null;
    if (Array.isArray(value)) return { items: readItems(value), checkouts: [] };
    if (!value || typeof value !== "object") return emptyCart();
    return {
      items: readItems(value.items),
      checkouts: Array.isArray(value.checkouts)
        ? value.checkouts.flatMap((checkout: unknown) => {
            if (
              !checkout ||
              typeof checkout !== "object" ||
              !("reference" in checkout) ||
              typeof checkout.reference !== "string" ||
              !checkout.reference ||
              !("items" in checkout)
            )
              return [];
            return [
              {
                reference: checkout.reference,
                items: readItems(checkout.items),
              },
            ];
          })
        : [],
    };
  } catch {
    return emptyCart();
  }
}

export type CartAction =
  | { type: "add"; item: CartItem }
  | { type: "quantity"; slug: string; size?: string | null; quantity: number }
  | { type: "clear" }
  | { type: "checkout"; reference: string; items: CartItem[] }
  | { type: "paid"; reference: string };

export function updateCart(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add":
      return { ...state, items: readItems([...state.items, action.item]) };
    case "quantity":
      return {
        ...state,
        items: state.items
          .map((item) =>
            sameLine(item, action)
              ? { ...item, quantity: quantity(action.quantity) }
              : item,
          )
          .filter((item) => item.quantity > 0),
      };
    case "clear":
      return { ...state, items: [] };
    case "checkout":
      return {
        ...state,
        checkouts: [
          ...state.checkouts.filter((c) => c.reference !== action.reference),
          { reference: action.reference, items: readItems(action.items) },
        ],
      };
    case "paid": {
      const checkout = state.checkouts.find(
        (c) => c.reference === action.reference,
      );
      if (!checkout) return state;
      return {
        items: state.items
          .map((item) => {
            const purchased = checkout.items.find((line) =>
              sameLine(line, item),
            );
            return {
              ...item,
              quantity: item.quantity - (purchased?.quantity ?? 0),
            };
          })
          .filter((item) => item.quantity > 0),
        checkouts: state.checkouts.filter(
          (c) => c.reference !== action.reference,
        ),
      };
    }
  }
}
