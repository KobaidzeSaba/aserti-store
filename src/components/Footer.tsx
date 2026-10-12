import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { contact, editorial } from "@/lib/editorial";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = editorial(locale);
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link href={`/${locale}`} className="footer-wordmark">
          ASERTI
        </Link>
        <p className="micro">
          ORDER IN CHAOS · 101
          <br />
          <span className="muted">TBILISI / GEORGIA</span>
        </p>
        <nav aria-label="Footer" className="footer-links">
          {contact.instagram && (
            <a href={contact.instagram} target="_blank" rel="noreferrer">
              Instagram ↗
            </a>
          )}
          <Link href={`/${locale}/contact`}>{t.contact}</Link>
          <Link href={`/${locale}/shop`}>{dict.nav.shop}</Link>
          <Link href={`/${locale}/track`}>{dict.track.link}</Link>
        </nav>
      </div>
      <div className="footer-bottom micro">
        <span>© {new Date().getFullYear()} ASERTI</span>
        <span>41°42′N &nbsp; 44°47′E</span>
        <a href="#top">↑</a>
      </div>
    </footer>
  );
}
