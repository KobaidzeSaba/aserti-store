import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/i18n/config";
import { getFeaturedProducts } from "@/lib/products";
import { contact, editorial } from "@/lib/editorial";
import { ProductCard } from "@/components/ProductCard";
import { ExhibitionHero } from "@/components/ExhibitionHero";
import { MaterialStudy } from "@/components/MaterialStudy";
import { Cycle } from "@/components/Cycle";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = params;
  const t = editorial(locale);
  const featured = (await getFeaturedProducts(locale)).slice(0, 2);
  return (
    <>
      <ExhibitionHero locale={locale} />
      <MaterialStudy locale={locale} />
      <section
        className="language-section exhibition-section"
        aria-label="Visual language"
      >
        <div className="language-left">
          <p className="micro">
            ASERTI
            <br />
            <span className="muted">A WORLD OF OBJECTS</span>
          </p>
          <div className="language-fragment" data-reveal>
            <Image
              src="/brand/material-study.png"
              alt="Soft wax surface and the trace of a sculpted form"
              fill
              sizes="(max-width: 700px) 23vw, 22vw"
            />
          </div>
        </div>
        <h2 className="language-words" data-reveal>
          {t.words.map((word) => (
            <span key={word}>{word}</span>
          ))}
        </h2>
      </section>
      <section className="contrast-section" aria-label="Stone / Mirror">
        <div className="contrast-image">
          <Image
            src="/brand/raw-stone.jpg"
            alt="Rough, fractured black stone"
            fill
            sizes="50vw"
          />
        </div>
        <div className="contrast-image contrast-mirror">
          <Image
            src="/brand/fusion.jpg"
            alt="Light reflected across polished metal"
            fill
            sizes="50vw"
          />
        </div>
        <h2 className="contrast-title">
          <span>STONE</span>
          <span>/</span>
          <span>MIRROR</span>
        </h2>
        <div className="contrast-caption micro">
          <span>02 / CONTRAST</span>
          <span>{t.rawRefined}</span>
        </div>
      </section>
      <Cycle locale={locale} />
      {featured.length > 0 && (
        <section className="selected-section exhibition-section" id="objects">
          <div className="section-heading" data-reveal>
            <div>
              <p className="micro section-index">04 / OBJECT INDEX</p>
              <h2>{t.selected}</h2>
            </div>
            <Link href={`/${locale}/shop`} className="text-link">
              {t.viewAll}
              <span aria-hidden>↗</span>
            </Link>
          </div>
          <div className="selected-grid">
            {featured.map((product, index) => (
              <div key={product.id} data-reveal>
                <ProductCard
                  product={product}
                  locale={locale}
                  index={index + 1}
                />
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="origin-section exhibition-section">
        <figure className="origin-image" data-reveal>
          <Image
            src="/brand/material-study.png"
            alt="Wax, metal and stone — an ongoing material study"
            fill
            sizes="(max-width: 700px) 78vw, 42vw"
          />
        </figure>
        <div className="origin-copy" data-reveal>
          <p className="micro muted">05 / POINT OF ORIGIN</p>
          <h2>TBILISI</h2>
          <span className="micro">41°42′N &nbsp; 44°47′E</span>
          <p>{t.studioLine}</p>
          <Link className="text-link" href={`/${locale}/studio`}>
            Inside the studio<span aria-hidden>↗</span>
          </Link>
        </div>
      </section>
      {contact.instagram && (
        <section className="social-stream exhibition-section">
          <div className="section-heading">
            <div>
              <p className="micro section-index">AN ONGOING STUDY</p>
              <h2>@ASERTI</h2>
            </div>
            <a
              href={contact.instagram}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Instagram<span aria-hidden>↗</span>
            </a>
          </div>
          <div className="social-stream-images">
            {[
              "/brand/raw-stone.jpg",
              "/brand/material-study.png",
              "/brand/fusion.jpg",
            ].map((src) => (
              <figure key={src}>
                <Image
                  src={src}
                  alt="ASERTI material study"
                  fill
                  sizes="33vw"
                />
              </figure>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
