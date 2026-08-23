# Deploying ASERTI STORE

The app runs on SQLite locally and **Postgres** in production. This guide covers
switching the database, running migrations, and deploying to Vercel or a VPS.

---

## 1. Switch the database to Postgres

Prisma requires the provider to be set in the schema (it cannot be an env var).

In [`prisma/schema.prisma`](prisma/schema.prisma), change the `datasource` block to:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")   // used for migrations behind a pooler
}
```

Then set the connection strings in your environment (see
[.env.production.example](.env.production.example)):

```env
DATABASE_URL="postgresql://user:pass@host:5432/aserti?schema=public&sslmode=require"
DIRECT_URL="postgresql://user:pass@host:5432/aserti?schema=public&sslmode=require"
```

> If your provider (Supabase, Neon, RDS…) gives a **pooled** and a **direct** URL,
> put the pooled one in `DATABASE_URL` and the direct one in `DIRECT_URL`.
> If there's only one URL, use it for both.

## 2. Create the schema & seed

For a first deploy you can push the schema directly:

```bash
npm run db:push        # creates tables from schema
npm run db:seed        # loads the 10-product catalog
```

For a repeatable, versioned workflow, use migrations instead:

```bash
# once, locally, after switching to postgres:
npx prisma migrate dev --name init      # generates prisma/migrations/*
# on the server / CI:
npm run db:deploy                        # prisma migrate deploy
npm run db:seed
```

Commit the generated `prisma/migrations/` folder so `db:deploy` can replay it.

## 3. Required environment variables

Copy every key from [.env.production.example](.env.production.example) into your host.
At minimum for a live store:

- `NEXT_PUBLIC_BASE_URL` — your public https URL (used to build payment callback/return URLs).
- `DATABASE_URL` (+ `DIRECT_URL`).
- `PAYMENTS_MODE=live` and the TBC / BOG / Quickshipper credentials.
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.
- `SMTP_*` for order emails.

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Deploy

### Vercel

1. Import the repo. Framework preset: **Next.js**.
2. Add all env vars in **Project → Settings → Environment Variables**.
3. Build command: `npm run build` (runs `prisma generate` first). Output is handled by Vercel.
4. Run migrations against your DB (from your machine or a CI step): `npm run db:deploy && npm run db:seed`.
5. In your TBC / BOG / Quickshipper dashboards, register the callback URLs:
   - `https://your-domain.ge/api/payments/tbc/callback`
   - `https://your-domain.ge/api/payments/bog/callback`

> **Note:** Vercel's serverless filesystem is read-only and ephemeral — SQLite will
> not work there. Postgres is required. Product photos in `/public` are fine (they're
> part of the build).

### VPS / Docker (Node host)

```bash
npm ci
npm run build
npm run db:deploy && npm run db:seed   # first deploy only for seed
npm run start                          # serves on PORT (default 3000)
```

Put Nginx/Caddy in front for TLS, and set `NEXT_PUBLIC_BASE_URL` to the https domain.

## 5. Go-live checklist

- [ ] `provider = "postgresql"` and DB reachable.
- [ ] `PAYMENTS_MODE=live` with real TBC/BOG/Quickshipper credentials.
- [ ] Verified TBC/BOG/Quickshipper endpoint paths against merchant docs (`src/lib/payments/*`, `src/lib/shipping/quickshipper.ts`).
- [ ] Callback URLs registered in each provider dashboard.
- [ ] Tested a real low-value payment end-to-end.
- [ ] `ADMIN_PASSWORD` + `ADMIN_SESSION_SECRET` set to strong secrets.
- [ ] SMTP verified (a test order email arrives).
- [ ] `NEXT_PUBLIC_BASE_URL` is the final https domain.
