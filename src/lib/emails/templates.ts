import type { Locale } from "@/i18n/config";
import { formatPrice } from "@/lib/money";

export type EmailOrderItem = {
  nameSnapshot: string;
  size?: string | null;
  quantity: number;
  lineTotal: number;
};

export type EmailOrder = {
  reference: string;
  email: string;
  customerName: string;
  city: string;
  address: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  trackingCode?: string | null;
  items: EmailOrderItem[];
};

type Strings = {
  subject: (ref: string) => string;
  heading: string;
  greeting: (name: string) => string;
  paidBody: string;
  orderRef: string;
  itemsTitle: string;
  subtotal: string;
  shipping: string;
  free: string;
  total: string;
  shipTitle: string;
  tracking: string;
  shipTo: string;
  thanks: string;
  signature: string;
};

const strings: Record<Locale, Strings> = {
  en: {
    subject: (ref) => `ASERTI — order ${ref} confirmed`,
    heading: "Your order is confirmed",
    greeting: (name) => `Dear ${name},`,
    paidBody:
      "Thank you for your purchase. We've received your payment and are preparing your order.",
    orderRef: "Order reference",
    itemsTitle: "Order summary",
    subtotal: "Subtotal",
    shipping: "Shipping",
    free: "Free",
    total: "Total",
    shipTitle: "Shipping",
    tracking: "Tracking code",
    shipTo: "Ship to",
    thanks: "We'll notify you when your parcel is on its way with Quickshipper.",
    signature: "With care,\nASERTI STORE · Tbilisi",
  },
  ka: {
    subject: (ref) => `ASERTI — შეკვეთა ${ref} დადასტურდა`,
    heading: "თქვენი შეკვეთა დადასტურდა",
    greeting: (name) => `ძვირფასო ${name},`,
    paidBody:
      "გმადლობთ შენაძენისთვის. გადახდა მიღებულია და ვამზადებთ თქვენს შეკვეთას.",
    orderRef: "შეკვეთის ნომერი",
    itemsTitle: "შეკვეთის შეჯამება",
    subtotal: "ქვეჯამი",
    shipping: "მიწოდება",
    free: "უფასო",
    total: "სულ",
    shipTitle: "მიწოდება",
    tracking: "თრექინგ კოდი",
    shipTo: "მისამართი",
    thanks: "შეგატყობინებთ, როცა ამანათი Quickshipper-ით გამოიგზავნება.",
    signature: "პატივისცემით,\nASERTI STORE · თბილისი",
  },
  ru: {
    subject: (ref) => `ASERTI — заказ ${ref} подтверждён`,
    heading: "Ваш заказ подтверждён",
    greeting: (name) => `Уважаемый(ая) ${name},`,
    paidBody:
      "Спасибо за покупку. Мы получили оплату и готовим ваш заказ.",
    orderRef: "Номер заказа",
    itemsTitle: "Ваш заказ",
    subtotal: "Подытог",
    shipping: "Доставка",
    free: "Бесплатно",
    total: "Итого",
    shipTitle: "Доставка",
    tracking: "Трек-код",
    shipTo: "Адрес",
    thanks: "Мы сообщим вам, когда посылка будет отправлена через Quickshipper.",
    signature: "С уважением,\nASERTI STORE · Тбилиси",
  },
};

export function renderOrderConfirmation(order: EmailOrder, locale: Locale) {
  const t = strings[locale] ?? strings.en;
  const money = (n: number) => formatPrice(n, locale);

  const itemsText = order.items
    .map(
      (i) =>
        `  • ${i.nameSnapshot}${i.size ? ` (${i.size})` : ""} × ${i.quantity} — ${money(i.lineTotal)}`,
    )
    .join("\n");

  const text = [
    t.heading,
    "",
    t.greeting(order.customerName),
    t.paidBody,
    "",
    `${t.orderRef}: ${order.reference}`,
    "",
    `${t.itemsTitle}:`,
    itemsText,
    "",
    `${t.subtotal}: ${money(order.subtotal)}`,
    `${t.shipping}: ${order.shippingCost === 0 ? t.free : money(order.shippingCost)}`,
    `${t.total}: ${money(order.total)}`,
    "",
    order.trackingCode ? `${t.tracking}: ${order.trackingCode}` : "",
    `${t.shipTo}: ${order.customerName}, ${order.city}, ${order.address}`,
    "",
    t.thanks,
    "",
    t.signature,
  ]
    .filter((l) => l !== null && l !== undefined)
    .join("\n");

  const itemsHtml = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;color:#4b4b52;font-size:14px;">
          ${escapeHtml(i.nameSnapshot)}${i.size ? ` · ${escapeHtml(i.size)}` : ""} × ${i.quantity}
        </td>
        <td style="padding:8px 0;text-align:right;color:#0e0e10;font-size:14px;white-space:nowrap;">
          ${money(i.lineTotal)}
        </td>
      </tr>`,
    )
    .join("");

  const html = `
  <div style="background:#f4f2ee;padding:32px 0;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border:1px solid #e6e1d8;border-radius:6px;overflow:hidden;">
          <tr>
            <td style="background:#000000;padding:28px 32px;text-align:center;">
              <div style="letter-spacing:8px;color:#ffffff;font-size:22px;">ASERTI</div>
            </td>
          </tr>
          <tr><td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:24px;color:#0e0e10;font-weight:500;">${t.heading}</h1>
            <p style="margin:0 0 6px;color:#4b4b52;font-size:15px;">${t.greeting(escapeHtml(order.customerName))}</p>
            <p style="margin:0 0 20px;color:#4b4b52;font-size:15px;line-height:1.5;">${t.paidBody}</p>

            <p style="margin:0 0 20px;font-size:14px;color:#4b4b52;">
              ${t.orderRef}: <strong style="color:#0e0e10;">${order.reference}</strong>
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="border-top:1px solid #e6e1d8;border-bottom:1px solid #e6e1d8;margin-bottom:16px;">
              ${itemsHtml}
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="color:#4b4b52;font-size:14px;padding:2px 0;">${t.subtotal}</td>
                  <td style="text-align:right;color:#0e0e10;font-size:14px;">${money(order.subtotal)}</td></tr>
              <tr><td style="color:#4b4b52;font-size:14px;padding:2px 0;">${t.shipping}</td>
                  <td style="text-align:right;color:#0e0e10;font-size:14px;">${order.shippingCost === 0 ? t.free : money(order.shippingCost)}</td></tr>
              <tr><td style="color:#0e0e10;font-size:16px;padding:8px 0 0;font-weight:600;">${t.total}</td>
                  <td style="text-align:right;color:#000000;font-size:16px;padding:8px 0 0;font-weight:700;">${money(order.total)}</td></tr>
            </table>

            ${
              order.trackingCode
                ? `<p style="margin:20px 0 0;font-size:14px;color:#4b4b52;">${t.tracking}: <strong style="color:#0e0e10;">${escapeHtml(order.trackingCode)}</strong></p>`
                : ""
            }
            <p style="margin:6px 0 0;font-size:14px;color:#4b4b52;">
              ${t.shipTo}: ${escapeHtml(order.customerName)}, ${escapeHtml(order.city)}, ${escapeHtml(order.address)}
            </p>

            <p style="margin:24px 0 0;font-size:14px;color:#4b4b52;line-height:1.5;">${t.thanks}</p>
            <p style="margin:20px 0 0;font-size:14px;color:#9a9aa2;white-space:pre-line;">${t.signature}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </div>`;

  return { subject: t.subject(order.reference), text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
