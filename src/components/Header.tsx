"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { editorial } from "@/lib/editorial";
import { useCart } from "./CartProvider";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { count, ready } = useCart();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const t = editorial(locale);
  const base = `/${locale}`;
  const links = [
    { href: `${base}/shop`, label: "Objects" },
    { href: `${base}/studio`, label: "Studio" },
    { href: `${base}/101`, label: "101" },
    { href: `${base}/contact`, label: t.contact },
  ];
  useEffect(() => {
    setOpen(false);
  }, [path]);
  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    function outside(event: PointerEvent) {
      if (open && event.target instanceof Node && !headerRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);

  return (
    <header ref={headerRef} className="site-header">
      <div className="header-inner">
        <Link
          href={base}
          className="header-wordmark"
          aria-label="ASERTI — home"
        >
          ASERTI
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={path.startsWith(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-tools">
          <div className="desktop-languages">
            <LocaleSwitcher current={locale} />
          </div>
          <Link href={`${base}/cart`} className="cart-link">
            {dict.nav.cart}{" "}
            <span>({ready ? String(count).padStart(2, "0") : "00"})</span>
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            {open ? t.close : t.menu}{" "}
            <span aria-hidden>{open ? "−" : "+"}</span>
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-navigation"
          aria-label="Mobile navigation"
        >
          {links.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={path.startsWith(link.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <span className="micro">0{i + 1}</span>
              {link.label}
              <span aria-hidden>↗</span>
            </Link>
          ))}
          <div className="mobile-language-row">
            <span className="micro">LANGUAGE</span>
            <LocaleSwitcher current={locale} />
          </div>
        </nav>
      )}
    </header>
  );
}
