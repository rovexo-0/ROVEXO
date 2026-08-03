# ROVEXO PRODUCTION OPERATIONS CERTIFICATION v1.0

**STATUS:** FINAL PRE-LAUNCH · EVIDENCE ONLY  
**Date:** 2026-08-02  
**Official host:** `https://www.rovexo.co.uk`  
**Supabase project:** `pklotmwxtnnepaitedic.supabase.co`  
**Constraints enforced:** NO code · NO commit · NO push · NO Preview · NO Production deploy · NO live Stripe charges  

**Application gates (Owner-stated, out of scope for this ops cert):** TypeScript · ESLint · Next Build · Vitest · Playwright · Realtime · Mobile · Cross Browser · Accessibility · Security · Performance — treated as already certified.

---

## FINAL VERDICT

```
PRODUCTION OPERATIONS READY = NO
```

### Remaining operational blockers (FAIL only)

1. **OAuth** — Google / Apple / Facebook providers return `400 validation_failed` · `provider is not enabled` against production Supabase.
2. **Stripe webhook** — Live webhook endpoint `we_1Tm0trRBSxXoAbnlOnxu1g0v` has `status: "disabled"` (URL apex `https://rovexo.co.uk/api/stripe/webhook`).
3. **Database backup** — No runtime evidence that Supabase daily backups / PITR are enabled; RC1 ops checklist still marks Backups as PENDING.

---

## Evidence sources

| Source | Used for |
|--------|----------|
| Live `GET https://www.rovexo.co.uk/api/health` | Redis, Cron, Email credentials, Stripe API, Push, DB, Storage, Auth |
| Supabase Auth authorize probe + anon key | OAuth provider enablement |
| Stripe API `GET /v1/webhook_endpoints`, `/v1/balance`, `/v1/account` with local `sk_live` | Stripe live config (read-only; balance £0) |
| DNS (1.1.1.1 / 8.8.8.8) | SPF / DKIM / DMARC / MX |
| TLS peer certificates | SSL validity |
| HTTP probes | HTTPS, HSTS, robots, sitemap, SW, manifest, redirects |
| Repo `vercel.json`, `docs/PRODUCTION_OPERATIONS.md`, RC1 checklist | Cron schedules, backup procedure docs |
| Local `.env.local` | Presence of key shapes only (not Production SSOT) |

**Not available to agent:** Vercel Dashboard env dump · Supabase Dashboard Backups UI · Resend Dashboard domain verification · live email inbox proof · push subscribe on device.

---

## 1. OAUTH — FAIL

| Check | Result | Evidence |
|-------|--------|----------|
| Google provider enabled | FAIL | `GET …/auth/v1/authorize?provider=google&redirect_to=https://www.rovexo.co.uk/auth/callback` → **HTTP 400** `Unsupported provider: provider is not enabled` |
| Apple provider enabled | FAIL | Same 400 for `provider=apple` |
| Facebook provider enabled | FAIL | Same 400 for `provider=facebook` |
| Redirect / callback path (app) | PASS (code/contract) | Canonical path `/auth/callback`; probe used `https://www.rovexo.co.uk/auth/callback` |
| Authorized Origins / Redirect allowlist in Supabase | UNVERIFIED (dashboard) | Cannot confirm UI allowlist without Owner dashboard; provider enablement already fails first |

### Root Cause

Supabase Auth social providers are **not enabled** on project `pklotmwxtnnepaitedic`.

### Risk

Social login cannot start. Production auth for Google/Apple/Facebook is non-functional. Aligns with Auth Senior Audit / OAuth Configuration Golden Law (ops-only fix).

### Exact Owner Action

1. Supabase Dashboard → Authentication → Providers → enable **Google**, **Apple**, and **Facebook** (if Facebook is officially supported).
2. Complete each provider’s client ID / secret / Apple Services ID as required by the provider console.
3. Authentication → URL Configuration → allowlist:
   - `https://www.rovexo.co.uk`
   - `https://www.rovexo.co.uk/auth/callback`
   - `http://localhost:3000` / `http://localhost:3000/auth/callback` (dev only)
   - Keep production `https://rovexo.com/...` only if that domain will serve this app (today `rovexo.com` is a **different** host — do not assume it is ROVEXO app).
4. Save → re-test authorize URL until HTTP 302 to IdP (not 400).
5. No application code changes.

---

## 2. STRIPE — FAIL

