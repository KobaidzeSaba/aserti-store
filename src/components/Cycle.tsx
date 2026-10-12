import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { editorial } from "@/lib/editorial";

export function Cycle({
  locale,
  full = false,
}: {
  locale: Locale;
  full?: boolean;
}) {
  const t = editorial(locale);
  return (
    <section
      className={`cycle-section${full ? " cycle-full" : ""}`}
      id="cycle"
      aria-labelledby="cycle-title"
    >
      <div className="cycle-top micro">
        <span>END → TRANSFORM → BEGIN</span>
        <span>03 / CONTINUUM</span>
      </div>
      {full ? (
        <h1 className="cycle-number" id="cycle-title">
          101
        </h1>
      ) : (
        <h2 className="cycle-number" id="cycle-title">
          101
        </h2>
      )}
      <div className="cycle-bottom">
        <p className="cycle-label">{t.newCycle}</p>
        <p className="micro">{t.cycleNote}</p>
        {!full && (
          <Link
            href={`/${locale}/101`}
            className="circle-link"
            aria-label="101 — new cycle"
          >
            ↗
          </Link>
        )}
      </div>
    </section>
  );
}
