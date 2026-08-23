import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isLocale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { createOrder } from "@/lib/orders";
import { getGateway, type PaymentProvider } from "@/lib/payments";
import { getBaseUrl } from "@/lib/baseUrl";

const schema = z.object({
  locale: z.string(),
  provider: z.enum(["tbc", "bog"]),
  customer: z.object({
    customerName: z.string().min(1).max(120),
    email: z.string().email().max(160),
    phone: z.string().min(3).max(40),
    city: z.string().min(1).max(80),
    address: z.string().min(1).max(240),
    note: z.string().max(500).optional().nullable(),
  }),
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        size: z.string().nullable().optional(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { locale, provider, customer, items } = parsed.data;
  if (!isLocale(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  try {
    const { order } = await createOrder({ items, customer, locale });

    const base = getBaseUrl(req);
    const returnUrl = `${base}/${locale}/order/${order.reference}`;
    const callbackUrl = `${base}/api/payments/${provider}/callback?ref=${order.reference}`;

    const gateway = getGateway(provider as PaymentProvider);

    const payment = await gateway.createPayment({
      orderId: order.id,
      reference: order.reference,
      amount: order.total,
      currency: order.currency,
      locale,
      basket: [{ name: `ASERTI order ${order.reference}`, quantity: 1, unitPrice: order.total }],
      returnUrl,
      callbackUrl,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentProvider: gateway.provider,
        paymentId: payment.providerPaymentId,
      },
    });

    return NextResponse.json({
      reference: order.reference,
      redirectUrl: payment.redirectUrl,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    const message =
      err instanceof Error ? err.message : "Checkout failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
