# ROVEXO — Complete Production Deployment Guide

Step-by-step guide for deploying ROVEXO to **Vercel Production**. This document covers database setup, all 12 required environment variables, external service configuration, deployment, and verification.

**No code changes are required** — only dashboard configuration.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Where to paste variables in Vercel](#2-where-to-paste-variables-in-vercel)
3. [Environment variables — complete reference](#3-environment-variables--complete-reference)
4. [Missing variables (priority setup)](#4-missing-variables-priority-setup)
5. [Already-configured variables](#5-already-configured-variables)
6. [Database migrations](#6-database-migrations)
7. [Stripe configuration](#7-stripe-configuration)
8. [Deploy to Vercel](#8-deploy-to-vercel)
9. [Post-deploy verification](#9-post-deploy-verification)
10. [Final production checklist](#10-final-production-checklist)

---

## 1. Prerequisites

| Requirement | Details |
|-------------|---------|
| Vercel account | [vercel.com](https://vercel.com) — Pro plan recommended (required for `vercel.json` cron jobs) |
| Supabase project | Project ref: `pklotmwxtnnepaitedic` |
| Stripe account | Live mode enabled; Connect Express for seller payouts |
| Resend account | Domain verified for outbound email |
| Upstash account | Redis database for production rate limiting |
| Custom domain | e.g. `rovexo.com` pointed to Vercel |

---

## 2. Where to paste variables in Vercel

Every environment variable in this guide uses the same Vercel location:

| Step | Action |
|------|--------|
| 1 | Open [vercel.com/dashboard](https://vercel.com/dashboard) |
| 2 | Select your **team** |
| 3 | Select the **ROVEXO** project |
| 4 | Click **Settings** (top navigation) |
| 5 | Click **Environment Variables** (left sidebar) |
| 6 | Click **Add New** |
| 7 | Enter **Key** (exact variable name, case-sensitive) |
| 8 | Enter **Value** (no quotes unless the value itself contains spaces — see `EMAIL_FROM`) |
| 9 | Under **Environments**, check **Production** |
| 10 | For secrets, enable **Sensitive** (hides value after save) |
| 11 | Click **Save** |
| 12 | **Redeploy** after adding or changing variables (Deployments → ⋯ → Redeploy) |

Direct link pattern (replace `<team>` and `<project>`):

```
https://vercel.com/<team>/<project>/settings/environment-variables
```

> **Rule:** Use exactly one canonical name per value. Do not set alias duplicates (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`).

---

## 3. Environment variables — complete reference

ROVEXO requires **12 variables** in Vercel Production.

| # | Variable | Type | Sensitive in Vercel |
|---|----------|------|---------------------|
| 1 | `NEXT_PUBLIC_APP_URL` | Public | No |
| 2 | `NEXT_PUBLIC_SUPABASE_URL` | Public | No |
| 3 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | No |
| 4 | `SUPABASE_SERVICE_ROLE_KEY` | Secret | **Yes** |
| 5 | `STRIPE_SECRET_KEY` | Secret | **Yes** |
| 6 | `STRIPE_WEBHOOK_SECRET` | Secret | **Yes** |
| 7 | `RESEND_API_KEY` | Secret | **Yes** |
| 8 | `EMAIL_FROM` | Server-only | No (not public, but not marked Sensitive) |
| 9 | `UPSTASH_REDIS_REST_URL` | Server-only | No |
| 10 | `UPSTASH_REDIS_REST_TOKEN` | Secret | **Yes** |
| 11 | `CRON_SECRET` | Secret | **Yes** |
| 12 | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Public | No |

**Public** = prefixed `NEXT_PUBLIC_`, embedded in browser JavaScript (safe by design).  
**Secret** = server-only; never exposed to the browser.  
**Server-only** = no `NEXT_PUBLIC_` prefix; not a browser secret but not user-facing.

---

## 4. Missing variables (priority setup)

These eight variables are **not set** in the current local environment and must be added to Vercel Production before go-live.

---

### 4.1 `NEXT_PUBLIC_APP_URL`

| Field | Detail |
|-------|--------|
| **Type** | Public |
| **Sensitive in Vercel** | No |
| **Purpose** | Canonical HTTPS URL for Stripe return URLs, sitemap, Open Graph metadata, robots.txt |

**Where to obtain it**

| Source | Website | Exact page | What to copy |
|--------|---------|------------|--------------|
| Custom domain (recommended) | [vercel.com/dashboard](https://vercel.com/dashboard) | Project → **Settings** → **Domains** | Your production domain, e.g. `rovexo.com` |
| Vercel default | Same | **Domains** tab | `your-project.vercel.app` (use only before custom domain is ready) |

**Exact value format**

```
https://rovexo.com
```

| Rule | Requirement |
|------|-------------|
| Protocol | Must be `https://` |
| Path | No path — origin only (no trailing `/about`) |
| Port | No port number |
| Trailing slash | Omit trailing slash |

**Where to paste in Vercel**

- Key: `NEXT_PUBLIC_APP_URL`
- Environments: **Production** (+ Preview if you test preview deployments)
- Sensitive: **Off**

**How to verify it works**

1. Redeploy, then open `https://rovexo.com` — site loads over HTTPS.
2. View page source → `<link rel="canonical">` and Open Graph URLs should use `https://rovexo.com`.
3. `curl -sI https://rovexo.com/robots.txt` — `Sitemap:` line should reference your domain.
4. Run locally (after copying to `.env.local`): `npm run verify:env` — App URL validation shows ✓.

---

### 4.2 `STRIPE_SECRET_KEY`

| Field | Detail |
|-------|--------|
| **Type** | Secret |
| **Sensitive in Vercel** | **Yes** |
| **Purpose** | Server-side Stripe API: checkout, Connect, payouts, refunds, subscriptions |

**Where to obtain it**

| Source | Website | Exact page | What to copy |
|--------|---------|------------|--------------|
| Stripe Live secret key | [dashboard.stripe.com](https://dashboard.stripe.com) | **Developers** → **API keys** | **Secret key** in **Live mode** (toggle top-right must say "Live") |

Direct link: [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)

**Exact value format**

```
sk_live_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

| Rule | Requirement |
|------|-------------|
| Prefix | Must start with `sk_live_` in production |
| Do not use | `sk_test_` keys in Production environment |

**Where to paste in Vercel**

- Key: `STRIPE_SECRET_KEY`
- Environments: **Production** only
- Sensitive: **On**

**How to verify it works**

1. `curl -s https://rovexo.com/api/health | jq .checks.stripe` — should show `"status": "healthy"`.
2. Complete a small live checkout on the site → payment succeeds → order appears in Supabase.
3. Stripe Dashboard → **Payments** — payment record appears.
4. `npm run verify:env` — warns if key is `sk_test_` instead of `sk_live_`.

---

### 4.3 `STRIPE_WEBHOOK_SECRET`

| Field | Detail |
|-------|--------|
| **Type** | Secret |
| **Sensitive in Vercel** | **Yes** |
| **Purpose** | Verifies webhook signatures at `/api/webhooks/stripe` |

**Where to obtain it**

| Source | Website | Exact page | What to copy |
|--------|---------|------------|--------------|
| Stripe webhook endpoint | [dashboard.stripe.com](https://dashboard.stripe.com) | **Developers** → **Webhooks** → select endpoint → **Signing secret** → **Reveal** |

Direct link: [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)

**Create the endpoint first** (if not exists):

| Setting | Value |
|---------|-------|
| Endpoint URL | `https://rovexo.com/api/webhooks/stripe` |
| Mode | Live |
| Events | `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`, `transfer.reversed`, `charge.refunded`, `account.updated` |

**Exact value format**

```
whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

| Rule | Requirement |
|------|-------------|
| Prefix | Always starts with `whsec_` |
| One secret per endpoint | If you recreate the endpoint, update Vercel with the new secret |

**Where to paste in Vercel**

- Key: `STRIPE_WEBHOOK_SECRET`
- Environments: **Production** only
- Sensitive: **On**

**How to verify it works**

1. Stripe Dashboard → **Webhooks** → your endpoint → **Send test webhook** → `checkout.session.completed` → should return **200**.
2. Complete a real checkout → webhook **Event deliveries** tab shows successful delivery (green).
3. Order status in ROVEXO updates to paid (webhook fulfillment).
4. `curl -s https://rovexo.com/api/health | jq .checks.stripe` — healthy (implies key + webhook secret configured).

---

### 4.4 `RESEND_API_KEY`

| Field | Detail |
|-------|--------|
| **Type** | Secret |
| **Sensitive in Vercel** | **Yes** |
| **Purpose** | Sends transactional email (order confirmations, refunds, password reset via queue) |

**Where to obtain it**

| Source | Website | Exact page | What to copy |
|--------|---------|------------|--------------|
| Resend API key | [resend.com](https://resend.com) | **API Keys** → **Create API Key** | Full key (shown once) |

Direct link: [resend.com/api-keys](https://resend.com/api-keys)

**Exact value format**

```
re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

| Rule | Requirement |
|------|-------------|
| Prefix | Starts with `re_` |
| Permissions | Sending access for your verified domain |

**Where to paste in Vercel**

- Key: `RESEND_API_KEY`
- Environments: **Production** only
- Sensitive: **On**

**How to verify it works**

1. `curl -s https://rovexo.com/api/health | jq .checks.email` — should show `"status": "healthy"` (also requires `EMAIL_FROM`).
2. Trigger a password reset or complete a test order → email arrives in inbox.
3. Resend Dashboard → **Emails** — delivery log shows sent message.

---

### 4.5 `EMAIL_FROM`

| Field | Detail |
|-------|--------|
| **Type** | Server-only (not public) |
| **Sensitive in Vercel** | No |
| **Purpose** | Sender address on all outbound Resend emails |

**Where to obtain it**

| Source | Website | Exact page | What to copy |
|--------|---------|------------|--------------|
| Verified domain | [resend.com](https://resend.com) | **Domains** → your domain → **Verified** | Any address on that domain, e.g. `noreply@rovexo.com` |

Direct link: [resend.com/domains](https://resend.com/domains)

You must verify domain DNS (SPF, DKIM) on Resend before this works.

**Exact value format**

```
ROVEXO <noreply@rovexo.com>
```

Or without display name:

```
noreply@rovexo.com
```

| Rule | Requirement |
|------|-------------|
| Domain | Must match a **Verified** domain in Resend |
| Angle brackets | Required when using display name format |

**Where to paste in Vercel**

- Key: `EMAIL_FROM`
- Value: include the full string; Vercel accepts spaces in values
- Environments: **Production** only
- Sensitive: **Off**

**How to verify it works**

1. `curl -s https://rovexo.com/api/health | jq .checks.email` — `"status": "healthy"`.
2. Send test email via order flow or password reset.
3. Resend → **Emails** — sender matches your `EMAIL_FROM` value.

---

### 4.6 `UPSTASH_REDIS_REST_URL`

| Field | Detail |
|-------|--------|
| **Type** | Server-only |
| **Sensitive in Vercel** | No |
| **Purpose** | Production API rate limiting (auth, mutations) |

**Where to obtain it**

| Source | Website | Exact page | What to copy |
|--------|---------|------------|--------------|
| Upstash Redis | [console.upstash.com](https://console.upstash.com) | **Redis** → your database → **REST API** tab → **UPSTASH_REDIS_REST_URL** |

Direct link: [console.upstash.com/redis](https://console.upstash.com/redis)

Create a database in the same region as your Vercel deployment (e.g. `us-east-1`) if possible.

**Exact value format**

```
https://concrete-gibbon-12345.upstash.io
```

| Rule | Requirement |
|------|-------------|
| Protocol | `https://` |
| Type | REST URL — not the Redis `rediss://` connection string |

**Where to paste in Vercel**

- Key: `UPSTASH_REDIS_REST_URL`
- Environments: **Production** only
- Sensitive: **Off**

**How to verify it works**

1. `curl -s https://rovexo.com/api/health | jq .checks.redis` — `"status": "healthy"` (requires token too).
2. Without Redis configured, health shows `"Redis not configured (memory fallback active)"` — must not appear in production.
3. Rapid repeated API calls should be rate-limited (429) in production.

---

### 4.7 `UPSTASH_REDIS_REST_TOKEN`

| Field | Detail |
|-------|--------|
| **Type** | Secret |
| **Sensitive in Vercel** | **Yes** |
| **Purpose** | Authenticates REST requests to Upstash Redis |

**Where to obtain it**

| Source | Website | Exact page | What to copy |
|--------|---------|------------|--------------|
| Upstash Redis | [console.upstash.com](https://console.upstash.com) | **Redis** → your database → **REST API** tab → **UPSTASH_REDIS_REST_TOKEN** |

Same page as `UPSTASH_REDIS_REST_URL`.

**Exact value format**

```
AXXXaaBCdefGhIjKlMnOpQrStUvWxYz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop
```

| Rule | Requirement |
|------|-------------|
| Pairing | Must belong to the same Upstash database as `UPSTASH_REDIS_REST_URL` |
| Length | Long alphanumeric string (no prefix) |

**Where to paste in Vercel**

- Key: `UPSTASH_REDIS_REST_TOKEN`
- Environments: **Production** only
- Sensitive: **On**

**How to verify it works**

1. `curl -s https://rovexo.com/api/health | jq .checks.redis` — `"status": "healthy"`.
2. Manual ping (replace values):

```bash
curl -s -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_URL/ping"
```

Expected: `{"result":"PONG"}`

---

### 4.8 `CRON_SECRET`

| Field | Detail |
|-------|--------|
| **Type** | Secret |
| **Sensitive in Vercel** | **Yes** |
| **Purpose** | Bearer token authenticating `/api/cron/maintenance` and `/api/cron/orders/cleanup` |

**Where to obtain it**

| Source | Website | Exact page | What to generate |
|--------|---------|------------|------------------|
| You generate it | N/A (local terminal) | N/A | Cryptographically random string |

**Generate on macOS / Linux / Git Bash:**

```bash
openssl rand -hex 32
```

**Generate on Windows PowerShell:**

```powershell
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
```

**Exact value format**

```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

| Rule | Requirement |
|------|-------------|
| Length | At least 32 bytes of entropy (64 hex chars recommended) |
| Characters | Hex or alphanumeric — no spaces |
| Uniqueness | Do not reuse from other projects |

**Where to paste in Vercel**

- Key: `CRON_SECRET`
- Environments: **Production** only
- Sensitive: **On**

Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` when invoking cron routes defined in `vercel.json`.

**How to verify it works**

```bash
curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" https://rovexo.com/api/cron/maintenance
```

Expected: JSON response with maintenance results (not 401).

Without header:

```bash
curl -s -o /dev/null -w "%{http_code}" https://rovexo.com/api/cron/maintenance
```

Expected: `401`

Health check:

```bash
curl -s https://rovexo.com/api/health | jq .checks.cron
```

After first successful run: `"status": "healthy"`.

---

## 5. Already-configured variables

These four variables are present in the current local environment. Confirm the **same values** (or production equivalents) are set in Vercel Production.

---

### 5.1 `NEXT_PUBLIC_SUPABASE_URL`

| Field | Detail |
|-------|--------|
| **Type** | Public |
| **Sensitive in Vercel** | No |

**Where to obtain it**

| Website | Exact page | What to copy |
|---------|------------|--------------|
| [supabase.com/dashboard](https://supabase.com/dashboard) | Project `pklotmwxtnnepaitedic` → **Project Settings** (gear) → **API** → **Project URL** |

Direct link: `https://supabase.com/dashboard/project/pklotmwxtnnepaitedic/settings/api`

**Exact value format**

```
https://pklotmwxtnnepaitedic.supabase.co
```

| Rule | Requirement |
|------|-------------|
| Hostname | `<project-ref>.supabase.co` only |
| Do not use | Pooler URL, `supabase.com` hostname, or paths |

**Vercel:** Key `NEXT_PUBLIC_SUPABASE_URL` → Production → Sensitive **Off**

**Verify:** `npm run verify:env` — Supabase DNS resolves ✓. Health: `curl -s https://rovexo.com/api/health | jq .checks.database` → healthy.

---

### 5.2 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

| Field | Detail |
|-------|--------|
| **Type** | Public |
| **Sensitive in Vercel** | No |

**Where to obtain it**

| Website | Exact page | What to copy |
|---------|------------|--------------|
| [supabase.com/dashboard](https://supabase.com/dashboard) | Project → **Settings** → **API** → **Project API keys** → **anon** / **public** key (or **publishable** key) |

**Exact value format**

```
sb_publishable_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Legacy format `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` also works.

**Vercel:** Key `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Production → Sensitive **Off**

> Must use the `NEXT_PUBLIC_` prefix — not `SUPABASE_ANON_KEY` alone — so the browser bundle receives it.

**Verify:** Log in on `https://rovexo.com/login` — session persists. Browser DevTools → Network → Supabase requests return 200.

---

### 5.3 `SUPABASE_SERVICE_ROLE_KEY`

| Field | Detail |
|-------|--------|
| **Type** | Secret |
| **Sensitive in Vercel** | **Yes** |

**Where to obtain it**

| Website | Exact page | What to copy |
|---------|------------|--------------|
| [supabase.com/dashboard](https://supabase.com/dashboard) | Project → **Settings** → **API** → **Project API keys** → **service_role** key (click **Reveal**) |

**Exact value format**

```
sb_secret_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Legacy JWT format also works. **Never expose in client code or `NEXT_PUBLIC_` variables.**

**Vercel:** Key `SUPABASE_SERVICE_ROLE_KEY` → Production → Sensitive **On**

**Verify:** `curl -s https://rovexo.com/api/health | jq .checks.database` → healthy. Seller listing creation and checkout work server-side.

---

### 5.4 `NEXT_PUBLIC_GA_MEASUREMENT_ID`

| Field | Detail |
|-------|--------|
| **Type** | Public |
| **Sensitive in Vercel** | No |

**Where to obtain it**

| Website | Exact page | What to copy |
|---------|------------|--------------|
| [analytics.google.com](https://analytics.google.com) | **Admin** (gear) → **Data collection** → **Data streams** → your web stream → **Measurement ID** |

**Exact value format**

```
G-RNEMD5BT0S
```

| Rule | Requirement |
|------|-------------|
| Prefix | Always `G-` followed by alphanumeric characters |

**Vercel:** Key `NEXT_PUBLIC_GA_MEASUREMENT_ID` → Production → Sensitive **Off**

**Verify:** Open site → DevTools → Network → filter `google-analytics.com` or `googletagmanager.com` — requests include your `G-` ID. Do **not** set `NEXT_PUBLIC_GA_DEBUG` in production.

---

## 6. Database migrations

Before first production deploy:

```bash
supabase link --project-ref pklotmwxtnnepaitedic
supabase db push
```

Verify schema (requires database connection):

```bash
psql $DATABASE_URL -f scripts/verify-schema.sql
```

Expected: no rows returned.

---

## 7. Stripe configuration

Beyond environment variables:

| Step | Action |
|------|--------|
| 1 | Enable **Connect** → Express accounts on your Stripe platform |
| 2 | Create live webhook (see §4.3) |
| 3 | Test checkout end-to-end |
| 4 | Test seller Connect at `/seller/wallet` |
| 5 | Test subscription checkout at `/plans` |

---

## 8. Deploy to Vercel

```bash
npm run verify:env
npm run verify:production
```

Deploy:

```bash
vercel --prod
```

Or push to your production branch if Git integration is connected.

**Cron schedule** (`vercel.json`):

| Route | Schedule |
|-------|----------|
| `/api/cron/maintenance` | Every 15 minutes (`*/15 * * * *`) |
| `/api/cron/orders/cleanup` | Every 15 minutes (`*/15 * * * *`) |

Requires Vercel Pro for cron jobs.

---

## 9. Post-deploy verification

### Quick health checks

```bash
# Liveness (no auth)
curl -s https://rovexo.com/api/health/live

# Full platform health
curl -s https://rovexo.com/api/health | jq .

# Cron (replace secret)
curl -s -H "Authorization: Bearer $CRON_SECRET" https://rovexo.com/api/cron/maintenance
```

### Expected health statuses (all vars configured)

| Check | Expected |
|-------|----------|
| `api` | healthy |
| `database` | healthy |
| `storage` | healthy |
| `stripe` | healthy |
| `redis` | healthy |
| `cron` | healthy (after first run) |
| `email` | healthy |

### End-to-end smoke tests

- [ ] Register / log in
- [ ] Create listing with photo upload
- [ ] Complete live checkout (small amount)
- [ ] Confirm order email received
- [ ] Seller Connect onboarding
- [ ] Stripe webhook delivery green in dashboard
- [ ] `https://rovexo.com/sitemap.xml` loads

---

## 10. Final production checklist

### Environment variables (12/12)

- [ ] `NEXT_PUBLIC_APP_URL` — Public
- [ ] `NEXT_PUBLIC_SUPABASE_URL` — Public
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — Secret ✓
- [ ] `STRIPE_SECRET_KEY` — Secret ✓ (`sk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` — Secret ✓
- [ ] `RESEND_API_KEY` — Secret ✓
- [ ] `EMAIL_FROM` — Server-only
- [ ] `UPSTASH_REDIS_REST_URL` — Server-only
- [ ] `UPSTASH_REDIS_REST_TOKEN` — Secret ✓
- [ ] `CRON_SECRET` — Secret ✓
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` — Public

### Configuration rules

- [ ] No alias duplicates on Vercel
- [ ] All secrets marked **Sensitive**
- [ ] Redeploy after env changes
- [ ] No `sk_test_` keys in Production
- [ ] No `NEXT_PUBLIC_GA_DEBUG` in Production

### Infrastructure

- [ ] Supabase migrations applied
- [ ] Custom domain + SSL on Vercel
- [ ] Resend domain verified
- [ ] Stripe Connect + live webhook active
- [ ] Upstash Redis in production region
- [ ] Vercel Cron enabled (Pro)

### Verification commands

```bash
npm run verify:env          # local — exit 0 when all 12 present
curl https://rovexo.com/api/health/live
curl https://rovexo.com/api/health
```

**Ready for production:** all 12 variables set in Vercel Production, health checks pass, smoke tests complete.

---

## Related documents

- [PRODUCTION_ENVIRONMENT_CHECKLIST.md](./PRODUCTION_ENVIRONMENT_CHECKLIST.md) — variable status tracker
- [VERCEL_PRODUCTION.md](./VERCEL_PRODUCTION.md) — Vercel-specific env audit
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) — phased deployment checklist
- [PRODUCTION_OPERATIONS.md](./PRODUCTION_OPERATIONS.md) — ongoing operations