| Check | Result | Evidence |
|-------|--------|----------|
| Live Publishable Key shape (local env) | PASS | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_live` |
| Live Secret Key | PASS | `sk_live` → Balance HTTP 200 · Account `charges_enabled: true` · `payouts_enabled: true` · GBP · GB |
| Live mode API | PASS | Balance `livemode` path; no charge created |
| Webhook signing secret shape (local) | PASS | `STRIPE_WEBHOOK_SECRET` starts with `whsec_` |
| Webhook endpoint exists | PASS | `we_1Tm0trRBSxXoAbnlOnxu1g0v` |
| Webhook **enabled** | **FAIL** | Stripe API: `"status": "disabled"` |
| Webhook URL canonical | WARNING | Endpoint URL = `https://rovexo.co.uk/api/stripe/webhook` (apex). Apex → 308 → `www`. Prefer `https://www.rovexo.co.uk/api/stripe/webhook` |
| Webhook events (present) | PASS (partial) | Includes `checkout.session.completed`, `payment_intent.*`, refunds, payouts, transfers, disputes |
| Webhook events (docs gap) | WARNING | Not subscribed: `checkout.session.expired`, `checkout.session.async_payment_failed`, `transfer.reversed` (vs ops docs expectations) |
| Checkout Session / Payment Intent / Refund / Transfer / Balance paths in product | PASS (app already certified) | Ops probe: Balance API OK; no live charge performed |
| Platform fee / seller payout / wallet release | WARNING (ops) | Code paths exist; **cannot** certify end-to-end money movement while webhook is disabled |
| Production health Stripe | PASS | `checks.stripe.status = healthy` |

### Root Cause

Live Stripe webhook endpoint is **disabled** in the Stripe Dashboard / API. Payment lifecycle events will not reach `/api/stripe/webhook`.

### Risk

Paid Checkout sessions may not finalize orders, escrow, wallet credit, or payouts. Silent money/state drift. Absolute Financial Law violation risk.

### Exact Owner Action

1. Stripe Dashboard (Live) → Developers → Webhooks → open `we_1Tm0trRBSxXoAbnlOnxu1g0v` → **Enable** endpoint.
2. Set endpoint URL to **`https://www.rovexo.co.uk/api/stripe/webhook`** (www, not apex-only).
3. Confirm signing secret matches Vercel Production `STRIPE_WEBHOOK_SECRET`.
4. Add missing events if required by ops: `checkout.session.expired`, `checkout.session.async_payment_failed`, `transfer.reversed`.
5. Send Stripe test event (Dashboard “Send test webhook”) — no real card charge required for enablement proof.
6. Re-query API until `status: "enabled"`.

---

## 3. EMAIL — WARNING

| Check | Result | Evidence |
|-------|--------|----------|
| Resend credentials on Production | PASS | Live health: `email` healthy · “Resend credentials present” |
| Sender identity (code default) | PASS | `ROVEXO <support@rovexo.co.uk>` (`lib/email/constants.ts`) |
| DKIM (`resend._domainkey.rovexo.co.uk`) | PASS | TXT public key present |
| SPF (`send.rovexo.co.uk`) | PASS | `v=spf1 include:amazonses.com ~all` |
| SPF (apex `rovexo.co.uk`) | WARNING | Apex SPF = Hostinger only (`include:_spf.mail.hostinger.com ~all`) — not Resend/SES |
| DMARC | WARNING | `_dmarc.rovexo.co.uk` = `v=DMARC1; p=none` (monitor-only) |
| MX | WARNING | Apex MX → Hostinger (`mx1/mx2.hostinger.com`) — inbound mail path separate from Resend |
| Live send matrix (verification / order / notification) | UNVERIFIED | No inbox proof in this audit; RC1 checklist Email still PENDING |
| Local agent `RESEND_API_KEY` | WARNING | Local key shape invalid for Resend API (`re_…`); **Production** health still shows credentials present |

### Root Cause (for WARNING)

DNS and Production credentials partially prove Resend domain wiring; apex SPF/DMARC policy and live send proof are incomplete.

### Risk

Deliverability / spoofing alignment may fail SPF checks when From is `@rovexo.co.uk` depending on Resend return-path setup. Weak DMARC (`p=none`) limits abuse protection. Unproven transactional sends.

### Exact Owner Action

1. Resend Dashboard → Domains → confirm `rovexo.co.uk` (or `send.rovexo.co.uk`) **Verified**.
2. Align apex SPF with Resend guidance if sending From `@rovexo.co.uk` (or keep From on verified subdomain only).
3. Raise DMARC to `p=quarantine` (then `reject`) after monitoring.
4. Send one verification + one order + one notification email to Owner inbox; archive message-IDs as evidence.
5. Confirm Vercel Production `RESEND_API_KEY` + optional `EMAIL_FROM`.

---

## 4. PUSH — WARNING

| Check | Result | Evidence |
|-------|--------|----------|
| VAPID on Production | **not_configured** | Live health: `push` · “VAPID not configured” (optional for RC1 per health runtime) |
| Service Worker | PASS | `https://www.rovexo.co.uk/sw.js` → 200 |
| PWA manifest | PASS | `/manifest.webmanifest` → 200 |
| Notification permissions / iOS / Android delivery | UNVERIFIED | No device subscribe proof; VAPID missing blocks real push |
| Localhost assumptions in Production health | PASS | Health reports Production config; no localhost URL required for SW/manifest |

