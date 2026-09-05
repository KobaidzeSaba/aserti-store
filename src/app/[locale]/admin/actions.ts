"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isLocale } from "@/i18n/config";
import {
  SESSION_COOKIE,
  checkCredentials,
  createSessionToken,
  isAuthenticated,
  sessionCookieOptions,
} from "@/lib/auth";
import { markOrderShipped } from "@/lib/orders";

export async function login(formData: FormData): Promise<void> {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  const localeRaw = String(formData.get("locale") || "en");
  const locale = isLocale(localeRaw) ? localeRaw : "en";

  if (!checkCredentials(username, password)) {
    redirect(`/${locale}/admin/login?error=1`);
  }

  cookies().set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions());
  redirect(`/${locale}/admin`);
}

export async function logout(formData: FormData): Promise<void> {
  const localeRaw = String(formData.get("locale") || "en");
  const locale = isLocale(localeRaw) ? localeRaw : "en";
  cookies().delete(SESSION_COOKIE);
  redirect(`/${locale}/admin/login`);
}

/** Mark a paid order shipped (admin only) and email the customer tracking. */
export async function markShipped(formData: FormData): Promise<void> {
  const localeRaw = String(formData.get("locale") || "en");
  const locale = isLocale(localeRaw) ? localeRaw : "en";
  // Auth guard — server actions are public POST endpoints.
  if (!isAuthenticated()) redirect(`/${locale}/admin/login`);

  const reference = String(formData.get("reference") || "");
  if (reference) {
    try {
      await markOrderShipped(reference);
    } catch (err) {
      console.error("markShipped error:", err);
    }
  }
  revalidatePath(`/${locale}/admin`);
}
