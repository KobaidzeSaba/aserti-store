import nodemailer, { type Transporter } from "nodemailer";
import type { Locale } from "@/i18n/config";
import { isLocale } from "@/i18n/config";
import {
  renderOrderConfirmation,
  renderOrderShipped,
  type EmailOrder,
} from "./emails/templates";

let cached: Transporter | null = null;

/** Explicit live delivery only; durable jobs record disabled/failed email work. */
function getTransport(): { transport: Transporter; live: boolean } {
  if (process.env.EMAIL_MODE !== "live") throw new Error("Email delivery disabled");
  if (!smtpConfigured()) throw new Error("SMTP configuration incomplete");
  if (cached) return { transport: cached, live: smtpConfigured() };

  if (smtpConfigured()) {
    cached = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      requireTLS: Number(process.env.SMTP_PORT || 587) !== 465,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
    return { transport: cached, live: true };
  }

  throw new Error("SMTP configuration incomplete");
}

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function fromAddress(): string {
  return process.env.SMTP_FROM!;
}

async function send(
  order: EmailOrder,
  subject: string,
  html: string,
  text: string,
  bcc?: string,
): Promise<void> {
  const { transport } = getTransport();
  try {
    await transport.sendMail({
      from: fromAddress(),
      to: order.email,
      bcc,
      subject,
      text,
      html,
    });

  } catch (err) {
    // The durable job records the failure without changing payment status.
    throw new Error("Email delivery failed");
  }
}

export async function sendOrderConfirmationEmail(
  order: EmailOrder,
  localeInput: string,
): Promise<void> {
  const locale: Locale = isLocale(localeInput) ? localeInput : "en";
  const { subject, html, text } = renderOrderConfirmation(order, locale);
  await send(order, subject, html, text, process.env.STORE_NOTIFICATION_EMAIL || undefined);
}

export async function sendOrderShippedEmail(
  order: EmailOrder,
  localeInput: string,
): Promise<void> {
  const locale: Locale = isLocale(localeInput) ? localeInput : "en";
  const { subject, html, text } = renderOrderShipped(order, locale);
  await send(order, subject, html, text);
}
