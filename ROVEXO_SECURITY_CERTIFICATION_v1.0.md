# ROVEXO_SECURITY_CERTIFICATION_v1.0.md

**STATUS:** SECURITY CERTIFICATION · EVIDENCE ONLY · SECURITY FREEZE  
**DATE:** 2026-08-03  
**SCOPE:** Complete security posture (Parts 1–12)  
**CONSTRAINTS:** NO feature changes · NO commits · NO pushes · NO deployments · NO refactoring  
**CODE CHANGES:** NONE (critical findings documented for Owner action only)  
**OFFICIAL HOST:** `https://www.rovexo.co.uk`  
**SUPABASE:** `pklotmwxtnnepaitedic.supabase.co`

---

## Overall Verdict

```
PRODUCTION SECURITY READY = NO
Overall Security Score = 68 / 100
```

Blocking FAILs (any one is enough to deny Production Security Ready):

1. **OAuth Google / Apple / Facebook** — Supabase providers not enabled (`400 validation_failed`).
2. **Dependency CVEs** — `npm audit` reports **8 high** issues including **Next.js 16.2.9** (fixed in ≥16.2.11) and **xlsx** (no fix).
3. **Stripe live webhook** — previously certified **disabled** (`PRODUCTION_OPERATIONS_CERTIFICATION.md`).
4. **SSRF gap** — server-side image `fetch(url)` without private-IP / metadata blocking.
5. **Live header probe this session** — agent `curl` to www returned **HTTP 403** (bot protection); header PASS relies on code + prior ops cert, not fresh live capture.

---

## Scorecard

| Domain | Score | Verdict |
|--------|------:|---------|
| Infrastructure | **78** | PARTIAL |
| Authentication | **58** | FAIL |
| Authorization | **88** | PASS* |
| Application Security | **64** | PARTIAL |
| API Security | **82** | PASS* |
| Marketplace Security | **90** | PASS |
| Payment Security | **72** | PARTIAL |
| Data Protection | **76** | PARTIAL |
| Monitoring | **70** | PARTIAL |
| Dependency Security | **32** | FAIL |
| Performance & Resilience | **92** | PASS |
| Penetration Test (static) | **55** | FAIL |
| **OVERALL** | **68** | **FAIL** |

\*PASS with documented nuances (not deploy blockers by themselves).

---

## PART 1 — Infrastructure Security

**Score: 78 · PARTIAL**

| Control | Result | Evidence |
|---------|--------|----------|
| HTTPS / TLS | **PASS** | Prior ops cert: Let's Encrypt on `www.rovexo.co.uk`, valid window documented; apex → www 308 |
| HSTS | **PASS** (code + prior live) | `lib/ops/security-headers.ts`: `max-age=63072000; includeSubDomains; preload` in production; ops cert live HSTS PASS |
| CSP | **PASS** (code) | `PRODUCTION_CSP` in `lib/ops/security-headers.ts`; wired via `next.config.ts` `headers()` |
| X-Frame-Options | **PASS** | `DENY` |
| X-Content-Type-Options | **PASS** | `nosniff` |
| Referrer-Policy | **PASS** | `strict-origin-when-cross-origin` |
| Permissions-Policy | **PASS** | `camera=(self), microphone=(), geolocation=(self)` |
| Cookies Secure/HttpOnly/SameSite | **PASS** | `lib/auth/session-cookies.ts`: `httpOnly: true`, `secure` in production, `sameSite: "lax"` |
| DNS | **PASS** (prior) | Ops cert SPF/DKIM/MX evidence |
| ENV / secrets pattern | **PASS** | `.env.example` placeholders; service role documented server-only in `lib/supabase/admin.ts` |
| Live header probe (this session) | **FAIL / BLOCKED** | `curl -sI https://www.rovexo.co.uk/` → **HTTP 403 Forbidden** |
| CSP strictness | **WARNING** | CSP allows `'unsafe-inline'` and `'unsafe-eval'` for scripts |

### FAIL / WARNING detail

**F1.1 Live header re-verification blocked**  
- Evidence: Agent HTTP HEAD → 403  
- Risk: Cannot re-prove headers from this environment today  
- Severity: **Medium**  
- Owner Action: From trusted network / browser DevTools, confirm HSTS/CSP/XFO on `https://www.rovexo.co.uk/`  
- Expected Verification: Response includes HSTS + CSP + X-Frame-Options DENY  

