import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// ALK Sanet — the brand's Georgian typeface, self-hosted and used site-wide.
const alkSanet = localFont({
  src: "../../fonts/alk-sanet.ttf",
  variable: "--font-alk",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  const locale = isLocale(params.locale) ? params.locale : "ka";
  const dict = getDictionary(locale);
  const description = `${dict.tagline} ${dict.home.heroSubtitle}`;
  return {
    title: { default: `ASERTI — ${dict.tagline}`, template: "%s · ASERTI" },
    description,
    openGraph: {
      title: "ASERTI",
      description,
      siteName: "ASERTI",
      type: "website",
      locale,
    },
    twitter: { card: "summary_large_image", title: "ASERTI", description },
  };
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);

  return (
    <html lang={locale} className={alkSanet.variable}>
      <body className="flex min-h-screen flex-col">
        <CartProvider>
          <Header locale={locale} dict={dict} />
          <main className="flex-1">{children}</main>
          <Footer locale={locale} dict={dict} />
        </CartProvider>
      </body>
    </html>
  );
}
