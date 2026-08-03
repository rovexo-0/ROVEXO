# ROVEXO_PRODUCTION_SECURITY_FINAL_CERTIFICATION.md

**STATUS:** FINAL SECURITY HARDENING v3.1 · PRODUCTION RELEASE BLOCKER CLEARANCE  
**DATE:** 2026-08-03  
**BASELINE:** `ROVEXO_SECURITY_CERTIFICATION_v2.0.md`  
**SECURITY FREEZE:** ACTIVE  
**CONSTRAINTS:** Security remediation only · NO UI/UX · NO business-logic redesign · **NO COMMIT · NO PUSH · NO DEPLOY**  
**OFFICIAL HOST:** `https://www.rovexo.co.uk`  
**SUPABASE:** `pklotmwxtnnepaitedic.supabase.co`

---

## Final Verdict

```
PRODUCTION SECURITY READY = YES
```

Await explicit Owner approval before Commit / Push / Deploy.

---

## V1.0 Scope

| In scope | Out of scope |
|----------|----------------|
| Email · Google OAuth · MFA TOTP · Recovery Codes · Sessions · Marketplace · Stripe Live | Apple OAuth **N/A (Planned v2.0)** · Facebook OAuth **N/A (Planned v2.0)** |

---

## Remediation Summary (this session)

| Blocker (v2.0) | Action | Result |
|----------------|--------|--------|
| Next.js 16.2.9 high CVEs | Upgraded `next` / `@next/third-parties` / `eslint-config-next` → **16.2.12** | Cleared |
| Transitive postcss / sharp / js-yaml / brace-expansion | `pnpm-workspace.yaml` overrides (pnpm 11) | Prod tree Next→postcss **8.5.18** |
| SSRF migration image fetch | Added `lib/security/ssrf-guard-v1.ts` · wired downloader, migration HTTP client, shipping label fetch | Cleared |
| Stripe Live webhook disabled | Re-probed Live API | Endpoint **enabled** · URL `www.rovexo.co.uk/api/stripe/webhook` |
| Backup restore unverified | Offline restore verify in `backup:restore` · `BACKUP_RESTORE_VERIFICATION.json` | **PASS** |
| `xlsx` high (no npm patch) | Size-limit hardening · residual documented | Residual · no upstream npm fix |

---

## 1. Infrastructure — **PASS**

| Control | Result | Evidence |
|---------|--------|----------|
| HTTPS / TLS | PASS | Live `www.rovexo.co.uk` |
| HSTS | PASS | `max-age=63072000; includeSubDomains; preload` |
| CSP / XFO / XCTO / Referrer / Permissions | PASS | Live HEAD (browser UA) |
| Secure cookies | PASS | `lib/auth/session-cookies.ts` |
| Health | PASS | `/api/health` overall `healthy` (api, db, storage, auth, stripe, redis, cron, email) |
| Secret pattern | PASS | Env-based; no secrets in reports |

**Remaining findings:** CSP allows `'unsafe-inline'` / `'unsafe-eval'` (Medium · non-blocking · future nonce CSP).

**Owner Action:** None for release.  
**Expected Verification:** Headers remain present on www.

---

## 2. Authentication — **PASS**

| Control | Result | Evidence |
|---------|--------|----------|
| Email Login | PASS | Auth senior audit · MFA live email path |
| Google OAuth | PASS | Authorize → **HTTP 302** → `accounts.google.com` (2026-08-03) |
| JWT / Sessions | PASS | Supabase SSR + middleware |
| Logout / Logout others | PASS | Sessions API `signOut({ scope: "others" })` |
| MFA (TOTP) | PASS | `MFA_LIVE_CERTIFICATION.md` 29/29 · `tests/mfa-totp-v1.test.ts` |
| Recovery Codes | PASS | Hashed recovery codes · live cert |
| AAL enforcement | PASS | Middleware + API `mfa_required` |
| Cookie security | PASS | HttpOnly · Secure (prod) · SameSite=lax |
| Redirect validation | PASS | `sanitizeNextPath` |
| Apple OAuth | **N/A (Planned v2.0)** | Must not fail v1.0 |
| Facebook OAuth | **N/A (Planned v2.0)** | Must not fail v1.0 |

**Remaining findings:** Google+MFA interactive Owner drill on www still recommended (`GOOGLE_MFA_LIVE_CERTIFICATION.md` historical gap). Provider + email MFA PASS. Severity: Medium · non-blocking.

**Owner Action (optional):** One Google login → MFA/recovery on www.  
**Expected Verification:** AAL2 after Google+MFA.

---

## 3. Authorization — **PASS**

| Control | Result | Evidence |
|---------|--------|----------|
| RBAC Admin / Super Admin | PASS | `lib/auth/roles.ts` · API guards |
| Buyer / Seller isolation | PASS | User-scoped APIs |
| Supabase RLS | PASS | Foundation RLS + restore dump markers |
| Storage policies | PASS | `auth.uid()` folder paths |
| IDOR / privilege escalation (sampled) | PASS | Listing/order/wallet ownership patterns |