### Root Cause

Production Vercel env lacks complete VAPID trio (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).

### Risk

Browser push notifications will not deliver. PWA install chrome may work; push will not.

### Exact Owner Action

1. Generate keys: `npx web-push generate-vapid-keys`.
2. Set Production (and Preview if needed): `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:support@rovexo.co.uk`.
3. Redeploy when Owner authorizes deploy stage.
4. On iPhone + Android: grant permission → receive test push → record evidence.
5. Until then, treat push as non-blocking for RC1 only if Owner explicitly accepts optional push.

---

## 5. REDIS — PASS

| Check | Result | Evidence |
|-------|--------|----------|
| Production credentials | PASS | Live health: `redis` healthy · “Redis ping OK” |
| Health | PASS | Same |
| Fallback | PASS (by design) | Code marks Redis optional with memory fallback when missing/invalid |
| Local agent credentials | WARNING | Local Upstash ping returned WRONGPASS — **agent env only**, not Production |
| Production readiness | PASS | Live ping OK |

No Owner action required for Production Redis unless local agent env must mirror Production for ops tooling.

---

## 6. CRON — PASS (with WARNING)

| Check | Result | Evidence |
|-------|--------|----------|
| `CRON_SECRET` on Production | PASS | Live health: `cron` healthy · “Cron scheduler healthy” (requires secret present per `checkCron`) |
| Scheduled jobs in `vercel.json` | PASS | 5 crons: maintenance `0 6 * * *`, orders/cleanup `0 3 * * *`, migration/process `0 4 * * *`, migration/publish `0 5 * * *`, shipping/tracking `0 2 * * *` |
| Auth on routes | PASS | `executeCronRoute` → `authorizeCronRequest` → 401 if unauthorized |
| Success/fail recording | PASS | `recordCronJobRun` + `logCronEvent` / `logOpsEvent` |
| Retry / dead-letter | WARNING | Failures logged and recorded; **no** dedicated DLQ/retry bus evidenced beyond Vercel re-invoke |
| Monitoring | WARNING | Ops logs + Super Admin surfaces exist; no external alert proof (PagerDuty/etc.) |
| Docs vs config | WARNING | `docs/PRODUCTION_OPERATIONS.md` mentions `*/15 * * * *` for some jobs; **vercel.json is daily** — treat `vercel.json` as deployed schedule SSOT |

### Exact Owner Action (WARNING only)

1. Confirm Vercel → Project → Cron Jobs shows the five paths as Active.
2. Manually invoke one job with `Authorization: Bearer $CRON_SECRET` and confirm 200 + run record.
3. Decide if wallet-release / maintenance needs sub-daily cadence; update `vercel.json` only when Owner authorizes a deploy.

---

## 7. DOMAIN — PASS

