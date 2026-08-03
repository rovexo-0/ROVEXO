# ROVEXO PRODUCTION LAUNCH CHECKLIST v2.0

**STATUS:** FINAL PRE-LAUNCH · OWNER OPS MODE · ZERO APPLICATION CHANGES  
**Date:** 2026-08-02T14:48:38Z (evidence timestamp)  
**Official origin:** `https://www.rovexo.co.uk`  
**Supabase:** `https://pklotmwxtnnepaitedic.supabase.co`  

**Allowed section statuses only:** `PASS` · `WARNING` · `OWNER ACTION REQUIRED`  

**Forbidden this run:** Application code · Components · Pages · Hooks · API routes · SQL · Schema · Realtime · Migrations · Business logic · UI · Architecture · Refactor · Features · Commit · Push · Preview · Production  

**Policy:** Facebook is **not** officially supported on public Login/Register (RC1 `oauth-rc1-public-providers-v1`). Google + Apple are the required social providers.

---

## FINAL VERDICT

```
APPLICATION READY = YES
OPERATIONS READY = NO
```

| Gate | Meaning | Result |
|------|---------|--------|
| **APPLICATION READY** | App certification already Owner-stated (TypeScript · ESLint · Build · Vitest · Playwright · Realtime · Mobile · Cross Browser · A11y · Marketplace · Bundle · Checkout · Wallet · Orders). External dashboards do **not** change this. | **YES** |
| **OPERATIONS READY** | External production services proven ready with evidence. | **NO** |

### Why OPERATIONS READY = NO (evidence only)

1. **Supabase OAuth** — Live authorize probe: Google + Apple return HTTP 400 `provider is not enabled`.
2. **Stripe webhook** — Live API: endpoint `we_1Tm0trRBSxXoAbnlOnxu1g0v` has `status: "disabled"`; three minimum events missing.
3. **Backup / PITR** — Cannot be proven without Supabase Dashboard; no Owner attestation on file → not PASS.

---

# BLOCKER 1 — SUPABASE OAUTH

## Section status: OWNER ACTION REQUIRED

### What was verified automatically

| Check | Result | Evidence |
|-------|--------|----------|
| Google provider enabled | Not enabled | `GET …/auth/v1/authorize?provider=google&redirect_to=https://www.rovexo.co.uk/auth/callback` → **400** `validation_failed` · `Unsupported provider: provider is not enabled` |
| Apple provider enabled | Not enabled | Same for `provider=apple` → **400** |
| Facebook | Not required for launch | Public UI forbidden in RC1; probe also 400 |

### What cannot be verified automatically

| Check | Why |
|-------|-----|
| OAuth Client ID / Secret values | Stored in Supabase + Google/Apple consoles — no safe API dump |
| Authorized JavaScript Origins | Google Cloud Console only |
| Authorized Redirect URIs (IdP) | Google/Apple consoles only |
| Supabase Site URL + Redirect allowlist UI | Supabase Dashboard only |
| Vercel env mirrors (if any OAuth-related) | Vercel Dashboard / CLI not available this run |

### Exact Owner steps

**A. Google Cloud Console**

1. APIs & Services → Credentials → OAuth 2.0 Client (Web application).
2. **Authorized JavaScript origins:**
   - `https://www.rovexo.co.uk`
   - `http://localhost:3000` (dev)
3. **Authorized redirect URIs** (Supabase callback — not the app path):
   - `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback`
4. Copy Client ID + Client Secret.

**B. Apple Developer**

1. Services ID + Key for Sign in with Apple.
2. Domain: `pklotmwxtnnepaitedic.supabase.co`
3. Return URL: `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback`

**C. Supabase Dashboard**

1. Authentication → Providers → Enable **Google** → paste Client ID/Secret → Save.
2. Enable **Apple** → paste Services ID / Team ID / Key ID / private key → Save.
3. Authentication → URL Configuration:
   - **Site URL:** `https://www.rovexo.co.uk`
   - **Redirect URLs:**
     - `https://www.rovexo.co.uk/auth/callback`
     - `http://localhost:3000/auth/callback`
4. Do **not** enable Facebook for public Login/Register unless Owner re-authorizes RC1 policy.

### Expected verification result

