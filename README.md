# ASERTI STORE

A trilingual (ქართული / English / Русский) e-commerce store for ASERTI sterling-silver
jewelry, built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS** and
**Prisma**. Payments via **TBC Bank** and **Bank of Georgia**; shipping via **Quickshipper**.

The store runs fully end-to-end out of the box in **sandbox mode** — no bank credentials
required. Drop real credentials into `.env` and flip `PAYMENTS_MODE=live` to go live.

## Features

- 🏷️ **Catalog** — 10 products (rings, earrings, crosses) seeded from the ASERTI PDF, in GEL (₾).
- 🌐 **i18n** — Georgian, English, Russian with a language switcher and locale-prefixed routes (`/ka`, `/en`, `/ru`).
- 🖼️ **Photography** — real product photos from `/public/products` with a thumbnail gallery, falling back to category vector art (see [public/products/README.md](public/products/README.md)).
- 🛒 **Cart & checkout** — client cart (localStorage) + server-side order creation with price re-validation.
- 💳 **Payments** — TBC (TPay) and BOG e-commerce gateways behind a common interface, with a sandbox fallback.
- 📦 **Shipping** — Quickshipper shipment created automatically when an order is paid; tracking code stored on the order.
- ✉️ **Email** — trilingual order-confirmation emails via SMTP (logged to console when SMTP isn't configured).
- 🔐 **Admin** — password-protected order dashboard at `/{locale}/admin` with a signed session cookie.

## Quick start

```bash
npm install
cp .env.example .env      # a working sandbox .env is already included
npm run setup             # prisma generate + db push + seed catalog
npm run dev               # http://localhost:3000  (redirects to /ka)
```

`npm run setup` is a shortcut for `prisma generate && prisma db push && npm run db:seed`.

## Testing the purchase flow (sandbox)

1. Add items to the cart and go to **Checkout**.
2. Fill contact/shipping details, choose TBC or BOG, and pay.
3. You're sent to a **mock payment page** — click *Payment received* or *Payment failed*.
4. On success the order is marked **paid** and a Quickshipper tracking code is generated.
5. A trilingual confirmation email is generated (logged to the dev console — no SMTP needed).
6. View all orders at `/{locale}/admin` — sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env` (defaults: `admin` / `aserti-admin-dev`).

## Deployment

Production runs on **Postgres** (SQLite is dev-only). Full instructions —
switching the datasource, migrations, Vercel/VPS steps, and a go-live checklist —
are in **[DEPLOYMENT.md](DEPLOYMENT.md)**, with a production env template in
[.env.production.example](.env.production.example).

## Going live (payments)

Edit `.env`:

```env
PAYMENTS_MODE="live"

TBC_CLIENT_ID=...     TBC_CLIENT_SECRET=...   TBC_APIKEY=...   TBC_MERCHANT_ID=...
BOG_CLIENT_ID=...     BOG_CLIENT_SECRET=...

QUICKSHIPPER_API_KEY=...   QUICKSHIPPER_SECRET=...
QUICKSHIPPER_SENDER_PHONE=...   QUICKSHIPPER_SENDER_ADDRESS=...

NEXT_PUBLIC_BASE_URL="https://your-domain.ge"   # used for payment callback/return URLs
ADMIN_USERNAME="admin"   ADMIN_PASSWORD="a-strong-password"   ADMIN_SESSION_SECRET="<random hex>"

# Email (order confirmations)
SMTP_HOST=...   SMTP_PORT=587   SMTP_USER=...   SMTP_PASS=...
SMTP_FROM="ASERTI STORE <orders@your-domain.ge>"
```

If `PAYMENTS_MODE=live` but a provider's credentials are missing, that provider safely
falls back to sandbox (logged as a warning) so checkout never hard-fails.

> **Verify endpoints before launch.** The exact TBC / BOG / Quickshipper API paths and
> payload shapes are centralised in `src/lib/payments/*` and `src/lib/shipping/quickshipper.ts`
> with comments. Confirm them against your merchant onboarding docs, then test against each
> provider's sandbox environment.

### Payment flow (live)

1. `POST /api/checkout` creates a pending order and asks the gateway for a redirect URL.
2. Customer pays on the bank's hosted page and is returned to `/{locale}/order/{reference}`.
3. The bank calls `POST /api/payments/{tbc|bog}/callback?ref=...`; we re-query the provider
   for the authoritative status, mark the order paid, and create the Quickshipper shipment.
4. The order page also re-checks status on load, so it's correct even if the webhook is delayed.

## Project layout

```
prisma/
  schema.prisma            # Product, Order, OrderItem
  seed.ts                  # seeds catalog from src/data/catalog.ts
src/
  data/catalog.ts          # canonical product data (ka/en/ru)
  i18n/                    # locale config + dictionaries (ka, en, ru)
  lib/
    products.ts            # localized product queries
    orders.ts             # order creation, paid→shipment→email, references
    money.ts              # GEL formatting + shipping rules
    auth.ts               # admin session cookie (HMAC-signed)
    email.ts              # nodemailer transport (SMTP or dev console)
    emails/templates.ts   # trilingual order-confirmation email
    payments/             # tbc.ts, bog.ts, sandbox.ts, index.ts (gateway selector)
    shipping/quickshipper.ts
  components/              # Header, Footer, Cart, Checkout, ProductCard, ProductGallery, …
  app/
    [locale]/             # home, shop, product, cart, checkout, order, about, admin(+login), sandbox
    api/                  # checkout, payments callback, sandbox complete
```

## Notes

- **Placeholder art:** products ship with elegant vector placeholders (per category). To use
  real photos, add images to `/public` and reference them from `Product.images`.
- **Database:** SQLite for development. For production, set `provider = "postgresql"` in
  `prisma/schema.prisma` and point `DATABASE_URL` at Postgres, then `prisma db push`.
- **Prices** are always recomputed on the server from the database at checkout — the client
  cart is never trusted for pricing.
