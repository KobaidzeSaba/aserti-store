import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ExhibitionMotion } from "@/components/ExhibitionMotion";
import { editorial } from "@/lib/editorial";

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
  const description = `${editorial(locale).studioLine} ${editorial(locale).studioSecond}`;
  return {
    title: { default: "Order in Chaos · 101", template: "%s · ASERTI" },
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
      <body className="flex min-h-screen flex-col" id="top">
        <CartProvider>
          <a href="#main-content" className="skip-link">
            {locale === "ka"
              ? "შინაარსზე გადასვლა"
              : locale === "ru"
                ? "К содержимому"
                : "Skip to content"}
          </a>
          <Header locale={locale} dict={dict} />
          <main className="w-full flex-1" id="main-content">
            {children}
          </main>
          <Footer locale={locale} dict={dict} />
          <ExhibitionMotion />
        </CartProvider>
      </body>
    </html>
  );
}
