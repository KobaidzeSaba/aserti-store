import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default function AboutPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const dict = getDictionary(params.locale);
  return (
    <div className="container-x max-w-3xl py-20">
      <h1 className="heading-serif text-4xl text-silver">{dict.about.title}</h1>
      <p className="mt-8 text-lg leading-relaxed text-silver-muted">
        {dict.about.body}
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {dict.home.values.map((v) => (
          <div key={v.title} className="rounded-sm border border-silver-muted/15 p-5">
            <h3 className="heading-serif text-lg text-champagne">{v.title}</h3>
            <p className="mt-2 text-sm text-silver-muted">{v.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
