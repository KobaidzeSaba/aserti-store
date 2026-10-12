# Deploy ASERTI STORE to Vercel

1. Create a development Neon Postgres database and copy its connection string.
2. Import `KobaidzeSaba/aserti-store` into Vercel using the Next.js preset.
3. Set `DATABASE_URL`, `ADMIN_USERNAME`, a strong `ADMIN_PASSWORD`, and a random
   `ADMIN_SESSION_SECRET` for the intended Vercel environment.
4. In a trusted local or CI environment configured for that database, run:

   ```bash
   npm ci
   npm run db:deploy
   npm run db:seed
   ```

5. Deploy with `npm run build`. The build does not run migrations or seed products.
6. Set `NEXT_PUBLIC_BASE_URL` to the deployment's intended public URL before testing
   payment redirects (Vercel's hostname is used as a fallback).
7. Test the storefront, failed-payment retry, successful-payment cart reconciliation
   and admin dashboard. Leave all payment, courier and SMTP credentials empty for
   the in-app simulation. Simulated tracking codes are not real courier shipments.

The current application chooses integrations by credentials, not `PAYMENTS_MODE`.
Adding Flitt or BOG credentials enables that provider even if the environment says
`sandbox`; adding courier or SMTP credentials enables those integrations too.

See [DEPLOYMENT.md](DEPLOYMENT.md) for configuration details and
[PROJECT_REVIEW.md](PROJECT_REVIEW.md) for the payment/fulfillment and dependency
issues that need resolution before live sales.

## Troubleshooting

- Database connection failure: verify the database and connection string for the
  environment. The application uses Neon's WebSocket/HTTP adapter.
- Missing tables: run `npm run db:deploy` against the correct database.
- Empty catalog: run the seed intentionally; it updates existing seeded records.
- Admin login failure: verify `ADMIN_PASSWORD` and the signing secret, then redeploy.
- No email received: without `SMTP_HOST`, emails are logged on the server.

## Current redesign deployment

Deployed the local redesign to the existing `keri2/aserti-store` production project
on 2026-09-25 with Vercel CLI. Production URL: https://aserti-store.vercel.app.
Deployment ID: `dpl_GQR8bw9HNxphr5og188Lg86JNUih`.

Existing production environment variables were preserved; catalog preview mode was
not enabled. The cloud build passed. Live checks returned HTTP 200 for all three
homepage locales, Studio, 101, Contact, shop, Cliff product, checkout, and both new
image assets. The browser confirmed all 10 database products in the catalog.
No payment or shipment was initiated. This was a direct local deployment; the
redesign has not been committed or pushed to GitHub.

## Custom domain (verified 2026-10-12)

Production is available at https://aserti.ge, redirecting to
https://www.aserti.ge. Both domains are attached to `keri2/aserti-store` and
Vercel reports valid, verified DNS. Production `NEXT_PUBLIC_BASE_URL` is set to
`https://www.aserti.ge`.

Existing working DNS records:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 216.198.79.1 |
| CNAME | www | 734fa1d267f0a9ff.vercel-dns-017.com. |

Vercel additionally recommends a second apex A record, `64.29.17.1`, but accepts
the current configuration. Keep the existing AWS nameservers and unrelated email
records. No registrar changes are required for the current site to work.
