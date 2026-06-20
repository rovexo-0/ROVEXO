# ROVEXO Production Deployment Checklist

## Phase 1 — Database

Apply all migrations in order (`supabase/migrations/20250618000001` through `20250620000008`):

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Verify schema:

```bash
psql $DATABASE_URL -f scripts/verify-schema.sql
```

Expected: no rows returned (all checks pass).

## Phase 2 — Environment (Vercel + Supabase)

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server/admin operations |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical app URL (https://yourdomain.com) |
| `STRIPE_SECRET_KEY` | Yes | Payments + Connect |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook signature verification |
| `RESEND_API_KEY` | Yes | Transactional email |
| `EMAIL_FROM` | Yes | Sender address (verified in Resend) |
| `UPSTASH_REDIS_REST_URL` | Yes | Production rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Production rate limiting |
| `CRON_SECRET` | Yes | Cron job authentication |

Verify locally:

```bash
pnpm verify:env
```

## Phase 3 — Stripe

1. Enable Stripe Connect (Express accounts) on your platform account.
2. Register webhook endpoint: `https://<domain>/api/webhooks/stripe`
3. Subscribe to events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `checkout.session.async_payment_failed`
   - `transfer.reversed`
   - `charge.refunded`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`.
5. Test checkout → success URL → webhook fulfillment.
6. Test cancel URL → order cancelled + email.
7. Test seller Connect onboarding at `/seller/wallet`.
8. Test withdrawal (requires Connect + platform balance).
9. Test admin refund action (creates Stripe refund).

## Phase 4 — Email (Resend)

Transactional emails (queued with retry):

| Template | Trigger |
|---|---|
| `order_confirmation` | Payment success |
| `order_cancelled` | Checkout expired / user cancel |
| `refund_confirmation` | Admin refund |
| `promotion_purchased` | Promotion checkout |
| `withdrawal_completed` | Stripe Connect payout |
| `password_reset` | Forgot password flow |

Email verification uses **Supabase Auth** (not Resend).

Cron processes queue every 15 minutes via `/api/cron/maintenance`.

## Phase 5 — Cron (Vercel)

`vercel.json` schedules maintenance every 15 minutes.

Set `CRON_SECRET` in Vercel — Vercel sends `Authorization: Bearer <CRON_SECRET>`.

Maintenance handles:
- Expired promotions
- Expired awaiting-payment orders
- Wallet pending → available release
- Email outbox (with retry)
- Abandoned cart cleanup (30+ days)

Manual test:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/maintenance
```

## Phase 6 — Performance

- Upstash Redis rate limiting (falls back to memory without config — not for production)
- Next.js Image optimization via `sharp`
- Production build: `pnpm build`
- Sitemap: `/sitemap.xml` (dynamic, up to 500 listings)

## Phase 7 — Security

- All mutating API routes require authentication
- Admin routes: `requireApiRole(["admin"])`
- Seller routes: role checks on listings/wallet/analytics
- Webhooks: Stripe signature verification
- Cron: `CRON_SECRET` bearer token
- Reviews: RPC-only insert (direct client insert blocked)
- RLS enabled on all sensitive tables

## Phase 8 — SEO

- `/robots.txt` — disallows private routes
- `/sitemap.xml` — static + product pages
- Root + listing pages: Open Graph + Twitter Cards
- Canonical URLs via `metadataBase`

## Phase 9 — Deploy

```bash
pnpm verify:production
vercel --prod
```

Post-deploy:
1. Confirm HTTPS on custom domain
2. Run schema verification SQL
3. Send test order end-to-end
4. Trigger cron manually
5. Monitor Vercel function logs + Supabase dashboard

## Phase 10 — Final QA

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify:env
```

All must pass before GO decision.
