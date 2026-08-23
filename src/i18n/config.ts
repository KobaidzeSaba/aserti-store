export const locales = ["ka", "en", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ka";

export const localeNames: Record<Locale, string> = {
  ka: "ქართული",
  en: "English",
  ru: "Русский",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