**F1.2 CSP unsafe-inline / unsafe-eval**  
- Evidence: `PRODUCTION_CSP` script-src includes `'unsafe-inline' 'unsafe-eval'`  
- Risk: Weakens XSS mitigation  
- Severity: **Medium**  
- Owner Action: Plan nonce/hash-based CSP (future security sprint; freeze forbids now)  
- Expected Verification: CSP without unsafe-eval on production  

---

## PART 2 — Authentication

**Score: 58 · FAIL**

| Control | Result | Evidence |
|---------|--------|----------|
| Email Login / Register | **PASS** | `lib/auth/auth-senior-audit-v1.ts` · `lib/auth/actions.ts` |
| Remember Me / Forgot Password | **PASS** | Auth senior audit |
| Cookie / Session / Callback | **PASS** | Supabase SSR + middleware refresh |
| Google OAuth | **FAIL** | Ops + golden law: `provider is not enabled` · HTTP 400 |
| Apple OAuth | **FAIL** | Same |
| Facebook OAuth | **FAIL** | Same |
| JWT / Refresh (Supabase) | **PASS** | Supabase-managed; middleware session refresh |
| Session expiration | **PASS** | Supabase session + cookie maxAge for Remember Me |
| Logout other devices | **PASS** | `app/api/account/sessions` · `signOut({ scope: "others" })` |
| MFA (email TOTP) | **PASS** (impl + live email cert) | `lib/auth/mfa/*` · `MFA_LIVE_CERTIFICATION.md` |
| Recovery Codes | **PASS** | `lib/auth/mfa/recovery-codes.ts` (hashed) |
| AAL enforcement | **PASS** | Middleware AAL1→challenge · API 403 `mfa_required` |
| Device sessions list | **PASS** | Account sessions API |
| Google MFA path | **FAIL** | `GOOGLE_MFA_LIVE_CERTIFICATION.md` |

### FAIL detail

**F2.1 OAuth providers disabled**  
- Evidence: `lib/auth/oauth-configuration-golden-law-v1.ts` · `PRODUCTION_OPERATIONS_CERTIFICATION.md` authorize probe 400  
- Risk: Social login unavailable; deploy gate NO DEPLOY  
- Severity: **Critical** (release gate)  
- Owner Action: Enable Google · Apple · Facebook in Supabase Auth; allowlist `https://www.rovexo.co.uk/auth/callback` (+ localhost); save; retest  
- Expected Verification: Authorize endpoints return redirect to IdP, not 400  

**F2.2 Google MFA certification incomplete**  
- Evidence: Google MFA live certification FAIL docs  
- Risk: Social + MFA path not production-proven  
- Severity: **High**  
- Owner Action: Complete Google MFA live verification after OAuth enablement  
- Expected Verification: Google sign-in + AAL2 challenge PASS on www  

---

## PART 3 — Authorization

**Score: 88 · PASS (nuance)**

| Control | Result | Evidence |
|---------|--------|----------|
| RBAC Admin / Super Admin | **PASS** | `lib/auth/roles.ts` · `requireApiSuperAdmin` · middleware `/api/super-admin` |
| Buyer / Seller least privilege | **PASS** | Order/listing APIs scope by `auth.user.id` |
| Supabase RLS | **PASS** | `20250618000002_rls_policies.sql` · listings/orders/messages/wallets |
| Storage policies | **PASS** | `20250618000003_storage.sql` folder = `auth.uid()` |
| IDOR controls (sampled) | **PASS** | Listing seller ownership · order role · upload path prefix |
| `is_admin()` vs `super_admin` | **WARNING** | SQL `is_admin()` checks `role = 'admin'` only |

### WARNING detail

**W3.1 RLS `is_admin()` may exclude `super_admin`**  
- Evidence: foundation schema admin helper  
- Risk: Super-admin user-scoped client may fail RLS where only `is_admin()` grants  
- Severity: **Low** (app often uses service role for super-admin)  
- Owner Action: Confirm dashboard/admin paths use intended client; optionally extend SQL helper  
- Expected Verification: Super-admin critical ops succeed without unintended RLS denials  

