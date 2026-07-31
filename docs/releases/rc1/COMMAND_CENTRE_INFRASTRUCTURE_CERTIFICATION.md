# Command Centre Infrastructure Certification RC1

**STATUS: CODE FREEZE PACKAGE · ENGINEERING CERTIFIED · OWNER DEVICE VALIDATION PENDING**

## Classification

### Required for RC1
API · Database · Storage · Authentication · Stripe

### Optional (Not Configured ≠ Error)
Redis / Queue · Email (Resend) · Cron · Push · Sendcloud · Monitoring extras

## Health vocabulary
`healthy` · `degraded` · `unhealthy` · `not_configured`

Optional missing → **Not configured** (never Unhealthy / ERROR).  
Required missing or failed → **Unhealthy / Error**.  
Redis optional with invalid credentials → **Degraded** + memory fallback (never Unhealthy 401 alarm for RC1).

## SSOT
- `lib/ops/health-runtime.ts`
- `lib/ops/health-types.ts`
- `lib/ops/rc1-infrastructure-classification-v1.ts`
- `lib/ops/production-env.ts`
- Command Centre mappers: `production-data.ts` · `build-v2-extensions.ts`
