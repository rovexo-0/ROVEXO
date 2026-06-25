# ROVEXO Production Readiness

Last updated: **2026-06-24**

## Quick verification

```bash
npm run typecheck
npm test
npm run verify:env
npm run verify:production
```

## Code readiness (in-repo)

| Area | Status | Notes |
|------|--------|-------|
| TypeScript / tests | ✅ | Run `npm test` before deploy |
| Stripe Checkout + Connect Express | ✅ | Platform checkout; auto Connect transfers |
| Legal page (`/legal`) | ✅ | DNS EUROPA LTD disclosure for Stripe verification |
| Cron: maintenance | ✅ | Every 15 min — promotions, wallet, email |
| Cron: order cleanup | ✅ | Every 15 min — expired reservations only |
| Checkout session expiry | ✅ | `expires_at` matches 30-min reservation |
| Rate limiting | ✅ | Upstash required in production (fail-closed) |
| Security headers | ✅ | HSTS + CSP in production (`next.config.ts`) |
| Env verification | ✅ | `scripts/verify-env.ts` |
| Migrations on disk | ✅ | 33 SQL files |

## External blockers (dashboard setup)

These **cannot** be completed in code alone:

| # | Blocker | Action |
|---|---------|--------|
| 1 | **8/12 env vars missing locally** | Set all 12 in Vercel Production — see `docs/VERCEL_PRODUCTION.md` |
| 2 | **Supabase migrations on prod** | `supabase db push` (33 files) |
| 3 | **Stripe live mode** | `sk_live_`, webhook, Connect Express |
| 4 | **Resend domain** | Verify `EMAIL_FROM` domain |
| 5 | **Upstash Redis** | REST URL + token in Vercel |
| 6 | **Vercel Pro** | Required for `vercel.json` cron jobs |
| 7 | **Custom domain + SSL** | `NEXT_PUBLIC_APP_URL=https://rovexo.co.uk` |
| 8 | **DNS / SSL smoke test** | Post-deploy curl + checkout |

## Production readiness score

| Category | Weight | Score |
|----------|--------|-------|
| Application code | 40% | **38/40** |
| Configuration & docs | 20% | **18/20** |
| External services | 40% | **8/40** (env vars not set on Vercel) |

### **Overall: 64 / 100**

Score reaches **~95+** after all 12 Vercel env vars are set, migrations applied, and live Stripe/Resend/Upstash verified.

## Related docs

- [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md) — step-by-step env setup
- [VERCEL_PRODUCTION.md](./VERCEL_PRODUCTION.md) — Vercel variable list
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) — phased checklist
- [PRODUCTION_ENVIRONMENT_CHECKLIST.md](./PRODUCTION_ENVIRONMENT_CHECKLIST.md) — env status