---

## PART 4 — Application Security

**Score: 64 · PARTIAL**

| Control | Result | Evidence |
|---------|--------|----------|
| SQL Injection | **PASS** | Supabase query builder / RPC; no raw concatenated SQL found in app TS |
| XSS | **PARTIAL** | `SafeImage` · sanitize helpers; CSP + residual `dangerouslySetInnerHTML` JSON-LD |
| CSRF | **PARTIAL** | `lib/api/csrf-guard.ts` on super-admin/staff paths; not global on all mutations |
| SSRF | **FAIL** | `lib/seller/migration/images/downloader.ts` `fetch(url)` · http/https only |
| Command Injection | **PASS** (no evidence of shell exec on user input in app routes) | Static review |
| Path Traversal (uploads) | **PASS** | Path must start with `${userId}/` |
| Open Redirect | **PASS** | `sanitizeNextPath` blocks `//` |
| Clickjacking | **PASS** | XFO DENY + CSP `frame-ancestors 'none'` |
| File Upload Abuse | **PASS** | MIME allowlist + size limits |
| Mass Assignment | **PARTIAL** | Zod/parsing on many routes; not proven for every handler |
| Prototype Pollution | **WARNING** | `xlsx` advisory GHSA-4r6h-8v6p-xvw6 |
| Sensitive Data Exposure | **PARTIAL** | Fail-closed sanitize; staff PII encrypt; timing logs exist |

### FAIL detail

**F4.1 SSRF — server URL fetch**  
- Evidence: `downloadImageBuffer(url)` → unrestricted `fetch` after scheme check  
- Risk: Server can be induced to hit internal/metadata endpoints  
- Severity: **High**  
- Owner Action: Block private/link-local/metadata IPs + DNS rebinding controls before allow fetch  
- Expected Verification: Localhost / 169.254.169.254 / RFC1918 URLs rejected  

**F4.2 CSRF not universal**  
- Evidence: CSRF guard not applied to all cookie-authenticated POSTs  
- Risk: Cross-site state change if browser sends session cookie  
- Severity: **Medium**  
- Owner Action: Extend Origin/Referer guard to all mutating authenticated APIs  
- Expected Verification: Cross-origin POST without allowed Origin → 403  

---

## PART 5 — API Security

**Score: 82 · PASS***

| Control | Result | Evidence |
|---------|--------|----------|
| JWT / session validation | **PASS** | `requireApiAuth` / Supabase `getUser()` |
| Authorization helpers | **PASS** | `requireApiRole` / super-admin |
| Rate limiting | **PASS** | `lib/api/rate-limit.ts` · Upstash fail-closed in production |
| Input validation | **PARTIAL** | Widespread Zod; not 100% inventory-proven |
| Error handling | **PASS** | `toUserSafeFailClosedMessage` |
| Cron secrets | **PASS** | `authorizeCronRequest` / `CRON_SECRET` |
| Full route auth coverage | **UNKNOWN** | Pattern present; exhaustive inventory not executed this session |

---

## PART 6 — Marketplace Security

**Score: 90 · PASS**

| Ownership domain | Result | Evidence sample |
|------------------|--------|-----------------|
| Listing | **PASS** | `getSellerListingById(auth.user.id, id)` |
| Order | **PASS** | `resolveOrderViewRole` buyer/seller |
| Conversation / messages | **PASS** | Participant RLS + user-scoped list |
| Wallet | **PASS** | User-scoped bank/wallet APIs + RLS |
| Favourites (Saved) | **PASS** | `saveItem(auth.user.id, …)` |
| Follow | **PASS** | `followUser(auth.user.id, …)` |
| Review | **PASS** | Buyer/seller order binding |
| Offer | **PASS** | Accept/counter actor checks |
| Notification | **PASS** | `.eq("user_id", userId)` |

---

## PART 7 — Payment Security

**Score: 72 · PARTIAL**

| Control | Result | Evidence |
|---------|--------|----------|
| Stripe integration (code) | **PASS** | Checkout / webhook handlers |
| No card PAN storage | **PASS** | PM id + brand/last4 only (`lib/payments/repository.ts`) |
| Webhook signature validation (code) | **PASS** | `constructEvent` · missing/invalid → 400 |
| Live webhook enabled | **FAIL** | Ops cert: endpoint `status: "disabled"` |
| Payment method ownership | **PASS** | User-scoped list/delete |
| Refund ownership | **PARTIAL** | Super-admin grant path (not buyer self-service) |

