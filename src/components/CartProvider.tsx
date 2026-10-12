"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CART_STORAGE_KEY,
  emptyCart,
  readCart,
  updateCart,
  type CartAction,
  type CartItem,
} from "@/lib/cart";

export type { CartItem } from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (
    slug: string,
    size: string | null | undefined,
    quantity: number,
  ) => void;
  remove: (slug: string, size: string | null | undefined) => void;
  clear: () => void;
  rememberCheckout: (reference: string, items: CartItem[]) => void;
  completeCheckout: (reference: string) => void;
  ready: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState(emptyCart);
  const current = useRef(cart);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      current.current = readCart(localStorage.getItem(CART_STORAGE_KEY));
      setCart(current.current);
    } catch {
      /* Storage may be unavailable; the in-memory cart still works. */
    }
    setReady(true);
  }, []);

  const dispatch = useCallback((action: CartAction) => {
    const next = updateCart(current.current, action);
    current.current = next;
    setCart(next);
    try {
      // Persist before leaving for the bank, rather than relying on a later effect.
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* Storage may be unavailable. */
    }
  }, []);

  const add = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      dispatch({ type: "add", item: { ...item, quantity } });
    },
    [dispatch],
  );
  const setQuantity = useCallback(
    (slug: string, size: string | null | undefined, quantity: number) => {
      dispatch({ type: "quantity", slug, size, quantity });
    },
    [dispatch],
  );
  const remove = useCallback(
    (slug: string, size: string | null | undefined) => {
      dispatch({ type: "quantity", slug, size, quantity: 0 });
    },
    [dispatch],
  );
  const clear = useCallback(() => dispatch({ type: "clear" }), [dispatch]);
  const rememberCheckout = useCallback(
    (reference: string, items: CartItem[]) => {
      dispatch({ type: "checkout", reference, items });
    },
    [dispatch],
  );
  const completeCheckout = useCallback(
    (reference: string) => {
      dispatch({ type: "paid", reference });
    },
    [dispatch],
  );

  const { count, subtotal } = useMemo(
    () =>
      cart.items.reduce(
        (acc, item) => ({
          count: acc.count + item.quantity,
          subtotal: acc.subtotal + item.quantity * item.price,
        }),
        { count: 0, subtotal: 0 },
      ),
    [cart.items],
  );

  return (
    <CartContext.Provider
      value={{
        items: cart.items,
        count,
        subtotal: Number(subtotal.toFixed(2)),
        add,
        setQuantity,
        remove,
        clear,
        rememberCheckout,
        completeCheckout,
        ready,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
