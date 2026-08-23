import nodemailer, { type Transporter } from "nodemailer";
import type { Locale } from "@/i18n/config";
import { isLocale } from "@/i18n/config";
import {
  renderOrderConfirmation,
  type EmailOrder,
} from "./emails/templates";

let cached: Transporter | null = null;

/**
 * Returns a nodemailer transport. If SMTP is configured (SMTP_HOST), a real
 * SMTP transport is used. Otherwise a JSON transport is used which does NOT
 * send anything — the message is logged to the server console so the flow
 * works in development without an email provider.
 */
function getTransport(): { transport: Transporter; live: boolean } {
  if (cached) return { transport: cached, live: smtpConfigured() };

  if (smtpConfigured()) {
    cached = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
    return { transport: cached, live: true };
  }

  cached = nodemailer.createTransport({ jsonTransport: true });
  return { transport: cached, live: false };
}

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

function fromAddress(): string {
  return process.env.SMTP_FROM || "ASERTI STORE <no-reply@aserti.store>";
}

export async function sendOrderConfirmationEmail(
  order: EmailOrder,
  localeInput: string,
): Promise<void> {
  const locale: Locale = isLocale(localeInput) ? localeInput : "en";
  const { subject, html, text } = renderOrderConfirmation(order, locale);
  const { transport, live } = getTransport();

  const bcc = process.env.STORE_NOTIFICATION_EMAIL || undefined;

  try {
    const info = await transport.sendMail({
      from: fromAddress(),
      to: order.email,
      bcc,
      subject,
      text,
      html,
    });

    if (!live) {
      console.log(
        `[email] (dev, not sent) order ${order.reference} → ${order.email}\n` +
          `        subject: ${subject}`,
      );
    } else {
      console.log(`[email] sent order ${order.reference} → ${order.email} (${info.messageId})`);
    }
  } catch (err) {
    // Never let email failure break order fulfilment.
    console.error(`[email] failed for order ${order.reference}:`, err);
  }
}