### FAIL detail

**F7.1 Stripe webhook disabled in live**  
- Evidence: `PRODUCTION_OPERATIONS_CERTIFICATION.md` Stripe API webhook status disabled  
- Risk: Missed payment events · escrow/order desync  
- Severity: **Critical**  
- Owner Action: Enable live webhook endpoint; point to canonical www URL; deliver test event  
- Expected Verification: Stripe Dashboard status `enabled` · signed test event 200  

---

## PART 8 — Data Security

**Score: 76 · PARTIAL**

| Control | Result | Evidence |
|---------|--------|----------|
| Password handling | **PASS** | Supabase Auth only |
| Staff PII encryption | **PASS** | AES-256-GCM `lib/staff-profile/encryption.ts` |
| Secret storage pattern | **PASS** | Env vars · `.env.example` placeholders |
| Database backups | **FAIL / UNKNOWN** | Ops cert: no runtime evidence PITR/daily backups enabled |
| Storage permissions | **PASS** | RLS folder ownership |
| PII exposure controls | **PARTIAL** | Mask/redact helpers; fail-closed UI |

### FAIL detail

**F8.1 Backup / PITR evidence missing**  
- Evidence: Ops certification backups PENDING  
- Risk: Unrecoverable data loss  
- Severity: **High**  
- Owner Action: Enable Supabase backups/PITR; document restore drill  
- Expected Verification: Dashboard backup enabled + successful restore test note  

---

## PART 9 — Monitoring

**Score: 70 · PARTIAL**

| Control | Result | Evidence |
|---------|--------|----------|
| Platform / commerce audit logs | **PASS** | `platform_audit_logs` · `commerce_audit_logs` · super-admin audit |
| Staff login history | **PASS** | `staff_login_events` (masked IP) |
| End-user login history | **FAIL** | Not found as general-user feature |
| Error logging / fail-closed | **PASS** | Fail-closed sanitize + ops logging patterns |
| Incident visibility | **PARTIAL** | Super Admin audit UI; no full SOC pipeline evidenced |

### FAIL detail

**F9.1 No end-user login history**  
- Evidence: Staff-only login history store  
- Risk: Account takeover forensics limited for buyers/sellers  
- Severity: **Medium**  
- Owner Action: Product decision + implementation (future; freeze forbids now)  
- Expected Verification: User can view recent logins / Owner can query auth events  

---

## PART 10 — Dependency Security

**Score: 32 · FAIL**

| Control | Result | Evidence |
|---------|--------|----------|
| `npm audit` | **FAIL** | **8 high** severity vulnerabilities (2026-08-03) |
| Next.js version | **FAIL** | Installed **16.2.9**; advisories require **≥16.2.11** (middleware bypass, DoS, SSRF, cache confusion) |
| `xlsx` | **FAIL** | Prototype pollution / ReDoS · **no fix available** |
| `postcss` / `@tailwindcss/postcss` | **FAIL** | High advisories · fix via upgrade path |
| `sharp` | **FAIL** | High · libvips CVEs · upgrade path |
| `brace-expansion` / `js-yaml` | **FAIL** | High transitive DoS |
| Typecheck / Lint (repo health) | **PASS** | `tsc --noEmit` exit 0 · ESLint 0 errors |

### FAIL detail

**F10.1 Next.js high CVEs**  
- Evidence: `npm audit` GHSA-6gpp-xcg3-4w24 (middleware bypass), GHSA-m99w-x7hq-7vfj, GHSA-89xv-2m56-2m9x, others · package.json `next: 16.2.9`  
- Risk: Auth middleware bypass / DoS / SSRF class issues  
- Severity: **Critical**  
- Owner Action: Upgrade Next to **≥16.2.11** (audit suggests 16.2.12), retest middleware + build  
- Expected Verification: `npm audit` clear of Next advisories · smoke auth middleware  

