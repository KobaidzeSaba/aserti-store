"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useCart } from "./CartProvider";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);
  const base = `/${locale}`;

  const links = [
    { href: `${base}/shop/rings`, label: dict.nav.rings },
    { href: `${base}/shop/earrings`, label: dict.nav.earrings },
    { href: `${base}/shop/crosses`, label: dict.nav.crosses },
    { href: `${base}/about`, label: dict.nav.about },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-silver-muted/15 bg-ink/85 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link
          href={base}
          className="heading-serif text-2xl tracking-[0.35em] text-silver"
        >
          {dict.brand}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-xs uppercase tracking-luxe text-silver-muted transition-colors hover:text-champagne"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <LocaleSwitcher current={locale} />
          <Link
            href={`${base}/cart`}
            className="relative text-xs uppercase tracking-luxe text-silver transition-colors hover:text-champagne"
          >
            {dict.nav.cart}
            {ready && count > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-champagne px-1 text-[11px] font-semibold text-ink">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="md:hidden text-silver"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-silver-muted/15 md:hidden">
          <div className="container-x flex flex-col py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm uppercase tracking-luxe text-silver-muted hover:text-champagne"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
