import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { lookupOrder } from "./actions";

export const dynamic = "force-dynamic";

export default function TrackPage({
  params,
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { error?: string };
}) {
  const dict = getDictionary(params.locale);
  const hasError = searchParams.error === "1";

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-20">
      <h1 className="heading-serif text-3xl text-silver">{dict.track.title}</h1>
      <p className="mt-2 text-sm text-silver-muted">{dict.track.subtitle}</p>

      <form action={lookupOrder} className="mt-8 space-y-4">
        <input type="hidden" name="locale" value={params.locale} />
        <div>
          <label className="label">{dict.track.reference}</label>
          <input name="reference" className="field" placeholder="AS-XXXXXX" autoComplete="off" />
        </div>
        <div>
          <label className="label">{dict.track.email}</label>
          <input name="email" type="email" className="field" autoComplete="email" />
        </div>

        {hasError && (
          <p className="rounded-none border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
            {dict.track.notFound}
          </p>
        )}

        <button type="submit" className="btn-gold w-full">
          {dict.track.submit}
        </button>
      </form>
    </div>
  );
}
