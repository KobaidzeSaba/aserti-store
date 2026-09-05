"use server";

import { redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";

/**
 * Look up an order by reference + email. The email must match the order on
 * file, so an order can't be viewed by guessing the reference alone.
 */
export async function lookupOrder(formData: FormData): Promise<void> {
  const localeRaw = String(formData.get("locale") || "en");
  const locale = isLocale(localeRaw) ? localeRaw : "en";
  const reference = String(formData.get("reference") || "").trim().toUpperCase();
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!reference || !email) redirect(`/${locale}/track?error=1`);

  const order = await prisma.order.findUnique({ where: { reference } });
  if (!order || order.email.toLowerCase() !== email) {
    redirect(`/${locale}/track?error=1`);
  }

  redirect(`/${locale}/order/${order.reference}`);
}
