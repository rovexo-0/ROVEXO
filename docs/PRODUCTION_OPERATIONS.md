# ROVEXO Production Operations Guide

## Health monitoring

Public health endpoint (for uptime monitors):

```bash
curl https://<domain>/api/health
```

Returns JSON with overall status (`healthy`, `degraded`, `unhealthy`) and per-dependency checks:

- API
- Database (Supabase)
- Storage buckets
- Stripe
- Redis (Upstash)
- Cron history
- Email configuration

Admin operations dashboard: `/admin/operations`

## Centralized logging

Errors are captured in `platform_error_logs` via `lib/ops/logger.ts`:

- API errors — `logApiError()`
- Payment errors — `logPaymentError()`
- Auth errors — `logAuthError()`
- Storage errors — `logStorageError()`
- Cron events — `logCronEvent()`

View recent errors in `/admin/operations`.

## Cron job history

Maintenance runs are recorded in `cron_job_runs` after each `/api/cron/maintenance` execution.

Schedule: every 15 minutes via `vercel.json`.

## Database backups (Supabase)

1. Enable **Point-in-Time Recovery** on production Supabase project (Pro plan).
2. Enable daily backups in Supabase Dashboard → Database → Backups.
3. Before major migrations, run manual backup:

```bash
supabase db dump --linked -f backup-$(date +%Y%m%d).sql
```

## Storage backups

Supabase Storage objects are backed up with project backups. For critical assets, periodically export listing images bucket via Supabase CLI or replicate to external object storage.

## Disaster recovery

1. Restore database from Supabase backup or PITR.
2. Re-apply any migrations applied after backup if using partial restore.
3. Verify schema: `psql $DATABASE_URL -f scripts/verify-schema.sql`
4. Redeploy application from last known good release.
5. Re-register Stripe webhook endpoint if domain changed.
6. Trigger cron manually and verify `/api/health`.

## Migration recovery

Migrations are forward-only. Never edit applied migration files. To fix a failed migration:

1. Identify failing statement in Supabase migration logs.
2. Create a new corrective migration (do not modify historical files).
3. Test on staging before production `supabase db push`.

## Email templates

All transactional emails use plain-text templates via `lib/email/service.ts` and domain-specific notification modules:

| Template ID | Source |
|---|---|
| `password_reset` | `lib/email/service.ts` |
| `order_confirmation` | `lib/orders/notifications.ts` |
| `seller_new_order` | `lib/orders/notifications.ts` |
| `order_shipped` | `lib/orders/notifications.ts` |
| `order_delivered` | `lib/orders/notifications.ts` |
| `order_cancelled` | `lib/orders/notifications.ts` |
| `refund_confirmation` | `lib/orders/notifications.ts` |
| `withdrawal_completed` | `lib/orders/notifications.ts` |
| `promotion_purchased` | `lib/orders/notifications.ts` |

Failed sends appear in `email_outbox` with `status = failed`. Monitor via `/admin/operations`.

## Manual configuration checklist

See `docs/PRODUCTION_DEPLOYMENT.md` for full environment variable list.

Required before production:

- All 28 migrations applied (`20250618000001` → `20250630000001`)
- `pnpm verify:env` passes
- Stripe webhook registered with subscription events
- Resend sender domain verified
- Upstash Redis configured
- `CRON_SECRET` set in Vercel
- Custom domain + HTTPS on `NEXT_PUBLIC_APP_URL`
