import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { prisma } from "@/lib/prisma";
import { SandboxPay } from "@/components/SandboxPay";

export const dynamic = "force-dynamic";

export default async function SandboxPayPage({
  params,
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { ref?: string };
}) {
  const dict = getDictionary(params.locale);
  const ref = searchParams.ref;
  if (!ref) notFound();

  const order = await prisma.order.findUnique({ where: { reference: ref } });
  if (!order) notFound();
  // Mock pay page is only valid for orders that used the in-app sandbox gateway.
  if (order.paymentProvider !== "sandbox") notFound();

  // If already finalised, skip the mock page.
  if (order.status !== "pending") {
    redirect(`/${params.locale}/order/${ref}`);
  }

  return (
    <div className="container-x py-20">
      <SandboxPay
        locale={params.locale}
        dict={dict}
        reference={order.reference}
        amount={order.total}
      />
    </div>
  );
}
