import type { Locale } from "@/i18n/config";

export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "GEL";

// Free shipping over this subtotal (GEL); flat fee otherwise.
export const FREE_SHIPPING_THRESHOLD = 300;
export const FLAT_SHIPPING_FEE = 15;

const localeTag: Record<Locale, string> = {
  ka: "ka-GE",
  en: "en-US",
  ru: "ru-RU",
};

export function formatPrice(amount: number, locale: Locale = "en"): string {
  const formatted = new Intl.NumberFormat(localeTag[locale] ?? "en-US", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ₾`;
}

export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
}
