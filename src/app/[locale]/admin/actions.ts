"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import {
  SESSION_COOKIE,
  checkCredentials,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";

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
