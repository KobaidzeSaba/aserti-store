import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/i18n/config";
import { editorial } from "@/lib/editorial";
export const metadata: Metadata = {
  title: "Studio",
  description:
    "ASERTI. An independent design project based in Tbilisi. Form, material and contrast.",
};

export default function StudioPage({ params }: { params: { locale: Locale } }) {
  const t = editorial(params.locale);
  return (
    <>
      <div className="page-intro">
        <p className="micro">ASERTI / TBILISI / 2026</p>
        <h1 className="page-title">Studio</h1>
      </div>
      <section className="studio-statement">
        <p className="micro muted">
          INDEPENDENT BY NATURE
          <br />
          ORDER IN CHAOS · 101
        </p>
        <h2>{t.studioLine}</h2>
      </section>
      <figure className="studio-wide-image" data-reveal>
        <Image
          src="/brand/material-study.png"
          alt="ASERTI material study — sculptural wax, reflective metal and stone"
          fill
          priority
          sizes="92vw"
        />
      </figure>
      <section className="studio-process exhibition-section">
        <div data-reveal>
          <span className="micro muted">01 / {t.process}</span>
          <p>{t.studioSecond}</p>
        </div>
        <figure data-reveal>
          <Image
            src="/brand/raw-stone.jpg"
            alt="Natural stone surfaces, texture and fracture"
            fill
            sizes="(max-width: 700px) 78vw, 48vw"
          />
        </figure>
      </section>
      <section className="studio-statement">
        <p className="micro muted">02 / AN OPEN PRACTICE</p>
        <h2>{t.studioThird}</h2>
      </section>
      <section className="coordinate-study">
        <p className="micro muted mb-8">POINT OF ORIGIN</p>
        <h2>TBILISI</h2>
        <div className="coordinate-bottom">
          <p>
            41°42′N
            <br />
            44°47′E
          </p>
          <span className="micro">GEORGIA / 2026</span>
          <Link href={`/${params.locale}/contact`} className="text-link">
            {t.contact}
            <span aria-hidden>↗</span>
          </Link>
        </div>
      </section>
    </>
  );
}
