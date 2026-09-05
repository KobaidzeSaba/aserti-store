import type { Locale } from "@/i18n/config";
import { prisma } from "./prisma";
import { localizeProduct } from "./products";
import { shippingFor } from "./money";
import { createShipment } from "./shipping/quickshipper";
import { sendOrderConfirmationEmail, sendOrderShippedEmail } from "./email";

export type CheckoutItemInput = {
  slug: string;
  size?: string | null;
  quantity: number;
};

export type CustomerInput = {
  customerName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  note?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReference(): string {
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  }
  return `AS-${s}`;
}

/**
 * Create a pending order. Prices are recomputed from the database — the
 * client-supplied cart is only used for product identity, size and quantity.
 */
export async function createOrder(params: {
  items: CheckoutItemInput[];
  customer: CustomerInput;
  locale: Locale;
}) {
  const { items, customer, locale } = params;
  if (!items.length) throw new Error("Cart is empty.");

  const slugs = Array.from(new Set(items.map((i) => i.slug)));
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, active: true },
  });
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const lineData = items.map((item) => {
    const product = bySlug.get(item.slug);
    if (!product) throw new Error(`Unknown product: ${item.slug}`);
    const quantity = Math.max(1, Math.min(20, Math.floor(item.quantity)));
    const localized = localizeProduct(product, locale);
    const unitPrice = product.price;
    return {
      productId: product.id,
      nameSnapshot: localized.name,
      size: item.size || null,
      unitPrice,
      quantity,
      lineTotal: Number((unitPrice * quantity).toFixed(2)),
      weight: product.weight * quantity,
    };
  });

  const subtotal = Number(
    lineData.reduce((sum, l) => sum + l.lineTotal, 0).toFixed(2),
  );
  const shippingCost = shippingFor(subtotal);
  const total = Number((subtotal + shippingCost).toFixed(2));
  const totalWeight = lineData.reduce((s, l) => s + l.weight, 0);

  // Retry a few times in case of a reference collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = generateReference();
    const existing = await prisma.order.findUnique({ where: { reference } });
    if (existing) continue;

    const order = await prisma.order.create({
      data: {
        reference,
        status: "pending",
        currency: process.env.NEXT_PUBLIC_CURRENCY || "GEL",
        subtotal,
        shippingCost,
        total,
        customerName: customer.customerName,
        email: customer.email,
        phone: customer.phone,
        city: customer.city,
        address: customer.address,
        note: customer.note || null,
        latitude: customer.latitude ?? null,
        longitude: customer.longitude ?? null,
        locale,
        items: {
          create: lineData.map((l) => ({
            productId: l.productId,
            nameSnapshot: l.nameSnapshot,
            size: l.size,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            lineTotal: l.lineTotal,
          })),
        },
      },
    });

    return { order, totalWeight };
  }

  throw new Error("Could not generate a unique order reference.");
}

/**
 * Mark an order paid and create the Quickshipper shipment (idempotent).
 */
export async function markOrderPaid(
  reference: string,
  providerPaymentId?: string,
) {
  const order = await prisma.order.findUnique({
    where: { reference },
    include: { items: { include: { product: true } } },
  });
  if (!order) throw new Error(`Order not found: ${reference}`);
  if (order.status === "paid" || order.status === "shipped") return order;

  const totalWeight = order.items.reduce(
    (s, it) => s + it.product.weight * it.quantity,
    0,
  );

  const shipment = await createShipment({
    reference: order.reference,
    recipientName: order.customerName,
    phone: order.phone,
    city: order.city,
    address: order.address,
    latitude: order.latitude,
    longitude: order.longitude,
    note: order.note,
    declaredValue: order.total,
    weightGrams: totalWeight,
  });

  const updated = await prisma.order.update({
    where: { reference },
    data: {
      status: "paid",
      paidAt: new Date(),
      paymentId: providerPaymentId ?? order.paymentId,
      shipmentId: shipment.shipmentId,
      trackingCode: shipment.trackingCode,
    },
  });

  // Send the confirmation email (best-effort — never blocks fulfilment).
  await sendOrderConfirmationEmail(
    {
      reference: updated.reference,
      email: updated.email,
      customerName: updated.customerName,
      city: updated.city,
      address: updated.address,
      subtotal: updated.subtotal,
      shippingCost: updated.shippingCost,
      total: updated.total,
      trackingCode: updated.trackingCode,
      items: order.items.map((it) => ({
        nameSnapshot: it.nameSnapshot,
        size: it.size,
        quantity: it.quantity,
        lineTotal: it.lineTotal,
      })),
    },
    updated.locale,
  );

  return updated;
}

export async function markOrderFailed(reference: string) {
  const order = await prisma.order.findUnique({ where: { reference } });
  if (!order || order.status === "paid" || order.status === "shipped") return order;
  return prisma.order.update({
    where: { reference },
    data: { status: "failed" },
  });
}

/**
 * Mark a paid order as shipped and email the customer their tracking code.
 * Only a "paid" order can transition to "shipped" (idempotent).
 */
export async function markOrderShipped(reference: string) {
  const order = await prisma.order.findUnique({
    where: { reference },
    include: { items: true },
  });
  if (!order) throw new Error(`Order not found: ${reference}`);
  if (order.status !== "paid") return order; // must be paid; ignore otherwise

  const updated = await prisma.order.update({
    where: { reference },
    data: { status: "shipped" },
  });

  await sendOrderShippedEmail(
    {
      reference: updated.reference,
      email: updated.email,
      customerName: updated.customerName,
      city: updated.city,
      address: updated.address,
      subtotal: updated.subtotal,
      shippingCost: updated.shippingCost,
      total: updated.total,
      trackingCode: updated.trackingCode,
      items: order.items.map((it) => ({
        nameSnapshot: it.nameSnapshot,
        size: it.size,
        quantity: it.quantity,
        lineTotal: it.lineTotal,
      })),
    },
    updated.locale,
  );

  return updated;
}
