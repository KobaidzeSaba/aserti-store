import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { CartClient } from "@/components/CartClient";

export default function CartPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const dict = getDictionary(params.locale);
  return (
    <div className="container-x py-14">
      <h1 className="heading-serif text-4xl text-silver">{dict.cart.title}</h1>
      <div className="mt-10">
        <CartClient locale={params.locale} dict={dict} />
      </div>
    </div>
  );
}
