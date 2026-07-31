# ROVEXO RC1 — Production Checklist

**Version:** `1.0.0-rc.1` · Each item: **PASS** | **PENDING**

| Item | Status | Notes |
|------|--------|-------|
| Environment variables documented / `verify:env` available | PASS | Script exists; live secrets Owner-owned |
| Supabase production project linked | PASS | Live app uses production Supabase host |
| Storage buckets (images / avatars) | PASS | Upload pipelines in codebase; live permissions Owner ops |
| OAuth providers enabled (Google / Apple) | DEFERRED | RC1-OD-001 Owner Approved — next cycle |
| OAuth callbacks allowlisted | DEFERRED | RC1-OD-001 · complete with provider enablement |
| Resend / email delivery | PENDING | KI-005 live send matrix |
| Analytics | PENDING | Owner confirm production GA / tags |
| Monitoring / error logging | PENDING | Owner confirm production monitors |
| Cron / scheduled tasks | PENDING | Owner confirm Vercel/cron jobs |
| Backups | PENDING | Owner confirm Supabase backup policy |
| Rollback plan documented | PASS | See `ROLLBACK_GUIDE.md` |
| DNS (`www.rovexo.co.uk`) | PASS | Live HTTPS responds |
| SSL / HTTPS / HSTS | PASS | Live headers probe |
| PWA manifest / SW / offline assets | PASS | HTTP 200; device cert PENDING (KI-003/004) |
| Push (VAPID / subscribe) | PENDING | KI-003 |
| Security headers (CSP / etc.) | PASS | Live probe |
| SEO robots + child sitemaps | PASS | Root index PENDING DEPLOY (KI-008) |
| Legal Centre pages | PASS | HTTP 200; C.1 redirect PENDING DEPLOY (KI-009) |
| Help Centre | PASS | HTTP 200 |
| Local TypeScript / ESLint / Build / Suite | PASS | RC1 validation |
| Production LOCK | PENDING | Forbidden until Owner after full gates |
