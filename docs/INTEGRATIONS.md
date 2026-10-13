# Integration setup and operations

Updated 2026-10-13. Production: https://www.aserti.ge.

## Production readiness

The protected production health check confirmed the database and job table work.
No usable Flitt, BOG, Quickshipper, pickup, SMTP, Google Maps, contact email or
Instagram configuration was present. Payment mode is disabled. Saved variable
names are not evidence of usable values. These services cannot be activated
without merchant credentials and account onboarding.

Set values in the existing project's Vercel **Production** environment, then
redeploy. Do not commit secrets or paste them into source files.

| Integration | Required configuration |
| --- | --- |
| Flitt | `PAYMENTS_MODE=live`, `FLITT_MERCHANT_ID`, `FLITT_SECRET_KEY`; use the merchant's actual live credentials, not the public test merchant |
| BOG | `PAYMENTS_MODE=live`, `BOG_CLIENT_ID`, `BOG_CLIENT_SECRET`; `BOG_CALLBACK_PUBLIC_KEY` optionally overrides the bank's published default |
| Quickshipper | `SHIPPING_MODE=live`, production `QUICKSHIPPER_API_BASE`, OAuth `QUICKSHIPPER_CLIENT_ID` + `QUICKSHIPPER_CLIENT_SECRET` or an account-issued `QUICKSHIPPER_API_KEY`; required pickup phone/address/latitude/longitude; merchant provider/speed/parcel IDs as required by the account |
| Email | `EMAIL_MODE=live`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, verified `SMTP_FROM`; optional `STORE_NOTIFICATION_EMAIL` |
| Google Places | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, billing/API activation and HTTP referrer restrictions for `https://aserti.ge/*` and `https://www.aserti.ge/*` |
| Public channels | verified `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_INSTAGRAM_URL` |

Older `TBC_*` variables are not consumed by Flitt. TBC's separate gateway requires
a separate adapter; do not copy TBC credentials into Flitt settings.
Email SPF/DKIM records must come from the selected mail provider; they cannot be
inferred from the website's Vercel DNS records. Address entry remains available
without a Google key through the existing Georgia-only fallback/manual form.

## Payment and delivery behavior

- Explicit sandbox mode simulates payment only. It never dispatches a courier or
  sends a customer email, regardless of configured credentials.
- Live mode requires the selected provider's credentials. Disabled/unavailable
  providers cannot be submitted and the API returns 503 without creating an order.
- Payment callbacks verify signatures, bind to the stored provider, and query the
  provider's authoritative receipt. Identity, amount and currency must match.
- Callback URLs use `https://www.aserti.ge/api/payments/flitt/callback?ref=...`
  and the corresponding `/bog/callback?ref=...`; only POST callbacks are accepted.
- Payment settlement and unique shipment/confirmation jobs are committed in one
  database transaction. Duplicate callbacks cannot duplicate courier requests.
- A courier error never generates fake tracking or reverses a successful payment.
  The API's `pickUpInfo`, `dropOffInfo`, `provider`, and `integrationOrderId` fields
  are sent; cart weight is converted from catalog grams to kilograms.
- Email and shipment work is processed synchronously after settlement and is also
  recoverable in the admin dashboard. There is no scheduled background worker.

## Recovery

The authenticated admin page lists configuration status and outstanding jobs.
`blocked` means missing/disabled settings. Configure them and click Retry.
`review` means the operation may already have succeeded. Check the courier/email
provider first; retry only after confirming it did not succeed. A `processing`
job older than ten minutes may be recovered the same way. Never blindly retry an
uncertain courier operation: an external HTTP request cannot be rolled back.
If the courier already accepted a shipment but persistence failed, reconcile its
real tracking information in the database before treating the job as complete.

Existing historical orders are not automatically backfilled with dispatch jobs.
Refunds, cancellations and delivery status webhooks are not implemented; manage
those in the provider dashboards. “Mark shipped” requires an actual shipment ID.

## Verification

`npm test` covers gateway selection, receipt/signature checks, courier request
shape/errors and cart behavior. `test/database.integration.ts` runs against a
disposable local PostgreSQL database named `aserti_test` and refuses remote DBs.
It verifies concurrent settlement, failure races, sandbox isolation and exactly
one courier call under duplicate callbacks. No real transaction, shipment or email
is created by these tests.

The private `/api/integrations/status` endpoint requires
`Authorization: Bearer <INTEGRATIONS_HEALTH_SECRET>` and returns configuration
booleans and database status only. A configured key is not proof of provider
activation. Real account authentication and a merchant-approved test transaction
remain required once credentials are supplied.

References: [Flitt signatures](https://docs.flitt.com/api/building-signature/),
[Flitt order status](https://docs.flitt.com/api/order-status/),
[BOG receipt](https://api.bog.ge/docs/en/payments/standard-process/get-payment-details),
[BOG callback](https://api.bog.ge/docs/en/payments/standard-process/callback),
[Quickshipper OpenAPI](https://delivery.quickshipper.app/swagger/v1/swagger.json).
