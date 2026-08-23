# Deploy ASERTI STORE to Vercel — step by step

This gets a **live, testable** store online in ~15 minutes. It runs in **sandbox
payment mode** (no real charges), which is what you want for testing.

You'll do the parts that need *your* login (creating the DB, Vercel account). The
project is already fully prepared: Postgres schema, an initial migration, and a
build that auto-migrates + seeds the catalog on every deploy.

---

## What you need
- A **GitHub** account (free) — to hold the code.
- A **Vercel** account (free) — sign in with GitHub.
- A **Postgres** database (free) — we'll use **Neon**.

---

## Step 1 — Create a free Postgres database (Neon)

1. Go to **https://neon.tech** and sign up (GitHub login is easiest).
2. Create a project (any name, e.g. `aserti`). Region: pick **EU** (closest to Georgia).
3. On the project dashboard, open **Connect** / **Connection string**.
4. Copy **two** connection strings:
   - The **pooled** string (has `-pooler` in the host) → this is your `DATABASE_URL`.
   - The **direct** string (no `-pooler`) → this is your `DIRECT_URL`.
   - If you only see one, use it for **both**.
   Each looks like:
   `postgresql://user:pass@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`

Keep these two strings handy for Step 3.

---

## Step 2 — Put the code on GitHub

The repo is already committed locally. In a terminal in this folder
(`C:\Users\user\Documents\ASERTI`):

1. Create an **empty** repo on GitHub (no README) at https://github.com/new — name it `aserti-store`.
2. Then run (replace `YOUR-USERNAME`):

```bash
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/aserti-store.git
git push -u origin main
```

(If git asks you to sign in, use your GitHub login / a Personal Access Token.)

---

## Step 3 — Deploy on Vercel

1. Go to **https://vercel.com/new** and sign in with GitHub.
2. **Import** the `aserti-store` repo. Framework preset auto-detects **Next.js** — leave defaults.
3. Before clicking Deploy, expand **Environment Variables** and add these:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | *(Neon pooled string from Step 1)* |
   | `DIRECT_URL` | *(Neon direct string from Step 1)* |
   | `PAYMENTS_MODE` | `sandbox` |
   | `ADMIN_USERNAME` | `admin` |
   | `ADMIN_PASSWORD` | *(pick a strong password)* |
   | `ADMIN_SESSION_SECRET` | *(paste a long random string — see below)* |

   Generate a session secret by running this locally and copying the output:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   > You do **not** need `NEXT_PUBLIC_BASE_URL` — the app auto-detects the Vercel URL.
   > Payment/shipping/SMTP keys can stay empty; in sandbox mode they aren't used,
   > and order emails are written to the Vercel function logs instead of being sent.

4. Click **Deploy**. The build runs `prisma migrate deploy` (creates tables),
   seeds the 10 products, then builds the site. First build takes a couple of minutes.

---

## Step 4 — Test it

When the deploy finishes, Vercel gives you a URL like
`https://aserti-store-xxxx.vercel.app`.

- **Storefront:** open the URL — it redirects to `/ka`. Switch languages (ka / en / ru) top-right.
- **Buy something:** add an item → **Cart** → **Checkout** → fill details → choose TBC or BOG → **Pay**.
  You'll land on the **sandbox payment page** — click *Payment received*. The order is
  marked paid and gets a Quickshipper tracking code.
- **Admin:** go to `/en/admin`, sign in with the `ADMIN_USERNAME` / `ADMIN_PASSWORD`
  you set. You'll see the order, revenue, and tracking code.

That's a fully working store you can share and click through.

---

## Later: switch on real payments & email

When you have TBC / BOG / Quickshipper merchant credentials and want real charges:

1. In Vercel → **Settings → Environment Variables**, set `PAYMENTS_MODE=live` and add:
   `TBC_CLIENT_ID`, `TBC_CLIENT_SECRET`, `TBC_APIKEY`, `TBC_MERCHANT_ID`,
   `BOG_CLIENT_ID`, `BOG_CLIENT_SECRET`,
   `QUICKSHIPPER_API_KEY`, `QUICKSHIPPER_SECRET` (+ sender fields),
   and SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
2. Set `NEXT_PUBLIC_BASE_URL` to your final domain.
3. In each bank's dashboard, register the callback URLs:
   - `https://YOUR-DOMAIN/api/payments/tbc/callback`
   - `https://YOUR-DOMAIN/api/payments/bog/callback`
4. **Redeploy** (Vercel → Deployments → ⋯ → Redeploy).
5. Verify the exact TBC/BOG/Quickshipper endpoints against your merchant docs first
   (they're in `src/lib/payments/*` and `src/lib/shipping/quickshipper.ts`), and test a
   small real payment.

---

## Alternative: deploy without GitHub (Vercel CLI)

If you'd rather not use GitHub:

```bash
npm i -g vercel
vercel login          # opens the browser to authenticate you
vercel                # first run: answer the prompts, links a new project
# add env vars (repeat for each, or use the dashboard):
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add ADMIN_PASSWORD
vercel env add ADMIN_SESSION_SECRET
vercel --prod         # production deploy
```

---

## Troubleshooting

- **Build fails at `prisma migrate deploy`** → `DATABASE_URL` / `DIRECT_URL` are wrong or the
  DB isn't reachable. Re-copy them from Neon (include `?sslmode=require`).
- **Store shows no products** → the seed step didn't run; check the build log. Re-deploying
  re-runs it (it's safe/idempotent).
- **Admin won't log in** → confirm `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` are set in Vercel,
  then redeploy.
- **Order email** → in sandbox/no-SMTP, it's logged under Vercel → your deployment → **Logs**,
  not emailed.
