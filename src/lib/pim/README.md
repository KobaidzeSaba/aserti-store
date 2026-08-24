# Product Master (PIM) + multi-channel publishing

One canonical record per physical product. Price and stock sync from **Fina**
(the single source of truth for those two fields). Ready-to-upload catalogue
exports for four channels: **Online Store**, **Wolt**, **Glovo**, **Chatbot**.

The design rule throughout: **every automated decision is visible and
reversible, and `productId` is the only join key.** An external barcode is never
a global primary key.

## Layout

```
src/lib/pim/
  types.ts          Domain types (DB-free). The contract everything shares.
  codes.ts          CodeIndex — resolves (scheme, code) → productId. Never a bare code.
  schemes.ts        Scheme detection. Declared, not guessed.
  matching.ts       Fuzzy name matching — PROPOSE ONLY. Demotes 107-vs-180 / pink-vs-blue.
  stock.ts          Per-location stock + computed total; per-channel location selection.
  categories.ts     Controlled vocabulary + per-channel map. Fails loud, never invents.
  validation via    channels/*.ts (each channel's rules) run before any file is written.
  export.ts         Orchestrator: validate → build → report. Never silently drops a row.
  fina.ts           Resolve rows within a scheme, diff before commit, unmatched → review.
  fina-xlsx.ts      The ONLY Excel-aware file. Swap for an API connector later, untouched core.
  reviewQueue.ts    One list of every unresolved thing, sorted by blocked revenue.
  imageIntake.ts    Bind photo → productId at upload time. Unbound never enters the library.
  repository.ts     The ONLY Prisma bridge. Maps pim_* rows ↔ domain; runs import/export.
  channels/         ChannelAdapter interface + online store / wolt / glovo / chatbot.
  __fixtures__/     Synthetic data reproducing all eight real failures.
```

Persistence: `pim_*` tables in `prisma/schema.prisma` (migration
`prisma/migrations/1_pim_product_master`). Admin UI: `/[locale]/admin/pim` and
`/[locale]/admin/pim/fina`.

## The eight failures → acceptance tests

Every failure from the brief is an executable test in `test/failures.test.ts`,
run with **`npm run test:pim`** (no database needed — the core is pure functions
over the fixtures).

| # | Failure | Defence | Test |
|---|---------|---------|------|
| 1 | Same barcode → two products | `CodeIndex` keys on `(scheme, code)`; no cross-scheme resolve exists | Failure 1 |
| 2 | Fuzzy name mis-binding | `proposeMatches` proposes only; caps discriminator conflicts below confidence | Failure 2 |
| 3 | Photos with no product link | `bindPhoto` refuses a library image without `productId` + confirmer | Failure 3 |
| 4 | Conflicting prices | Price/stock come only from Fina rows; conflicts surfaced, no product.price field | Failure 4 |
| 5 | Sellable but no barcode | `draft` status held back from export; shown in needs-barcode queue | Failure 5 |
| 6 | Category taxonomy drift | `CategoryResolver.resolve` throws on missing map, never invents | Failure 6 |
| 7 | Export the target rejects | Validation runs first; `isActive` requires a price; report explains every skip | Failure 7 |
| 8 | Stock split across locations | `summarizeStock` keeps per-location breakdown + total; channel selects locations | Failure 8 |

Plus two Fina-import path tests (real `.xlsx` parse → scheme-scoped resolve;
unknown code → review, never guessed).

## Running

```bash
npm run test:pim        # the eight failures, no DB
npm run db:push         # create pim_* tables (or: npm run db:deploy to replay migrations)
npm run db:seed:pim     # load the deliberately-broken fixture catalogue
npm run dev             # visit /en/admin/pim  (admin login required)
```

## Fina import flow

Fina is **Excel-export-only** (confirmed), so sync is file-driven:
upload the workbook → **preview the diff** (new / changed / disappeared /
unmatched) → **commit**. Nothing writes until you commit. Unmatched rows go to
review; they are never guessed into a product. `fina-xlsx.ts` is the only
Excel-aware module, so an API connector can replace it without touching the
resolve/diff logic.

## Still open (asked, not assumed)

- **Chatbot consuming format (Q5)** — `channels/chatbot.ts` emits retrieval-
  friendly JSONL as a safe default. Tell me the consumer (vector store schema /
  specific JSON / CSV) and only `build()`/`serialize()` there change.
- **Glovo format (Q6)** — `channels/glovo.ts` is a working stub behind the
  shared interface; fill in `build()`/`serialize()` when the format is confirmed.
- **Wolt / Glovo upload** — treated as manual file upload (generated files) for
  now.
- **AI image generation** — Cloudinary is connected and can generate; the
  `isAiGenerated` flag and human-confirm gate are in place. Generation itself is
  not wired yet — say the word and it plugs into image intake.
