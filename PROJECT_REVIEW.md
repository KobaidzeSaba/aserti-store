# Initial project review — 2026-09-21

## Baseline

Cloned `KobaidzeSaba/aserti-store`, starting from main at `1e9e4fe`.
The separate `claude/product-master-pim-sync-35xwof` branch contains an older,
unmerged PIM implementation. It has not been merged into this checkout.

The existing Next.js 14 production build passes. No database credentials were
provided, so catalog queries, order creation, bank callbacks and courier delivery
have not been exercised against a running database or external services.

## Implemented in this pass

- Keep the cart when leaving for payment, allowing failed/cancelled purchases to
  be retried.
- Persist the submitted basket with its order reference before redirecting.
- Reconcile the basket only on a server-confirmed paid/shipped order page.
  Remove purchased quantities once; preserve additional quantities and other sizes.
- Validate old saved carts and retain compatibility with the original array format.
- Apply the same 20-item per-line cap to cart mutations and checkout validation.
- Show an error and permit another attempt when sandbox completion fails.
- Add executable cart regression tests and a TypeScript check command.
- Correct the setup documentation to match the existing Neon/Postgres runtime.

## Priority follow-up work

1. **Payment mode and fulfillment isolation.** `src/lib/payments/index.ts` selects
   live gateways solely from credentials; `PAYMENTS_MODE` is ignored. Missing
   provider credentials silently enable mock payments. `markOrderPaid` invokes
   Quickshipper even for mock-paid orders if courier credentials are configured.
   Define and enforce explicit sandbox/live behavior across payments and shipping,
   fail closed for unavailable live providers, and test both configurations.
2. **Atomic fulfillment.** `markOrderPaid` reads the order, creates a shipment and
   then marks it paid. Concurrent callbacks/page loads can create duplicate
   shipments. Add a durable, atomic claim/outbox and retryable fulfillment steps;
   test concurrent success/failure callbacks. `markOrderFailed` also uses a
   read-then-write guard that can overwrite a concurrently successful payment.
3. **Truthful courier failures.** Quickshipper errors currently return fabricated
   tracking identifiers. Persist fulfillment failure separately from successful
   payment, expose an admin retry and only publish real tracking on success.
4. **Callback binding and retries.** The callback route does not verify that its
   provider matches the order's stored provider. It acknowledges provider errors
   with HTTP 200 without a reconciliation worker. Bind requests to the stored
   provider and make transient failures retryable.
5. **Dependency upgrades.** The initial `npm audit` reports 3 vulnerable packages:
   Next.js (critical), Nodemailer (high) and Next.js's nested PostCSS (high).
   Fixing the current advisory set requires upgrades beyond the installed major
   versions. Plan and validate a supported Next.js migration and email dependency
   upgrade; do not treat the passing build as production-readiness. The official
   [Next.js security update](https://nextjs.org/blog/security-update-2025-12-11)
   documents one earlier patch set; the current npm audit includes newer advisories.
6. **Checkout and catalog validation.** Validate sizes against each product,
   bound basket size, and reject inactive products on product detail routes.
   Add database-backed purchase tests, including duplicate callbacks and retries.
7. **Browser and developer experience.** Address autocomplete needs keyboard
   navigation and cancellation of stale requests. The inherited lint command has no ESLint dependency/configuration.
   Development CSP now permits the dev bundler while production remains restricted.

## Next verification milestone

Configure an isolated development Neon database, run the checked-in migrations,
seed the catalog, and exercise the failed-payment retry and successful-payment
flows in all three locales. Test real integrations with their provider test
credentials only after sandbox/live isolation is implemented.

## Integration follow-up — 2026-10-13

Items 1–4 above are addressed by explicit mode selection, transactional settlement,
unique durable jobs, truthful courier failures, signed/provider-bound callbacks,
and retryable status lookups. Checkout size and basket bounds are now validated.
See `docs/INTEGRATIONS.md` for remaining activation requirements and operational
limits. Framework dependency upgrades remain separate outstanding work; passing
integration tests does not resolve the previously reported Next.js advisories.
