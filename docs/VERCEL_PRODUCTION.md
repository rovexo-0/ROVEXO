# ROVEXO — Vercel Production Environment Configuration

Complete environment variable audit for deploying ROVEXO to **Vercel → Production**.

No application logic changes are required. Configure variables in:

**Vercel Dashboard → Project → Settings → Environment Variables → Production**

Run local verification after copying values:

```bash
npm run verify:env
```

---

## 1. Variables you MUST add to Vercel Production

Set exactly these **12 canonical names**. Do not also set their aliases (see §3).

| # | Variable | Example value | Used by |
|---|----------|---------------|---------|
| 1 | `NEXT_PUBLIC_APP_URL` | `https://www.rovexo.co.uk` | Stripe return URLs, sitemap, `metadataBase`, robots |
| 2 | `NEXT_PUBLIC_SUPABASE_URL` | `https://pklotmwxtnnepaitedic.supabase.co` | Browser auth + server Supabase clients |
| 3 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_…` | Browser auth (`lib/supabase/client.ts`) |
| 4 | `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_…` | Server admin client only (`lib/supabase/admin.ts`) |
| 5 | `STRIPE_SECRET_KEY` | `sk_live_…` | Checkout, Connect, payouts, webhooks |
| 6 | `STRIPE_WEBHOOK_SECRET` | `whsec_…` | `/api/webhooks/stripe` signature verification |
| 7 | `RESEND_API_KEY` | `re_…` | Transactional email |
| 8 | `EMAIL_FROM` | `ROVEXO <support@rovexo.co.uk>` | Resend sender (must be verified in Resend) |
| 9 | `UPSTASH_REDIS_REST_URL` | `https://….upstash.io` | Production API rate limiting |
| 10 | `UPSTASH_REDIS_REST_TOKEN` | `<token>` | Production API rate limiting |
| 11 | `CRON_SECRET` | `<openssl rand -hex 32>` | `/api/cron/maintenance`, `/api/cron/orders/cleanup` |
| 12 | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-RNEMD5BT0S` | Google Analytics 4 |

### Vercel UI settings per variable

| Variable | Environments | Sensitive |
|----------|--------------|-----------|
| `NEXT_PUBLIC_*` (4 vars) | Production (+ Preview if you test previews) | No |
| All other 8 vars | **Production only** | Yes (check “Sensitive”) |

`CRON_SECRET` must match what Vercel Cron sends as `Authorization: Bearer <CRON_SECRET>`.

---

## 2. Complete inventory (every variable referenced in code)

### 2a. Production-required (12) — set on Vercel

Listed in §1.

### 2b. Optional — set only if needed

| Variable | Prefix | Server-only | Notes |
|----------|--------|-------------|-------|
| `NEXT_PUBLIC_SITE_URL` | ✓ `NEXT_PUBLIC_` | No (bundled) | SEO on homepage; defaults to `https://www.rovexo.co.uk` |
| `OPENAI_API_KEY` | ✗ | ✓ | AI camera vision (`lib/ai-camera/config.ts`) |
| `OPENAI_VISION_MODEL` | ✗ | ✓ | Defaults to `gpt-4o-mini` |
| `AI_CAMERA_VISION_MOCK` | ✗ | ✓ | **Do not set `true` in production** |

### 2c. Aliases — do NOT set on Vercel (duplicates)

The code accepts these as fallbacks, but setting them **alongside** the canonical name duplicates configuration and can cause confusion.

| Alias (do not set) | Use instead |
|--------------------|-------------|
| `SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SUPABASE_SECRET_KEY` | `SUPABASE_SERVICE_ROLE_KEY` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

