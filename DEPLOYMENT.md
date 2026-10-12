# Deploying ASERTI STORE

The checked-in Prisma schema already uses Postgres. The application connects using
Neon's serverless adapter; configure a Neon database for the current runtime.
See [PROJECT_REVIEW.md](PROJECT_REVIEW.md) for issues to resolve before live sales.

## Database

Set `DATABASE_URL` to your intended Neon database connection string. `DIRECT_URL`
is listed in the templates but is not referenced by the current Prisma schema.
If your migration environment requires a direct connection, supply that connection
as `DATABASE_URL` for the migration command.

```bash
npm ci
npm run db:deploy
npm run db:seed
```

The migrations are already checked in. Run the seed once for a new store; rerunning
it overwrites the seeded products' catalog fields. Do not generate a new initial
migration or change the schema provider.

## Environment

- `NEXT_PUBLIC_BASE_URL`: your final HTTPS URL.
- `DATABASE_URL`: Neon Postgres connection string.
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`: administrator access.
- `FLITT_MERCHANT_ID` / `FLITT_SECRET_KEY` and/or `BOG_CLIENT_ID` /
  `BOG_CLIENT_SECRET`: provider credentials.
- `QUICKSHIPPER_API_KEY` and pickup/account settings: courier integration.
- `SMTP_*`: confirmation and shipping emails.

The current implementation selects real integrations when credentials exist.
`PAYMENTS_MODE` is not enforced, and missing payment credentials enable the mock
checkout. Leave payment, shipping and SMTP credentials empty for a local simulation.

## Vercel

1. Import the GitHub repository as a Next.js project.
2. Configure environment variables for the intended deployment environment.
3. Run migrations and initial seeding explicitly against its database.
4. Use `npm run build` as the build command. It generates Prisma Client and builds
   Next.js; it does not migrate or seed.
5. Verify the storefront and a complete simulated purchase before configuring
   provider credentials.

Callback routes are `/api/payments/flitt/callback` and
`/api/payments/bog/callback`. The application supplies the order reference in each
payment request's callback URL. Follow the merchant onboarding requirements when
registering callbacks and test both server notifications and customer return URLs.

## Node host

```bash
npm ci
npm run db:deploy
npm run db:seed       # initial catalog only
npm run build
npm run start
```

Use your host's TLS termination and set `NEXT_PUBLIC_BASE_URL` to the final domain.

## Verification

Run `npm test`, `npm run typecheck` and `npm run build`. With the development database
configured, test failed payment → retry, successful payment → cart reconciliation,
admin order access, shipping and email delivery. Resolve the payment, fulfillment
and dependency findings in the project review before accepting live orders.
