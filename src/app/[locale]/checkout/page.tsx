import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { isMockProvider } from "@/lib/payments";
import { CheckoutForm } from "@/components/CheckoutForm";

export const dynamic = "force-dynamic";

export default function CheckoutPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const dict = getDictionary(params.locale);
  return (
    <div className="container-x py-14">
      <h1 className="heading-serif text-4xl text-silver">{dict.checkout.title}</h1>
      <div className="mt-10">
        <CheckoutForm
          locale={params.locale}
          dict={dict}
          mock={{ flitt: isMockProvider("flitt"), bog: isMockProvider("bog") }}
        />
      </div>
    </div>
  );
}
