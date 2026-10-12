import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/i18n/config";
import { editorial } from "@/lib/editorial";
import { Cycle } from "@/components/Cycle";
export const metadata: Metadata = {
  title: "101 — New cycle",
  description: "End. Transform. Begin. Order in Chaos · 101.",
};
export default function CyclePage({ params }: { params: { locale: Locale } }) {
  const t = editorial(params.locale);
  return (
    <>
      <Cycle locale={params.locale} full />
      <section className="studio-process exhibition-section">
        <div data-reveal>
          <p className="micro muted">OLD FORM → NEW FORM</p>
          <p>{t.cycle}</p>
          <Link href={`/${params.locale}/shop`} className="text-link mt-12">
            {t.objects}
            <span aria-hidden>↗</span>
          </Link>
        </div>
        <figure data-reveal>
          <Image
            src="/brand/fusion.jpg"
            alt="Raw stone and mirror surface becoming one form"
            fill
            priority
            sizes="(max-width: 700px) 78vw, 48vw"
          />
        </figure>
      </section>
    </>
  );
}
