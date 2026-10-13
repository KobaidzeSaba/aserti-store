import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { isMockProvider, providerAvailable } from "@/lib/payments";
import { CheckoutForm } from "@/components/CheckoutForm";
import { isCatalogPreview } from "@/lib/products";
import { editorial } from "@/lib/editorial";

export const dynamic = "force-dynamic";

export default function CheckoutPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const dict = getDictionary(params.locale);
  return (
    <div className="container-x py-14">
      <h1 className="heading-serif text-4xl text-silver">
        {dict.checkout.title}
      </h1>
      {isCatalogPreview() && (
        <p
          className="mt-6 border-y border-silver-muted/20 py-4 text-sm"
          role="status"
        >
          {editorial(params.locale).preview}
        </p>
      )}
      <div className="mt-10">
        <CheckoutForm
          locale={params.locale}
          dict={dict}
          available={{ flitt: providerAvailable("flitt"), bog: providerAvailable("bog") }}
          mock={{ flitt: isMockProvider("flitt"), bog: isMockProvider("bog") }}
        />
      </div>
    </div>
  );
}