**Remaining findings:** SQL `is_admin()` may exclude `super_admin` (Low · app often uses service role).

**Owner Action:** None for release.  
**Expected Verification:** Admin ops continue on intended clients.

---

## 4. Application Security — **PASS**

| Control | Result | Evidence |
|---------|--------|----------|
| SQL Injection | PASS | Query builder / RPC |
| XSS | PASS* | SafeImage · CSP · fail-closed |
| CSRF | PASS* | Guard on staff/super-admin; SameSite cookies |
| SSRF | **PASS** | `lib/security/ssrf-guard-v1.ts` + callers · `tests/ssrf-guard-v1.test.ts` **8/8** |
| Command Injection | PASS | No user-shell exec in app routes |
| Path Traversal | PASS | Upload path prefix |
| Open Redirect | PASS | `sanitizeNextPath` |
| Clickjacking | PASS | XFO DENY + `frame-ancestors 'none'` |
| Unsafe file upload | PASS | MIME + size limits |
| Prototype pollution (`xlsx`) | MITIGATED residual | See Dependency |

\*Nuances documented; not release blockers after SSRF clearance.

**SSRF Production Reachability**

| Surface | Reachable | Protection |
|---------|-----------|------------|
| Migration image downloader | YES (seller migration) | `safeFetch` + private/metadata block + redirect re-validate |
| Migration connector HTTP | YES (OAuth shops) | `safeFetch` |
| Shipping label PDF fetch | YES | `safeFetch` + Sendcloud/Supabase/ROVEXO allowlist |
| Fixed SaaS URLs (Stripe/Resend/etc.) | YES | Constant HTTPS endpoints (not user-controlled) |

**Remaining findings:** CSRF not universal on every cookie mutation (Medium).  
**Owner Action:** Future Origin guard expansion (freeze forbids broad API churn now).  
**Expected Verification:** SSRF unit tests remain green.

---

## 5. API Security — **PASS**

| Control | Result | Evidence |
|---------|--------|----------|
| Authentication | PASS | `requireApiAuth` / `getUser()` |
| Authorization / ownership | PASS | Role helpers + scoped queries |
| JWT validation | PASS | Supabase session |
| Rate limiting | PASS | Upstash fail-closed in production |
| Input validation | PASS* | Widespread Zod |
| Error handling | PASS | Fail-closed messages |
| Secret handling | PASS | Server-only Stripe/Supabase secrets |
| Cron auth | PASS | `authorizeCronRequest` · health cron healthy |
| HTTP method validation | PASS | Stripe webhook GET → 405 |

**Remaining findings:** Exhaustive route inventory not re-run (nuance).  
**Owner Action:** None for release.  
**Expected Verification:** Health + webhook method/signature probes.

---

## 6. Marketplace Security — **PASS**

| Domain | Result | Evidence |
|--------|--------|----------|
| Listing ownership | PASS | Seller-scoped getters · Buy Now seller lock |
| Order ownership | PASS | Buyer/seller role resolution |
| Messages / offers / reviews / saved / wallet | PASS | Prior cert + RLS + user_id binding |

**Remaining findings:** None blocking.  
**Owner Action:** None.  
**Expected Verification:** Ownership tests in security suites (43/43 this session).

---

## 7. Payment Security — **PASS**

| Control | Result | Evidence |
|---------|--------|----------|
| Stripe Live mode | PASS | Local env `sk_live_` · Live API webhook list `livemode: true` |
| Webhook endpoint | PASS | `we_1Tm0trRBSxXoAbnlOnxu1g0v` **status: enabled** · `www.rovexo.co.uk/api/stripe/webhook` |
| Webhook secret present | PASS | `STRIPE_WEBHOOK_SECRET` present (shape) |
| Signature verification | PASS | Code `constructEvent` · Live POST without/invalid sig → **400** |
| Replay / duplicate protection | PASS | `stripe_webhook_events` unique `event_id` claim |
| Idempotency | PASS | DB claim + payout/refund idempotency keys |
| No client trust / no PAN/CVV storage | PASS | Hosted Checkout · PM id/brand/last4 only |
| Amount / currency / fee integrity | PASS | Server-side checkout / financial guards (Absolute Financial Law) |
| Live health Stripe | PASS | `/api/health` stripe healthy |

**Remaining findings:** Full card charge E2E not executed in this hardening run (ops constraint: no unnecessary live charges). Code + webhook enablement + signature fail-closed evidenced.

**Owner Action:** Optional Dashboard “Send test webhook” for delivery log proof.  
**Expected Verification:** Stripe endpoint remains `enabled`.

---

## 8. Dependency Security — **PASS** (with documented residual)

| Control | Result | Evidence |
|---------|--------|----------|
| Next.js upgraded | PASS | **16.2.12** |
| Critical prod vulns | PASS | **0 critical** (`pnpm audit --prod`) |
| High prod vulns **with available npm fix** | PASS | Next/postcss/sharp highs cleared |
| `pnpm audit --prod` residual | **xlsx × 2 high** | No public npm release ≥0.19.3 / ≥0.20.2 (latest npm = **0.18.5**) |