| Check | Result | Evidence |
|-------|--------|----------|
| HTTPS `www.rovexo.co.uk` | PASS | TLS valid · Let's Encrypt · CN `www.rovexo.co.uk` · valid **2026-06-21 → 2026-09-19** |
| HTTPS apex `rovexo.co.uk` | PASS | TLS valid · 308 → `https://www.rovexo.co.uk/` |
| Canonical | PASS | Apex redirects to www |
| HSTS | PASS | `max-age=63072000; includeSubDomains; preload` on www |
| Security headers | PASS | CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` |
| Robots | PASS | `/robots.txt` → 200 |
| Sitemap | PASS | `/sitemap.xml` → 200 |
| `rovexo.com` | WARNING | Responds 200 as **different** nginx/HTML host — **not** certified as ROVEXO app origin |

Owner note: renew SSL before **2026-09-19** (auto-renew expected on Vercel/LE).

---

## 8. VERCEL — WARNING

| Check | Result | Evidence |
|-------|--------|----------|
| Live Production deployment | PASS | `www.rovexo.co.uk` serves app + `/api/health` overall healthy |
| Required env present (inferred) | PASS | Live health `missingEnv` empty / checks for Stripe·Redis·Cron·Email credentials healthy |
| `vercel.json` build/cron/git | PASS | `build:production`; crons listed; deploy enabled for `main`/`develop` |
| Preview vs Production secrets isolation | UNVERIFIED | No Vercel CLI / Dashboard access in agent |
| Edge / Functions inventory | UNVERIFIED | No CLI `vercel inspect` evidence this run |
| Local `.env.local` | WARNING | Contains localhost URLs / incomplete secrets — **not** Production SSOT |

### Root Cause (WARNING)

Agent cannot dump Production/Preview environment variable inventory from Vercel API/CLI.

### Risk

Drift between local and Production; Preview leaks; missing optional keys (VAPID) already observed via health.

### Exact Owner Action

1. Vercel → Project → Settings → Environment Variables → export checklist for Production vs Preview.
2. Confirm Live Stripe / Resend / Supabase / Upstash / `CRON_SECRET` / webhook secret on **Production** only as intended.
3. Confirm Preview never uses Live Stripe charge capability unless intentional.
4. Add VAPID keys (see §4).

---

## 9. OBSERVABILITY — WARNING

| Check | Result | Evidence |
|-------|--------|----------|
| Health endpoint | PASS | `GET /api/health` → 200 · overall healthy |
| Logging | PASS (code + ops) | `lib/ops/logger.ts` · cron/payment logging paths |
| Error reporting store | WARNING | Platform error log patterns exist; **no** third-party APM/Sentry proof on Production |
| Monitoring / alerts | WARNING | RC1 checklist: Monitoring PENDING; no paging alert evidence |
| Super Admin ops surfaces | PASS (existence) | Recovery/backup/admin routes exist in build inventory |

### Exact Owner Action

1. Confirm production error log retention (Supabase `platform_error_logs` or equivalent) is writable and reviewed.
2. Attach alert on `/api/health` unhealthy (UptimeRobot / Better Stack / Vercel Monitoring).
3. Optional: enable Sentry (or chosen APM) with Production DSN — Owner decision.
4. Document on-call for Stripe webhook / cron failures.

---

## 10. BACKUP — FAIL

| Check | Result | Evidence |
|-------|--------|----------|
| Documented backup procedure | PASS | `docs/PRODUCTION_OPERATIONS.md` (PITR, daily backups, dump, restore steps) |
| Supabase daily backups / PITR enabled | **FAIL (unverified = fail-closed)** | No dashboard API evidence; RC1 `PRODUCTION_CHECKLIST.md` **Backups = PENDING** |
| Restore drill performed | FAIL | No restore evidence artifact |
| Storage backup | WARNING | Documented as part of project backups; no export evidence |
| Super Admin recovery APIs | PASS (existence) | `/api/super-admin/recovery/backup(s)` present in build logs — not proof of scheduled DB backup |

### Root Cause

Owner has not evidenced that Production Supabase backups / PITR are enabled and restorable.

### Risk

Unrecoverable data loss on corruption, bad migration, or regional failure. Violates recoverability financial/ops law.

### Exact Owner Action

1. Supabase Dashboard → Project `pklotmwxtnnepaitedic` → Database → Backups → enable **daily backups**.
2. Enable **Point-in-Time Recovery** (Pro) if not already.
3. Run one **manual** backup or dump; store artifact off-platform.
4. Execute a **non-production** restore drill (branch/staging) and record steps + time-to-restore.
5. Confirm Storage buckets covered; optional third-party object replication for listing images.
6. Update RC1 checklist Backups → PASS only after Owner confirmation.

---

## Section scoreboard

| # | Area | Status |
|---|------|--------|
| 1 | OAuth | **FAIL** |
| 2 | Stripe | **FAIL** |
| 3 | Email | **WARNING** |
| 4 | Push | **WARNING** |
| 5 | Redis | **PASS** |
| 6 | Cron | **PASS** (WARNING notes) |
| 7 | Domain | **PASS** |
| 8 | Vercel | **WARNING** |
| 9 | Observability | **WARNING** |
| 10 | Backup | **FAIL** |

---

## Owner pre-launch checklist (FAIL items only)

### A. OAuth (blocker)

- [ ] Enable Google in Supabase Auth  
- [ ] Enable Apple in Supabase Auth  
- [ ] Enable Facebook if officially supported  
- [ ] Allowlist `https://www.rovexo.co.uk` + `/auth/callback`  
- [ ] Prove authorize returns redirect to IdP (not 400)

### B. Stripe (blocker)

- [ ] Enable webhook `we_1Tm0trRBSxXoAbnlOnxu1g0v`  
- [ ] Point URL to `https://www.rovexo.co.uk/api/stripe/webhook`  
- [ ] Confirm `whsec` matches Vercel Production  
- [ ] Stripe API shows `status: "enabled"`  
- [ ] Optional: add expired/async_failed/transfer.reversed events  

### C. Backup (blocker)

- [ ] Supabase daily backups ON  
- [ ] PITR ON (if plan allows)  
- [ ] One restore drill recorded  

---

## Explicit non-actions this certification

- No application code changes  
- No SQL / migrations  
- No git commit / push  
- No Preview / Production deploy  
- No live card charges  

---

## Re-cert gate

Re-run this ops certification after Owner completes A–C.  
`PRODUCTION OPERATIONS READY = YES` only when sections **1, 2, and 10** are evidence **PASS** and no new FAIL appears.
