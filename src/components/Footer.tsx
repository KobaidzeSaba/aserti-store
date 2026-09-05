import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const base = `/${locale}`;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-silver-muted/15 bg-ink-soft">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="heading-serif text-2xl tracking-[0.35em] text-silver">
            {dict.brand}
          </div>
          <p className="mt-3 max-w-xs text-sm text-silver-muted">{dict.tagline}</p>
        </div>

        <div>
          <h4 className="label">{dict.nav.shop}</h4>
          <ul className="space-y-2 text-sm text-silver-muted">
            <li><Link href={`${base}/shop/rings`} className="hover:text-champagne">{dict.nav.rings}</Link></li>
            <li><Link href={`${base}/shop/earrings`} className="hover:text-champagne">{dict.nav.earrings}</Link></li>
            <li><Link href={`${base}/shop/crosses`} className="hover:text-champagne">{dict.nav.crosses}</Link></li>
            <li><Link href={`${base}/about`} className="hover:text-champagne">{dict.nav.about}</Link></li>
            <li><Link href={`${base}/track`} className="hover:text-champagne">{dict.track.link}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="label">{dict.footer.payments.split(" ").slice(0, 1).join(" ")}</h4>
          <p className="text-sm text-silver-muted">{dict.footer.payments}</p>
          <p className="mt-2 text-sm text-silver-muted">{dict.footer.shipping}</p>
        </div>

        <div className="text-sm text-silver-muted">
          <h4 className="label">ASERTI STORE</h4>
          <p>Tbilisi, Georgia</p>
          <p className="mt-2">© {year} ASERTI. {dict.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
