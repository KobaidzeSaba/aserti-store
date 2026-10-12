"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

/** Render only after the server has confirmed payment for this order. */
export function PaidOrderCartSync({ reference }: { reference: string }) {
  const { ready, completeCheckout } = useCart();
  useEffect(() => {
    if (ready) completeCheckout(reference);
  }, [ready, reference, completeCheckout]);
  return null;
}