**F10.2 xlsx unfixed highs**  
- Evidence: GHSA-4r6h-8v6p-xvw6 · GHSA-5pgg-2g8v-p4x9 · no fix  
- Risk: Prototype pollution / ReDoS if untrusted spreadsheets parsed  
- Severity: **High**  
- Owner Action: Isolate/remove `xlsx` or replace with maintained parser; never parse untrusted uploads  
- Expected Verification: Dependency removed or sandboxed with threat model note  

---

## PART 11 — Performance & Resilience

**Score: 92 · PASS**

| Control | Result | Evidence |
|---------|--------|----------|
| TypeScript | **PASS** | `npm run typecheck` exit 0 (this session) |
| ESLint | **PASS** | 0 errors · 30 warnings (this session) |
| Production Build | **PASS** | `npm run build` exit 0 (2026-08-03 V6 validation run) |
| Fail-closed UI | **PASS** | FailClosed engine · White Screen kill laws |
| Unhandled exceptions (policy) | **PASS** | Fail-closed sanitize mandated |

---

## PART 12 — Penetration Test (static / evidence resistance)

**Score: 55 · FAIL**  
*(No production code modified. No live destructive exploit execution against production wallets.)*

| Attack class | Resistance | Evidence basis |
|--------------|------------|----------------|
| SQL Injection | **PASS** | Parameterized Supabase client |
| XSS | **PARTIAL** | SafeImage + CSP + sanitize; unsafe-inline CSP |
| CSRF | **PARTIAL** | Not global |
| JWT manipulation | **PASS** | Supabase validates session; app uses `getUser()` |
| Cookie flags | **PASS** | HttpOnly + Secure(prod) + SameSite=Lax |
| Session fixation / hijack | **PARTIAL** | Supabase rotation; logout-others exists; no full antitheft suite evidenced |
| Broken Access Control / IDOR | **PASS** (sampled) | Ownership filters + RLS |
| Privilege escalation | **PASS** (sampled) | Super-admin middleware gate |
| OAuth abuse | **FAIL** | Providers disabled / uncertified |
| MFA bypass | **PASS** (email path) | AAL middleware; Google path FAIL |
| Rate-limit bypass | **PARTIAL** | Fail-closed without Upstash in prod; memory fallback risk if misconfigured |
| API abuse | **PARTIAL** | Rate limits present |
| Direct Object Reference | **PASS** (sampled) | User-id scoping |

### FAIL detail

**F12.1 Cannot claim full pen-test PASS**  
- Evidence: OAuth FAIL · SSRF FAIL · dependency Critical/High · CSRF partial · live www HEAD 403 this session  
- Risk: Over-certifying would violate “evidence only”  
- Severity: **High** (certification integrity)  
- Owner Action: Remediate blockers F2.1, F7.1, F10.1, F4.1 then re-run authorized pen-test  
- Expected Verification: Re-cert score ≥90 with zero Critical/High open  

---

## Exact Owner Action List (priority)

| # | Severity | Action |
|---|----------|--------|
| 1 | Critical | Enable Supabase Google / Apple / Facebook + callback allowlist; retest OAuth |
| 2 | Critical | Enable live Stripe webhook; verify signed delivery |
| 3 | Critical | Upgrade Next.js to ≥16.2.11 / 16.2.12; re-audit |
| 4 | High | Remediate SSRF on server image download |
| 5 | High | Resolve `xlsx` / postcss / sharp highs or isolate usage |
| 6 | High | Prove Supabase backups / PITR + restore drill |
| 7 | Medium | Global CSRF Origin guard on mutating APIs |
| 8 | Medium | Re-verify live security headers from trusted client (agent got 403) |
| 9 | Medium | Complete Google MFA live certification after OAuth |
| 10 | Low | Align RLS `is_admin()` with `super_admin` if required |

---

## Final Statement

```text
ROVEXO SECURITY CERTIFICATION v1.0 = FAIL
OVERALL SCORE = 68 / 100
PRODUCTION SECURITY READY = NO
SECURITY FREEZE = ACTIVE
NO COMMITS · NO PUSHES · NO DEPLOYS · NO FEATURE CHANGES
```

Marketplace ownership, email auth core, RLS/storage samples, Stripe signature code, rate-limit fail-closed, and TypeScript/ESLint/build health are strong.  
Production Security Ready remains **NO** until OAuth, live webhook, dependency Critical/Highs, and SSRF are remediated and re-evidenced.