```text
curl authorize google/apple with redirect_to=https://www.rovexo.co.uk/auth/callback
→ HTTP 302/303 Location to accounts.google.com / appleid.apple.com
→ NOT 400 provider is not enabled

Device: Login → Google/Apple → session on https://www.rovexo.co.uk
```

---

# BLOCKER 2 — STRIPE (PRODUCTION CONFIG)

## Section status: OWNER ACTION REQUIRED

### Automatically verified (API · no live charges)

| Check | Status | Evidence |
|-------|--------|----------|
| Live Publishable Key shape | PASS | Agent env `pk_live…` present |
| Live Secret Key | PASS | Stripe API accepted `sk_live…` (webhook list + prior balance/account) |
| Webhook endpoint exists | PASS | `we_1Tm0trRBSxXoAbnlOnxu1g0v` |
| Webhook enabled | **Not enabled** | API `"status": "disabled"` |
| Webhook URL | WARNING | `https://rovexo.co.uk/api/stripe/webhook` (apex); prefer `https://www.rovexo.co.uk/api/stripe/webhook` |
| Webhook signing secret shape | PASS | `whsec_…` present in agent env — **Owner must confirm equals Vercel Production** |
| API version on endpoint | PASS | `2026-05-27.dahlia` |
| Livemode | PASS | `livemode: true` |

### Minimum subscribed events

| Event | Verified subscribed? |
|-------|----------------------|
| `checkout.session.completed` | YES |
| `checkout.session.expired` | **NO — missing** |
| `payment_intent.succeeded` | YES |
| `payment_intent.payment_failed` | YES |
| `charge.refunded` | YES |
| `refund.updated` | YES |
| `transfer.created` | YES |
| `transfer.reversed` | **NO — missing** |
| `payout.paid` | YES |
| `payout.failed` | YES |
| `balance.available` | **NO — missing** |

### What cannot be verified automatically

| Check | Why |
|-------|-----|
| Vercel Production `STRIPE_*` exact match to Dashboard | Vercel Dashboard unavailable |
| Retry policy UI / delivery attempt settings | Stripe Dashboard Webhooks → endpoint settings |
| Dead-letter / failed-event review process | Owner ops process |
| End-to-end paid Checkout → webhook → order (would be a charge) | Forbidden this run (no live charge) |

**Note:** This is **not** an application FAIL. Checkout/Wallet code remains APPLICATION READY. Operations must enable and complete webhook config.

### Exact Owner steps

1. Stripe Dashboard → **Live** → Developers → Webhooks → open `we_1Tm0trRBSxXoAbnlOnxu1g0v`.
2. Set URL to **`https://www.rovexo.co.uk/api/stripe/webhook`**.
3. **Enable** the endpoint (`status` must become `enabled`).
4. Add missing events:
   - `checkout.session.expired`
   - `transfer.reversed`
   - `balance.available`
5. Reveal signing secret → confirm Vercel Production `STRIPE_WEBHOOK_SECRET` matches.
6. Confirm Production `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = Live pk · `STRIPE_SECRET_KEY` = Live sk.
7. Confirm retry behaviour in Stripe (default automatic retries) and monitor Failed deliveries.
8. Send Dashboard **test** webhook (not a real card charge) → expect HTTP 2xx from ROVEXO.

### Expected verification result

```text
GET /v1/webhook_endpoints/we_1Tm0trRBSxXoAbnlOnxu1g0v
  status = "enabled"
  url = "https://www.rovexo.co.uk/api/stripe/webhook"
  enabled_events includes all 11 minimum events
Test delivery = Succeeded (2xx)
```

---

# BLOCKER 3 — BACKUP

## Section status: OWNER ACTION REQUIRED

### Automatically verified

| Check | Status | Evidence |
|-------|--------|----------|
| Production DB reachable | PASS | `https://www.rovexo.co.uk/api/health` → database healthy |
| Storage reachable | PASS | health → `6 bucket(s) reachable` |
| Written recovery procedure exists | PASS | `docs/PRODUCTION_OPERATIONS.md` (PITR, daily backups, restore steps) |

### What cannot be verified automatically

| Check | Why |
|-------|-----|
| Daily backups enabled | Supabase Dashboard → Database → Backups |
| PITR enabled | Supabase plan/Dashboard only |
| Retention window | Dashboard only |
| Restore drill completed | Owner attestation / artifact required |
| Off-platform dump stored | Owner storage |
| Storage object export / replica | Owner ops |

