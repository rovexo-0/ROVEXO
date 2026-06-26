# ROVEXO Production Environment Checklist

Last verified: **2026-06-24** (local `.env.local` + `process.env` scan via `npm run verify:env`)

Run the live check anytime:

```bash
npm run verify:env
```

The script exits with code **1** if any required variable is missing or URL validation fails.

---

## Required variables

| Variable | Group | Status | Example | Notes |
|----------|-------|--------|---------|-------|
| `NEXT_PUBLIC_APP_URL` | App | ✗ Missing | `https://www.rovexo.co.uk` | Canonical HTTPS URL for Stripe return URLs, sitemap, metadata |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | ✓ Present | `https://<project-ref>.supabase.co` | Alias: `SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | ✓ Present | `sb_publishable_<key>` | Aliases: `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | ✓ Present | `sb_secret_<key>` | Alias: `SUPABASE_SECRET_KEY` |
| `STRIPE_SECRET_KEY` | Stripe | ✗ Missing | `sk_live_<key>` | Use `sk_live_` in production (`lib/stripe/server.ts`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe | ✗ Missing | `whsec_<key>` | Webhook signing for `/api/webhooks/stripe` |
| `RESEND_API_KEY` | Email | ✗ Missing | `re_<key>` | Transactional email (`lib/email/service.ts`) |
| `EMAIL_FROM` | Email | ✗ Missing | `ROVEXO <support@rovexo.co.uk>` | Verified sender in Resend |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis | ✗ Missing | `https://<name>-<id>.upstash.io` | Production rate limiting (`lib/api/rate-limit.ts`) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis | ✗ Missing | `<token>` | Pair with REST URL |
| `CRON_SECRET` | Cron | ✗ Missing | `<secure-random-string>` | Bearer token for `/api/cron/*` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Analytics | ✓ Present | `G-RNEMD5BT0S` | GA4 measurement ID |

**Score: 4 / 12 required variables present**

---

## Optional variables

| Variable | Group | Status | Example | Notes |
|----------|-------|--------|---------|-------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | – Not set | `pk_live_<key>` | **Not used** by Stripe Hosted Checkout in v1.0; only needed if client-side Stripe.js is added |
| `NEXT_PUBLIC_SITE_URL` | App | – Not set | `https://www.rovexo.co.uk` | SEO fallback; defaults to `https://www.rovexo.co.uk` |
| `OPENAI_API_KEY` | AI Camera | – Not set | `sk-<key>` | Only when AI camera vision is enabled (`lib/ai-camera/config.ts`) |

---

## Alias reference

Some variables accept alternate names. The verifier treats any alias as satisfying the canonical key.

| Canonical | Accepted aliases |
|-----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SECRET_KEY` |

---

## Validation performed by `scripts/verify-env.ts`

1. **Presence** — reads `process.env`, `.env.local`, and `.env`
2. **`NEXT_PUBLIC_APP_URL`** — must be `https://` with no path (when set)
3. **`NEXT_PUBLIC_SUPABASE_URL`** — hostname must end with `.supabase.co`, not pooler URL; DNS lookup
4. **`STRIPE_SECRET_KEY`** — warns if `sk_test_` instead of `sk_live_` in production

---

## Deployment checklist (Vercel)

Set all ✗ Missing variables in the Vercel project **Environment Variables** panel for **Production** (and Preview if needed).

| Service | Dashboard |
|---------|-----------|
| Supabase | [supabase.com/dashboard](https://supabase.com/dashboard) → Project Settings → API |
| Stripe | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) + Webhooks |
| Resend | [resend.com/api-keys](https://resend.com/api-keys) |
| Upstash | [console.upstash.com](https://console.upstash.com) → Redis → REST API |
| Cron | Generate `CRON_SECRET` (e.g. `openssl rand -hex 32`) |

See also: [VERCEL_PRODUCTION.md](./VERCEL_PRODUCTION.md) · [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)

---

## Current scan summary

### ✓ Present

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (via alias `SUPABASE_SECRET_KEY`)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

### ✗ Missing

- `NEXT_PUBLIC_APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `CRON_SECRET`

### Ready for production

**NO** — 8 required variables missing locally. Set them in Vercel Production before go-live.

---

## Files

| File | Purpose |
|------|---------|
| `.env.example` | Template with placeholder values |
| `scripts/verify-env.ts` | Coloured CLI verification (exit 1 on failure) |
| `npm run verify:env` | Run verification |
| `npm run verify:production` | Full lint + typecheck + test + build + env |
