import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { contact, editorial } from "@/lib/editorial";
export const metadata: Metadata = { title: "Contact" };
export default function ContactPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const t = editorial(params.locale);
  const dict = getDictionary(params.locale);
  return (
    <>
      <div className="page-intro">
        <p className="micro">ASERTI / IN CONVERSATION</p>
        <h1 className="page-title contact-title">{t.contact}</h1>
      </div>
      <section className="contact-body">
        <div>
          <p>{t.enquiries}</p>
          <div className="contact-channels">
            {contact.email && (
              <a className="text-link" href={`mailto:${contact.email}`}>
                {contact.email}
                <span aria-hidden>↗</span>
              </a>
            )}
            {contact.instagram && (
              <a
                className="text-link"
                href={contact.instagram}
                target="_blank"
                rel="noreferrer"
              >
                Instagram<span aria-hidden>↗</span>
              </a>
            )}
            {!contact.email && !contact.instagram && (
              <span className="text-sm muted">{t.contactPending}</span>
            )}
            <Link className="text-link" href={`/${params.locale}/track`}>
              {dict.track.link}
              <span aria-hidden>↗</span>
            </Link>
            <div className="micro muted mt-12">
              TBILISI / GEORGIA
              <br />
              41°42′N &nbsp; 44°47′E
            </div>
          </div>
        </div>
        <figure className="contact-visual">
          <Image
            src="/brand/fusion-cutout.png"
            alt="ASERTI stone and mirror object study"
            fill
            sizes="(max-width: 700px) 90vw, 42vw"
          />
        </figure>
      </section>
    </>
  );
}