**Do not invent PASS or FAIL for backup enablement.** Without Dashboard/Owner proof → **OWNER ACTION REQUIRED**.

### Exact Owner steps

1. Supabase → Project `pklotmwxtnnepaitedic` → Database → Backups.
2. Confirm **daily backups** ON.
3. Confirm **Point-in-Time Recovery** ON (Pro+).
4. Record **retention** (days) in Owner ops log.
5. Optional: `supabase db dump --linked -f backup-YYYYMMDD.sql` → store off-platform.
6. Run a **restore drill** on a branch/staging project; record date + RTO.
7. Confirm Storage covered by project backups; optional critical-bucket export.

### Expected verification result

```text
Owner attestation:
  Daily backups = ON
  PITR = ON
  Retention = <N days>
  Restore drill = <date> · RTO = <minutes>
```

---

# WARNING AUDIT (no changes)

## Email / SPF / DKIM / DMARC — WARNING

| Item | Status | Evidence |
|------|--------|----------|
| Resend credentials on Production | PASS | health → email healthy · “Resend credentials present” |
| DKIM | PASS | `resend._domainkey.rovexo.co.uk` TXT present |
| SPF (`send.rovexo.co.uk`) | PASS | `v=spf1 include:amazonses.com ~all` |
| SPF (apex `rovexo.co.uk`) | WARNING | Hostinger-only SPF — may not align with Resend From `@rovexo.co.uk` |
| DMARC | WARNING | `v=DMARC1; p=none` |
| Live inbox send matrix | OWNER ACTION REQUIRED | Needs Owner mailbox proof (Message-IDs) |

**Owner steps:** Resend domain Verified → align SPF if needed → raise DMARC after monitoring → send verification + order + notification emails to Owner inbox.

---

## Push / VAPID / Service Worker — WARNING

| Item | Status | Evidence |
|------|--------|----------|
| Service Worker | PASS | `https://www.rovexo.co.uk/sw.js` → 200 |
| Manifest | PASS | `/manifest.webmanifest` → 200 |
| VAPID configured | WARNING | health → push `not_configured` · “VAPID not configured” |
| iOS/Android push delivery | OWNER ACTION REQUIRED | Needs VAPID + device grant |

**Owner steps:** Generate VAPID keys → set Production env → redeploy when Owner authorizes → test on iPhone + Android.

---

## Monitoring / Logging / Alerts / Analytics — WARNING

| Item | Status | Evidence |
|------|--------|----------|
| Health endpoint | PASS | `/api/health` overall healthy |
| App logging capability | PASS | Documented `platform_error_logs` / ops logger / admin operations |
| External uptime monitor | OWNER ACTION REQUIRED | Dashboard (UptimeRobot / Better Stack / Vercel) not accessible |
| Paging alerts | OWNER ACTION REQUIRED | Owner channel not evidenced |
| Analytics (GA/tags) | OWNER ACTION REQUIRED | Production tags not verified this run |

**Owner steps:** Monitor `/api/health` → alert on unhealthy → review Stripe webhook failures + cron → confirm analytics if required for launch.

---

# SCOREBOARD

| Area | Status |
|------|--------|
| Application certification (Owner-stated) | PASS → **APPLICATION READY = YES** |
| Supabase OAuth (Google + Apple) | OWNER ACTION REQUIRED |
| Stripe keys (live shape + API) | PASS |
| Stripe webhook enabled + full event set | OWNER ACTION REQUIRED |
| Backup / PITR / restore | OWNER ACTION REQUIRED |
| Email DNS / Resend | WARNING |
| Push / VAPID | WARNING |
| Monitoring / Alerts / Analytics | WARNING |
| Redis / Cron (health) | PASS |
| Domain HTTPS / health | PASS |

---

# RE-CERT RULE

```
OPERATIONS READY = YES
```

only when:

1. Google + Apple authorize → **302/303** to IdP (not 400), and  
2. Stripe webhook `status = "enabled"` + all **11** minimum events subscribed, and  
3. Owner backup/PITR attestation recorded.

```
APPLICATION READY = YES
```

remains unless a **new application** regression is proven (out of scope for this ops audit).

**Evidence only. No assumptions. No code. No commit. No push. No Preview. No Production.**
