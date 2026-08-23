"use client";

import { usePathname, useRouter } from "next/navigation";
import { localeNames, locales, type Locale } from "@/i18n/config";

export function LocaleSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(locale: Locale) {
    if (locale === current) return;
    const segments = pathname.split("/");
    // segments[1] is the current locale segment
    segments[1] = locale;
    router.push(segments.join("/") || `/${locale}`);
  }

  return (
    <div className="flex items-center gap-1 text-xs uppercase tracking-luxe">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-silver-muted/40">/</span>}
          <button
            type="button"
            onClick={() => switchTo(l)}
            aria-current={l === current}
            title={localeNames[l]}
            className={
              l === current
                ? "text-champagne"
                : "text-silver-muted transition-colors hover:text-silver"
            }
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  );
}
