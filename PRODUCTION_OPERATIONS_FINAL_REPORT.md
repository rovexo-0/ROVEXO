# ROVEXO PRODUCTION OPERATIONS FINAL REPORT v1.0

**STATUS:** OWNER OPERATIONS EXECUTION · APPLICATION FROZEN  
**Evidence timestamp:** 2026-08-02  
**Official origin:** `https://www.rovexo.co.uk`  
**Supabase:** `https://pklotmwxtnnepaitedic.supabase.co`  
**Stripe webhook:** `we_1Tm0trRBSxXoAbnlOnxu1g0v`  

**Constraints enforced:** No application code · No SQL · No migrations · No commit · No push · No Preview · No Production deploy · No real customer charges  

**Section statuses only:** `PASS` · `WARNING` · `OWNER ACTION REQUIRED`

---

## FINAL VERDICT

```
APPLICATION READY = YES
OPERATIONS READY = NO
```

### Remaining operational blockers only

1. **Supabase OAuth** — Google + Apple still disabled (`/auth/v1/settings` + authorize 400). No Management API token to enable providers.
2. **Stripe money-path E2E** — Webhook **configuration** is now PASS; **Checkout → Order → Wallet → Seller Balance** not evidenced (no customer charge; synthetic signed probe returned HTTP 500).
3. **Supabase Backup / PITR** — Dashboard unavailable; no Owner attestation of daily backups / PITR / restore drill.

---

# BLOCKER 1 — SUPABASE OAUTH

## Status: OWNER ACTION REQUIRED

### Evidence

| Check | Result |
|-------|--------|
| `GET /auth/v1/settings` → `external.google` | **false** |
| `GET /auth/v1/settings` → `external.apple` | **false** |
| `GET /auth/v1/settings` → `external.facebook` | **false** |
| `GET /auth/v1/settings` → `external.email` | **true** |
| Authorize Google + `redirect_to=https://www.rovexo.co.uk/auth/callback` | **HTTP 400** `provider is not enabled` |
| Authorize Apple | **HTTP 400** same |
| Facebook officially supported on public Login/Register? | **No** (RC1 forbidden) — not a launch blocker |
| `SUPABASE_ACCESS_TOKEN` / Management API | **Absent** — cannot enable providers from agent |
| Client ID / Secret / Google Origins / Apple Return URLs | **Not readable** without Owner consoles |

### Reason

Provider enablement and IdP credentials live only in Supabase + Google Cloud + Apple Developer. Agent has no Management token. Live settings prove Google/Apple are off.

### Exact Owner steps

**Google**

1. Google Cloud Console → OAuth Web client.  
2. Authorized JavaScript origins: `https://www.rovexo.co.uk`, `http://localhost:3000`.  
3. Authorized redirect URI: `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback`.  
4. Supabase → Authentication → Providers → Google → Enable → paste Client ID + Secret → Save.

**Apple**

1. Apple Developer → Services ID + Key (Sign in with Apple).  
2. Domain `pklotmwxtnnepaitedic.supabase.co` · Return URL `https://pklotmwxtnnepaitedic.supabase.co/auth/v1/callback`.  
3. Supabase → Providers → Apple → Enable → paste credentials → Save.

**Supabase URL config**

- Site URL: `https://www.rovexo.co.uk`  
- Redirect allowlist: `https://www.rovexo.co.uk/auth/callback`, `http://localhost:3000/auth/callback`  
- Do **not** enable Facebook for public UI unless Owner changes RC1 policy.

### Expected verification

```text
/auth/v1/settings → external.google=true, external.apple=true
Authorize google/apple → HTTP 302/303 to IdP (not 400)
Live: Sign In → Sign Out → session restore → refresh → expired session
Browsers: Chrome desktop · Mobile Safari · Chrome Android
```

**Live login tests this run:** Not executed — providers disabled; tests would fail closed by definition.

---

# BLOCKER 2 — STRIPE WEBHOOK

## Configuration status: PASS

### Evidence (Live Stripe API · Owner-approved mutate this session)

| Check | Before | After |
|-------|--------|-------|
| Endpoint ID | `we_1Tm0trRBSxXoAbnlOnxu1g0v` | same |
| Status | `disabled` | **`enabled`** |
| URL | `https://rovexo.co.uk/api/stripe/webhook` | **`https://www.rovexo.co.uk/api/stripe/webhook`** |
| API version | `2026-05-27.dahlia` | same |
| Livemode | true | true |

### Minimum events (all present after update)

| Event | Status |
|-------|--------|
| `checkout.session.completed` | PASS |
| `checkout.session.expired` | PASS (was missing → added) |
| `payment_intent.succeeded` | PASS |
| `payment_intent.payment_failed` | PASS |
| `charge.refunded` | PASS |
| `refund.updated` | PASS |
| `transfer.created` | PASS |
| `transfer.reversed` | PASS (was missing → added) |
| `payout.paid` | PASS |
| `payout.failed` | PASS |
| `balance.available` | PASS (was missing → added) |

Also retained: `refund.created`, `customer.*`, `account.updated`, dispute events.

### Keys / route

| Check | Status | Evidence |
|-------|--------|----------|
| Live publishable key | PASS | `pk_live…` present (agent env) |
| Live secret key | PASS | Used successfully against Stripe API |
| Signing secret shape | PASS | `whsec…` present (agent env) |
| Vercel Production secret match | OWNER ACTION REQUIRED | Confirm Dashboard secret === Vercel `STRIPE_WEBHOOK_SECRET` |
| Route up (unsigned) | PASS | `POST https://www.rovexo.co.uk/api/stripe/webhook` → **400** `Missing Stripe signature.` |
| Retry policy | OWNER ACTION REQUIRED | Stripe Dashboard delivery/retry UI not dumped this run (Stripe default retries apply when enabled) |

