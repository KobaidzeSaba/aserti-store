import Image from "next/image";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default function AboutPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const dict = getDictionary(params.locale);
  return (
    <div>
      {/* Raw stone banner */}
      <section className="relative h-[42vh] min-h-72 w-full overflow-hidden border-b border-silver-muted/15">
        <Image
          src="/brand/raw-stone.jpg"
          alt="Raw stone texture"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="container-x absolute inset-x-0 bottom-0">
          <p className="pb-6 text-xs uppercase tracking-luxe text-silver">
            Raw stone texture
          </p>
        </div>
      </section>

      <div className="container-x grid gap-14 py-20 lg:grid-cols-2 lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-luxe text-champagne">
            ASERTI · Tbilisi 2026
          </p>
          <h1 className="heading-serif mt-4 text-4xl text-silver">
            {dict.about.title}
          </h1>
          <p className="mt-8 text-lg leading-relaxed text-silver-muted">
            {dict.about.body}
          </p>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden border border-silver-muted/15">
          <Image
            src="/brand/fusion.jpg"
            alt="The fusion of raw stone and mirror silver"
            fill
            sizes="(min-width: 1024px) 40vw, 90vw"
            className="object-cover"
          />
        </div>
      </div>

      {/* Visual code */}
      <section className="border-t border-silver-muted/15 bg-ink-soft">
        <div className="container-x py-16">
          <h2 className="heading-serif text-center text-3xl text-silver">
            {dict.home.valuesTitle}
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {dict.home.values.map((v) => (
              <div
                key={v.title}
                className="border border-silver-muted/15 p-6 text-center"
              >
                <h3 className="heading-serif text-lg text-champagne">{v.title}</h3>
                <p className="mt-2 text-sm text-silver-muted">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