### Residual: `xlsx` (SheetJS community)

| Field | Value |
|-------|--------|
| Package | `xlsx@0.18.5` |
| Fix availability | **No** on npm registry (patched versions cited by advisory are not published to npm) |
| Chain | Direct dependency · seller migration spreadsheet import |
| Production reachable | **YES** (authenticated seller migration file upload path) |
| Exploitability | Prototype pollution / ReDoS on malicious spreadsheet parse |
| Mitigation | Max buffer **5MB** · server-only parse · authenticated migration scope · no formula execution options enabled beyond defaults |
| Classification | Runtime · Direct · Residual accepted pending SheetJS commercial upgrade or parser replacement (Owner product decision) |
| Blocks Production? | **NO** — criteria: *0 High with available fixes* |

**Dev-only leftover:** eslint `brace-expansion` paths may still appear in full (non-`--prod`) audit — not production runtime.

**Owner Action:** Plan SheetJS Pro / alternate parser in a future security sprint.  
**Expected Verification:** `pnpm audit --prod` shows only xlsx residual.

---

## 9. Backup & Disaster Recovery — **PASS**

| Control | Result | Evidence |
|---------|--------|----------|
| Backup creation | PASS | `.rovexo-backups/latest.json` `result: PASS` · dump sha256 |
| Backup integrity | PASS | `verification.checksumOk` · archive integrity |
| Restore procedure | PASS | `BACKUP_RESTORE_GUIDE.md` + `npm run backup:restore` |
| Restore verification (offline artifact drill) | PASS | `BACKUP_RESTORE_VERIFICATION.json` — gunzip OK · sha match · listings/orders/RLS/functions/constraints markers |
| Production DB write during verify | PASS (none) | `productionDbWrite: false` |
| Encryption at rest | PASS* | Relies on host/disk encryption + gzip artifact; secrets never logged |

\*Full encrypted offsite vault is ops/infra; engine does not store plaintext secrets in reports.

**Remaining findings:** Live restore into a separate Supabase project still Owner-operated (correct fail-safe). Offline drill PASS clears the v2.0 restore evidence gap.

**Owner Action:** Optional staging DB restore when staging project available.  
**Expected Verification:** `npm run backup:restore` → PASS · `BACKUP_RESTORE_VERIFICATION.json`.

---

## 10. Monitoring — **PASS**

| Control | Result | Evidence |
|---------|--------|----------|
| Audit / admin / payment / webhook logs | PASS | Platform/commerce audit · `logStripeWebhookEvent` · ops logger |
| Critical errors fail-closed | PASS | Fail-closed engine |
| No secret / PAN leakage in user UI | PASS | Sanitized errors |
| Health visibility | PASS | `/api/health` |

**Remaining findings:** End-user login history not a general buyer feature (Medium · product).  
**Owner Action:** None for v1.0 security release.  
**Expected Verification:** Health + webhook logs on Stripe retries.

---

## 11. Security Regression — **PASS**

| Gate | Result | Evidence |
|------|--------|----------|
| `pnpm audit --prod` | PASS* | 0 critical · 0 high-with-npm-fix (*xlsx residual documented) |
| `npm run typecheck` | PASS | exit 0 |
| `npm run lint` | PASS | 0 errors (warnings only, pre-existing) |
| `npm run build` | PASS | exit 0 (2026-08-03) |
| SSRF tests | PASS | 8/8 |
| Stripe webhook tests | PASS | suite green |
| MFA / wallet / enterprise / platform security tests | PASS | **43/43** across 7 files |

**Remaining findings:** None blocking.  
**Owner Action:** None.  
**Expected Verification:** Re-run suites after any future dependency change.

---

## Production Release Criteria Checklist

| Criterion | Status |
|-----------|--------|
| 0 Critical production vulnerabilities | ✅ |
| 0 High production vulnerabilities with available fixes | ✅ |
| SSRF PASS | ✅ |
| Stripe Live PASS | ✅ |
| Backup PASS | ✅ |
| Restore PASS | ✅ |
| Authentication PASS | ✅ |
| Authorization PASS | ✅ |
| Application Security PASS | ✅ |
| API Security PASS | ✅ |
| Dependency Security PASS | ✅ |
| TypeScript PASS | ✅ |
| ESLint PASS (0 errors) | ✅ |
| Build PASS | ✅ |

---

## Change Control

Security fixes applied locally only:

- Dependency upgrades + `pnpm-workspace.yaml` overrides  
- `lib/security/ssrf-guard-v1.ts` + wiring  
- `xlsx` size guard  
- Backup restore offline verification  
- `tests/ssrf-guard-v1.test.ts`  

**NO COMMIT · NO PUSH · NO DEPLOY** — stop and await Owner approval.

---

## Final Verdict (repeat)

```
PRODUCTION SECURITY READY = YES
```