---

## Money-path E2E status: OWNER ACTION REQUIRED

### Evidence

| Step | Result |
|------|--------|
| Stripe → Webhook config | PASS (enabled + events + www URL) |
| Signed synthetic `balance.available` → www | **HTTP 500** `Webhook handler failed.` (signature accepted — not 400 Invalid signature; handler/DB path failed on synthetic event) |
| Stripe → Order → Wallet → Seller Balance | **Not proven** — no real customer charge; Full Demo E2E not run this session |

### Reason

Owner forbade real customer charges. Full financial chain requires a controlled non-customer payment path (Demo Session / Owner test card under Owner rules) plus Dashboard delivery log. Synthetic event is insufficient evidence for money PASS.

### Exact Owner steps

1. Stripe Dashboard → Webhooks → `we_1Tm0tr…` → confirm **Enabled**, URL www, all 11 events.  
2. Reveal signing secret → match Vercel Production `STRIPE_WEBHOOK_SECRET`.  
3. Send Dashboard **test** event `checkout.session.completed` → expect **2xx** (or document handler response).  
4. Using **Full Demo / virtual** path only (no real customer money): Buy Now → Checkout → pay → confirm Order created → Wallet/seller balance updated.  
5. In Stripe → endpoint → Events: delivery **Succeeded**.  
6. Confirm retries visible for any failed delivery.

### Expected verification

```text
Webhook status=enabled
Delivery Succeeded for real (demo) checkout.session.completed
Order row exists · Wallet/escrow/seller balance consistent with payment
No duplicate charges
```

---

# BLOCKER 3 — SUPABASE BACKUP

## Status: OWNER ACTION REQUIRED

### Evidence

| Check | Result |
|-------|--------|
| Production DB readable | PASS — `/api/health` database healthy |
| Storage reachable | PASS — 6 buckets |
| Written recovery docs | PASS — `docs/PRODUCTION_OPERATIONS.md` |
| Daily backups ON | **Unverified** — no Dashboard / Management token |
| PITR ON | **Unverified** |
| Retention | **Unverified** |
| Last successful backup | **Unverified** |
| Restore drill | **Unverified** |
| RTO / RPO Owner-recorded | **Unverified** |

### Reason

Backup enablement and restore proof require Supabase Dashboard (or Management API). Agent has neither attestation nor API access.

### Exact Owner steps

1. Supabase → `pklotmwxtnnepaitedic` → Database → Backups.  
2. Enable / confirm **Daily backups**.  
3. Enable / confirm **PITR**.  
4. Record **retention** (days).  
5. Record **last successful backup** timestamp.  
6. Define targets, e.g. **RPO ≤ 24h** (or PITR granularity), **RTO ≤ 4h** (Owner choice).  
7. Run restore drill on branch/staging; store dump off-platform if desired.  
8. Confirm Storage included in project backup policy.

### Expected verification

```text
Daily backups = ON
PITR = ON
Retention = <N days>
Last successful backup = <timestamp>
RPO = <value>
RTO = <value>
Restore drill = <date> PASS
```

---

# WARNINGS (audit only · no code)

## Email / SPF / DKIM / DMARC — WARNING

| Item | Status | Evidence |
|------|--------|----------|
| Resend credentials (Production health) | PASS | “Resend credentials present” |
| DKIM | PASS | `resend._domainkey.rovexo.co.uk` TXT |
| SPF `send.rovexo.co.uk` | PASS | `include:amazonses.com` |
| Apex SPF | WARNING | Hostinger-only |
| DMARC | WARNING | `p=none` |
| Live inbox matrix | OWNER ACTION REQUIRED | Needs Owner Message-IDs |

## Push / VAPID / SW — WARNING

| Item | Status | Evidence |
|------|--------|----------|
| Service Worker | PASS | `/sw.js` 200 |
| Manifest | PASS | `/manifest.webmanifest` 200 |
| VAPID | WARNING | health push `not_configured` |
| Device push | OWNER ACTION REQUIRED | Needs VAPID + device test |

## Monitoring / Logging / Alerts / Health / Analytics — WARNING

| Item | Status | Evidence |
|------|--------|----------|
| Health checks | PASS | `/api/health` overall healthy · redis/cron/stripe/email OK |
| Logging capability | PASS | Documented ops logger / admin operations |
| External uptime + paging | OWNER ACTION REQUIRED | Not evidenced |
| Analytics | OWNER ACTION REQUIRED | Not evidenced |

---

# SCOREBOARD

| Area | Status |
|------|--------|
| Application (frozen · Owner-stated) | **PASS** → APPLICATION READY = YES |
| OAuth Google + Apple | OWNER ACTION REQUIRED |
| Stripe webhook configuration | **PASS** |
| Stripe → Order → Wallet E2E | OWNER ACTION REQUIRED |
| Backup / PITR / restore | OWNER ACTION REQUIRED |
| Email DNS | WARNING |
| Push VAPID | WARNING |
| Monitoring / Analytics | WARNING |

---

# WHAT THIS EXECUTION CHANGED (ops only)

1. **Stripe Live webhook** `we_1Tm0trRBSxXoAbnlOnxu1g0v`:
   - `disabled` → **`enabled`**
   - URL → **`https://www.rovexo.co.uk/api/stripe/webhook`**
   - Added: `checkout.session.expired`, `transfer.reversed`, `balance.available`

**Not changed:** Application code · DB · Vercel deploy · OAuth providers · Backup settings.

---

```
APPLICATION READY = YES
OPERATIONS READY = NO
```

**No application blockers. Evidence only. No commit. No push. No Preview. No Production deploy.**
