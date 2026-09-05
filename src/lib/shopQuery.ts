/** Apply sort + gem filter to a product list (server-safe; shared by shop pages). */
export function applyShopQuery<
  T extends { price: number; gem: string | null },
>(products: T[], query: { sort?: string; gem?: string }): T[] {
  let out = products;
  if (query.gem === "moissanite") {
    out = out.filter((p) => (p.gem || "").toLowerCase().includes("moissanite"));
  }
  if (query.sort === "price-asc") {
    out = [...out].sort((a, b) => a.price - b.price);
  } else if (query.sort === "price-desc") {
    out = [...out].sort((a, b) => b.price - a.price);
  }
  return out;
}