> **Important:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` must use the `NEXT_PUBLIC_` prefix so Next.js inlines it into the browser bundle. Setting only `SUPABASE_ANON_KEY` will break client-side auth.

### 2d. Not used in application code

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Not referenced. ROVEXO uses Stripe Hosted Checkout (server-side); no client Stripe.js |

### 2e. Platform-managed — do NOT set manually

| Variable | Set by |
|----------|--------|
| `NODE_ENV` | Vercel (`production` on deploy) |
| `VERCEL_URL` | Vercel (deployment hostname; fallback in `getAppUrl()`) |
| `npm_package_version` | npm at runtime |

### 2f. Local / CI / test only — never on Vercel Production

`CI`, `PLAYWRIGHT_PORT`, `PLAYWRIGHT_BASE_URL`, `PLAYWRIGHT_SKIP_WEBSERVER`, `PLAYWRIGHT_REUSE_SERVER`, `PLAYWRIGHT_DEV_SERVER`, `PLAYWRIGHT_E2E`, `E2E_TEST`, `NEXT_PUBLIC_GA_DEBUG`

---

## 3. Duplication verification

| Check | Result |
|-------|--------|
| Same Supabase URL under two names | **Avoid** — set `NEXT_PUBLIC_SUPABASE_URL` only |
| Same anon key under two names | **Avoid** — set `NEXT_PUBLIC_SUPABASE_ANON_KEY` only |
| Same service role under two names | **Avoid** — set `SUPABASE_SERVICE_ROLE_KEY` only |
| Stripe publishable + secret | N/A — publishable key not used |
| Canonical production set | **12 unique variables**, no overlaps |

`.env.example` documents aliases for local dev convenience; Vercel Production should use the canonical 12 only.

---

## 4. Secret vs public verification

### Server-side only (no `NEXT_PUBLIC_` prefix) ✓

These never ship in the client JavaScript bundle:

| Variable | Secret? |
|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Yes — full DB bypass |
| `STRIPE_SECRET_KEY` | Yes |
| `STRIPE_WEBHOOK_SECRET` | Yes |
| `RESEND_API_KEY` | Yes |
| `EMAIL_FROM` | No, but server-only |
| `UPSTASH_REDIS_REST_URL` | No, but server-only |
| `UPSTASH_REDIS_REST_TOKEN` | Yes |
| `CRON_SECRET` | Yes |
| `OPENAI_API_KEY` | Yes (optional) |
| `OPENAI_VISION_MODEL` | No, server-only |
| `AI_CAMERA_VISION_MOCK` | No, server-only |

`createAdminClient()` (`lib/supabase/admin.ts`) is only imported from server modules, API routes, and `"use server"` actions — service role key stays server-side.

### Public (`NEXT_PUBLIC_` prefix) ✓

| Variable | Safe to expose | Reason |
|----------|----------------|--------|
| `NEXT_PUBLIC_APP_URL` | Yes | Public site URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase API endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (RLS-protected by design) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Yes | GA4 measurement ID |
| `NEXT_PUBLIC_SITE_URL` | Yes | Optional SEO URL |
| `NEXT_PUBLIC_GA_DEBUG` | Yes | **Do not enable in production** |

### Prefix audit

| Finding | Status |
|---------|--------|
| Every browser-exposed var starts with `NEXT_PUBLIC_` | ✓ Pass |
| No secret uses `NEXT_PUBLIC_` prefix | ✓ Pass |
| `EMAIL_FROM` / Redis URL without `NEXT_PUBLIC_` | ✓ Correct (server-only) |

---

## 5. Vercel-specific configuration (non-env)

Already in repo — no changes needed:

| Item | Location |
|------|----------|
| Cron: maintenance | `vercel.json` → `/api/cron/maintenance` at `*/15 * * * *` |
| Cron: order cleanup | `vercel.json` → `/api/cron/orders/cleanup` at `*/15 * * * *` |
| Security headers | `vercel.json` + `next.config.ts` |
| Custom domain | Vercel → Domains → point DNS → set `NEXT_PUBLIC_APP_URL` |

### Stripe webhook (dashboard, not env file)

1. Endpoint: `https://www.rovexo.co.uk/api/stripe/webhook` (GET returns **405** when deployed — confirms route exists)
2. Legacy alias: `https://www.rovexo.co.uk/api/webhooks/stripe`
2. Events: `checkout.session.completed`, `account.updated`, `charge.refunded`, `transfer.reversed` (see `docs/PRODUCTION_DEPLOYMENT.md`)
3. Copy signing secret → `STRIPE_WEBHOOK_SECRET` in Vercel

---

## 6. Final production checklist

### Environment variables (Vercel → Production)

- [ ] `NEXT_PUBLIC_APP_URL` = `https://www.rovexo.co.uk` (HTTPS, no trailing path)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://pklotmwxtnnepaitedic.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase publishable key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = Supabase secret key (Sensitive)
- [ ] `STRIPE_SECRET_KEY` = `sk_live_…` (Sensitive)
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_…` (Sensitive)
- [ ] `RESEND_API_KEY` = `re_…` (Sensitive)
- [ ] `EMAIL_FROM` = verified sender
- [ ] `UPSTASH_REDIS_REST_URL` = Upstash REST URL
- [ ] `UPSTASH_REDIS_REST_TOKEN` = Upstash token (Sensitive)
- [ ] `CRON_SECRET` = random 32+ byte hex (Sensitive)
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` = `G-RNEMD5BT0S`
- [ ] **No alias duplicates** (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`)
- [ ] **No test keys** in Production (`sk_test_`, placeholder values)

### Vercel project

- [ ] Custom domain attached and SSL active
- [ ] Production branch = `main` (or your release branch)
- [ ] Cron jobs enabled (Pro plan required for `vercel.json` crons)
- [ ] `CRON_SECRET` matches cron `Authorization` header

### External services

- [ ] Supabase migrations applied on production project
- [ ] Stripe live mode + Connect Express enabled
- [ ] Stripe webhook endpoint live and tested
- [ ] Resend domain verified for `EMAIL_FROM`
- [ ] Upstash Redis database created (same region as Vercel if possible)

### Post-deploy smoke tests

```bash
curl https://www.rovexo.co.uk/api/health/live
curl -H "Authorization: Bearer $CRON_SECRET" https://www.rovexo.co.uk/api/cron/maintenance
```

- [ ] Checkout test with live Stripe (small amount, then refund)
- [ ] Seller Connect onboarding flow
- [ ] Email delivery (order confirmation)

### Local verification before deploy

```bash
npm run verify:env
npm run verify:production
```

---

## 7. Copy-paste block for Vercel

Add these keys in Vercel Production (values from your dashboards):

```
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
CRON_SECRET=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

See also: [PRODUCTION_ENVIRONMENT_CHECKLIST.md](./PRODUCTION_ENVIRONMENT_CHECKLIST.md) · [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
