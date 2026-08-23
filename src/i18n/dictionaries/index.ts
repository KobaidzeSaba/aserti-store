import type { Locale } from "../config";
import en, { type Dictionary } from "./en";
import ka from "./ka";
import ru from "./ru";

const dictionaries: Record<Locale, Dictionary> = { en, ka, ru };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

export type { Dictionary };
