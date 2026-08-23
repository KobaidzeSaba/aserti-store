"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  category: string;
  image?: string | null;
  size?: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (slug: string, size: string | null | undefined, quantity: number) => void;
  remove: (slug: string, size: string | null | undefined) => void;
  clear: () => void;
  ready: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "aserti-cart-v1";

function sameLine(a: CartItem, slug: string, size: string | null | undefined) {
  return a.slug === slug && (a.size ?? null) === (size ?? null);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  const add = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((prev) => {
        const idx = prev.findIndex((p) => sameLine(p, item.slug, item.size));
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
          return next;
        }
        return [...prev, { ...item, quantity }];
      });
    },
    [],
  );

  const setQuantity = useCallback(
    (slug: string, size: string | null | undefined, quantity: number) => {
      setItems((prev) =>
        prev
          .map((p) =>
            sameLine(p, slug, size)
              ? { ...p, quantity: Math.max(0, quantity) }
              : p,
          )
          .filter((p) => p.quantity > 0),
      );
    },
    [],
  );

  const remove = useCallback(
    (slug: string, size: string | null | undefined) => {
      setItems((prev) => prev.filter((p) => !sameLine(p, slug, size)));
    },
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  const { count, subtotal } = useMemo(() => {
    return items.reduce(
      (acc, i) => {
        acc.count += i.quantity;
        acc.subtotal += i.quantity * i.price;
        return acc;
      },
      { count: 0, subtotal: 0 },
    );
  }, [items]);

  const value: CartContextValue = {
    items,
    count,
    subtotal: Number(subtotal.toFixed(2)),
    add,
    setQuantity,
    remove,
    clear,
    ready,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
