import type { Locale } from "@/i18n/config";
import { prisma } from "./prisma";
import { localizeProduct } from "./products";
import { shippingFor } from "./money";
import { runOrderJobs } from "./integrationJobs";
import { randomInt } from "node:crypto";
import { MAX_CART_QUANTITY } from "./cart";

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
    s += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
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
  if (!items.length || items.length > 50) throw new Error("Cart is empty.");

  const slugs = Array.from(new Set(items.map((i) => i.slug)));
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, active: true },
  });
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const lineData = items.map((item) => {
    const product = bySlug.get(item.slug);
    if (!product) throw new Error(`Unknown product: ${item.slug}`);
    const quantity = Math.max(
      1,
      Math.min(MAX_CART_QUANTITY, Math.floor(item.quantity)),
    );
    const localized = localizeProduct(product, locale);
    if (localized.hasSizes && !["S", "L"].includes(item.size || "")) throw new Error("Choose a valid size");
    if (!localized.hasSizes && item.size) throw new Error("This product does not accept a size");
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

/** Payment settlement and durable work creation happen in the same transaction. */
export async function markOrderPaid(reference: string, providerPaymentId?: string) {
  await prisma.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({ where: { reference, status: { in: ["pending", "failed"] } }, data: { status: "paid", paidAt: new Date(), ...(providerPaymentId ? { paymentId: providerPaymentId } : {}) } });
    if (!changed.count) return;
    const order = await tx.order.findUniqueOrThrow({ where: { reference } });
    if (order.paymentProvider !== "sandbox") {
      for (const kind of ["shipment", "confirmation"]) await tx.integrationJob.upsert({ where: { reference_kind: { reference, kind } }, create: { reference, kind }, update: {} });
    }
  });
  // Settlement stays recorded even if a downstream integration fails.
  await runOrderJobs(reference);
  return prisma.order.findUniqueOrThrow({ where: { reference } });
}

export async function markOrderFailed(reference: string) {
  await prisma.order.updateMany({ where: { reference, status: "pending" }, data: { status: "failed" } });
  return prisma.order.findUnique({ where: { reference } });
}

export async function markOrderShipped(reference: string) {
  await prisma.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({ where: { reference, status: "paid", shipmentId: { not: null }, paymentProvider: { not: "sandbox" } }, data: { status: "shipped" } });
    if (changed.count) await tx.integrationJob.upsert({ where: { reference_kind: { reference, kind: "shipped-email" } }, create: { reference, kind: "shipped-email" }, update: {} });
  });
  await runOrderJobs(reference);
  return prisma.order.findUniqueOrThrow({ where: { reference } });
}
