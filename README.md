# ASERTI STORE

A trilingual (ქართული / English / Русский) sterling-silver jewelry store built with
Next.js 14 App Router, TypeScript, Tailwind CSS and Prisma. The catalog contains
10 products, priced in Georgian Lari (GEL).

## Features

- Georgian, English and Russian storefronts at `/ka`, `/en` and `/ru`.
- Product galleries, category browsing, sorting and filtering.
- Persistent cart and checkout with server-side price validation.
- Flitt and Bank of Georgia hosted payments, plus an in-app payment simulator.
- Quickshipper integration, confirmation emails and shipping emails.
- Password-protected order administration at `/{locale}/admin`.
- Order lookup at `/{locale}/track`, localized metadata and a sitemap.

## Local setup

Use Node.js 20.9 or newer. Sharp handles production image optimization.

```bash
npm ci
cp .env.example .env
```

Set `DATABASE_URL` in `.env` to a **development Neon Postgres database**. The schema
already uses Postgres, and the application runtime uses Neon's WebSocket/HTTP
adapter. A plain local Postgres server is not supported by that adapter without
additional configuration. No database credentials or working `.env` are included.

Set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` to enable admin login. Generate a
session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Initialize your development database and start the application:

```bash
npm run db:deploy
npm run db:seed
npm run dev
```

Open `http://localhost:3000` (redirects to `/ka`). `npm run setup` remains a shortcut
for Prisma generation, `db push` and seeding on a disposable development database.
Use the checked-in migrations via `db:deploy` for deployed databases. Seeding
updates existing catalog records, so run it intentionally.

## Testing a purchase locally

Set `PAYMENTS_MODE=sandbox` explicitly. Sandbox orders never call the courier or
send customer emails, even when credentials exist. Missing live credentials disable
checkout rather than falling back to a simulated payment.

1. Add a product, complete checkout and choose Flitt or BOG.
2. In explicit sandbox mode, the application opens its mock payment page.
3. Simulate failure: the basket remains available through the retry link.
4. Retry and simulate success: the confirmed order page removes the purchased
   quantities from the basket, preserving additional quantities and other items.
5. Reload the order page: it must not remove any items again.
6. Inspect the order in `/{locale}/admin`. Sandbox orders have no shipment or email jobs.

Cart recovery requires browser storage. Cart prices are display snapshots; the
server always calculates the actual order total from the database.

## Verification

```bash
npm test             # cart recovery, storage validation and quantity regressions
npm run typecheck
npm run build
```

These checks do not require database credentials. Testing catalog pages, order
creation and fulfillment end to end requires a configured development database.
The inherited `npm run lint` command still requires an ESLint configuration.

## Deployment and remaining work

See [DEPLOYMENT.md](DEPLOYMENT.md) and [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md).
The build generates Prisma Client and builds Next.js. Vercel production builds also
apply checked-in migrations; builds never seed products. See
[docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) for activation and recovery.

See [PROJECT_REVIEW.md](PROJECT_REVIEW.md) for the initial code review, outstanding
payment/fulfillment issues and dependency audit findings.

## Project layout

- `prisma/`: Postgres schema, migrations and catalog seeder.
- `src/data/catalog.ts`: canonical product descriptions and prices.
- `src/i18n/`: locale configuration and dictionaries.
- `src/lib/cart.ts`: saved-cart validation and checkout reconciliation.
- `src/lib/orders.ts`: order creation, payment and shipping transitions.
- `src/lib/payments/`: Flitt, BOG and mock gateway implementations.
- `src/lib/shipping/quickshipper.ts`: courier integration.
- `src/components/`: storefront and checkout components.
- `src/app/[locale]/`: storefront, checkout, tracking and administration pages.
- `src/app/api/`: checkout and payment endpoints.
- `test/`: automated regression tests.

## Exhibition redesign

The storefront now presents ASERTI as a world of objects, with Studio, 101,
material studies and a separate object index. See [the art-direction and content
guide](docs/ART_DIRECTION.md) for extension points, generated-asset provenance,
contact configuration and the database-free local preview command.
