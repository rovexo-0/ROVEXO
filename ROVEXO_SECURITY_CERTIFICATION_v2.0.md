# ROVEXO_SECURITY_CERTIFICATION_v2.0.md

**STATUS:** PRODUCTION SECURITY CERTIFICATION · V1.0 RELEASE SCOPE · EVIDENCE ONLY  
**DATE:** 2026-08-03  
**PARENT:** `ROVEXO_SECURITY_CERTIFICATION_v1.0.md`  
**SECURITY FREEZE:** ACTIVE  
**CONSTRAINTS:** NO feature additions · NO UI changes · NO business logic · NO refactoring · NO commits · NO pushes · NO deployments  
**CODE CHANGES:** NONE  
**OFFICIAL HOST:** `https://www.rovexo.co.uk`  
**SUPABASE:** `pklotmwxtnnepaitedic.supabase.co`

---

## V1.0 Release Scope (Owner)

| In scope (must PASS) | Out of scope (must not FAIL cert) |
|----------------------|-----------------------------------|
| Email Authentication | Apple OAuth → **N/A — Planned for v2.0** |
| Google OAuth | Facebook OAuth → **N/A — Planned for v2.0** |
| MFA (TOTP) | |
| Recovery Codes | |
| Session Management | |
| Buy / Sell Marketplace | |
| Stripe Payments **if** Live is part of v1.0 launch | |

---

## Overall Verdict

```
PRODUCTION SECURITY READY = NO
Overall Security Score = 71 / 100
```

### Blocking FAILs (v1.0 scope)

1. **Dependencies** — Next.js **16.2.9** (requires ≥16.2.11); `npm audit --omit=dev` reports **5 high** (Next/postcss/sharp/xlsx).
2. **SSRF** — `lib/seller/migration/images/downloader.ts` server `fetch(url)` with scheme check only; no private/metadata allowlist / redirect validation.
3. **Payment Security** — Stripe Live is in v1.0 launch scope; live webhook previously certified **disabled**; this session Stripe webhook list returned **0** endpoints for configured secret key.
4. **Backup restoration** — Backup **creation** + dump **integrity** evidenced PASS; **restoration drill** not evidenced.

### Resolved vs v1.0 cert (do not re-fail)

| Item | v1.0 | v2.0 |
|------|------|------|
| Google OAuth provider | FAIL (400 not enabled) | **PASS** — live authorize → **HTTP 302** → `accounts.google.com` (2026-08-03) |
| Apple / Facebook OAuth | FAIL | **N/A — Planned for v2.0** (live still HTTP 400; excluded from score) |
| Live security headers | Agent 403 without UA | **PASS** — HEAD with browser UA returns HSTS/CSP/XFO/XCTO/Referrer/Permissions-Policy |

---

## Scorecard (v1.0 scope)

| Domain | Score | Verdict |
|--------|------:|---------|
| 1. Infrastructure | **92** | **PASS** |
| 2. Authentication | **90** | **PASS** |
| 3. Authorization | **88** | **PASS** |
| 4. Marketplace Ownership | **90** | **PASS** |
| 5. Application Security | **58** | **FAIL** |
| 6. API Security | **84** | **PASS** |
| 7. Payment Security | **48** | **FAIL** |
| 8. Dependencies | **28** | **FAIL** |
| 9. SSRF (explicit gate) | **20** | **FAIL** |
| 10. Backup | **55** | **FAIL** |
| Apple OAuth | — | **N/A (Planned v2.0)** |
| Facebook OAuth | — | **N/A (Planned v2.0)** |
| **OVERALL** | **71** | **NO** |

---

## 1. Infrastructure — PASS (92)

| Control | Result | Evidence |
|---------|--------|----------|
| HTTPS / TLS | **PASS** | `PRODUCTION_OPERATIONS_CERTIFICATION.md` Let's Encrypt on `www.rovexo.co.uk`; apex → www |
| Live health | **PASS** | `GET https://www.rovexo.co.uk/api/health` → overall `healthy` (api, database, storage, authentication, stripe, redis, cron, email) |
| HSTS | **PASS** | Live HEAD (browser UA): `strict-transport-security: max-age=63072000; includeSubDomains; preload` |
| CSP | **PASS** | Live HEAD: full `content-security-policy` present |
| X-Frame-Options | **PASS** | Live: `DENY` |
| X-Content-Type-Options | **PASS** | Live: `nosniff` |
| Referrer-Policy | **PASS** | Live: `strict-origin-when-cross-origin` |
| Permissions-Policy | **PASS** | Live: `camera=(self), microphone=(), geolocation=(self)` |
| Cookies Secure/HttpOnly/SameSite | **PASS** | `lib/auth/session-cookies.ts` |
| ENV / secrets pattern | **PASS** | `.env.example` placeholders; service role server-only |

### WARNING (non-blocking)

**W1.1 CSP `unsafe-inline` / `unsafe-eval`**  
- Evidence: Live CSP `script-src` includes `'unsafe-inline' 'unsafe-eval'`  
- Risk: Weakens XSS mitigation  
- Severity: **Medium**  
- Owner Action: Future nonce/hash CSP (security freeze forbids change now)  
- Expected Verification: Production CSP without `unsafe-eval`

---

## 2. Authentication — PASS (90)

| Control | Result | Evidence |
|---------|--------|----------|
| Email Login / Register | **PASS** | Auth senior audit · MFA live email path |
| Session Management | **PASS** | Supabase SSR + middleware refresh · device sessions API |
| Google OAuth (provider) | **PASS** | `GET …/auth/v1/authorize?provider=google&redirect_to=https://www.rovexo.co.uk/auth/callback` → **HTTP 302** · `Location: https://accounts.google.com/o/oauth2/v2/auth?client_id=301861992363-…` (2026-08-03) |
| MFA (TOTP) | **PASS** | `MFA_LIVE_CERTIFICATION.md` email path **29/29** · enroll/challenge/AAL2 |
| Recovery Codes | **PASS** | Same cert · 10 hashed codes · single-use path |
| Apple OAuth | **N/A (Planned v2.0)** | Live authorize still **HTTP 400** — **excluded from FAIL** per Owner v1.0 scope |
| Facebook OAuth | **N/A (Planned v2.0)** | Live authorize still **HTTP 400** — **excluded from FAIL** per Owner v1.0 scope |

### WARNING (non-blocking for provider enablement)

**W2.1 Google + MFA interactive E2E not re-proven on www**  
- Evidence: `GOOGLE_MFA_LIVE_CERTIFICATION.md` still documents missing Owner interactive Google session + MFA/recovery on that identity (`googleUserCount: 0` at that cert date)  
- Risk: Google users with MFA enrolled may not be Owner-proven on production path  
- Severity: **Medium**  
- Owner Action: Complete one Google login → MFA/recovery drill on `https://www.rovexo.co.uk`  
- Expected Verification: Google session → `/login/mfa` → AAL2 → logout evidence  

**Note:** Locked SSOT `lib/auth/oauth-configuration-golden-law-v1.ts` still hard-codes `GOOGLE: false` / `APPLE: false` / `FACEBOOK: false`. Live Google authorize contradicts that frozen snapshot — **runtime evidence wins** for this certification; update golden-law flags only when Owner authorizes a config snapshot refresh (not done in this evidence-only run).

---

## 3. Authorization — PASS (88)

| Control | Result | Evidence |
|---------|--------|----------|
| Admin / Super Admin | **PASS** | `lib/auth/roles.ts` · `requireApiSuperAdmin` |
| Buyer / Seller least privilege | **PASS** | Order/listing APIs scoped by authenticated user id |
| Supabase RLS | **PASS** | Foundation RLS migrations · listings/orders/messages/wallets |
| Storage policies | **PASS** | Upload path folder = `auth.uid()` |
| IDOR controls (sampled) | **PASS** | Listing seller ownership · order role resolution |

### WARNING

**W3.1 RLS `is_admin()` may exclude `super_admin`**  
- Evidence: SQL helper checks `role = 'admin'` only  
- Risk: Edge RLS denials for super-admin user-scoped client  
- Severity: **Low**  
- Owner Action: Confirm intended clients for admin ops  
- Expected Verification: Super-admin critical ops succeed as designed  

---

## 4. Marketplace Ownership — PASS (90)

| Domain | Result | Evidence sample |
|--------|--------|-----------------|
| Listing | **PASS** | Seller-scoped listing getters · Buy Now seller_id lock |
| Order | **PASS** | Buyer/seller role resolution |
| Conversation / messages | **PASS** | Participant RLS + user-scoped list |
| Wallet | **PASS** | User-scoped wallet/bank APIs + RLS |
| Saved | **PASS** | `saveItem(auth.user.id, …)` |
| Follow / Offer / Review / Notification | **PASS** | Actor / user_id binding (prior cert + code patterns) |

---

## 5. Application Security — FAIL (58)

| Control | Result | Evidence |
|---------|--------|----------|
| SQL Injection | **PASS** | Query builder / RPC; no raw concat SQL in app TS |
| XSS | **PARTIAL** | `SafeImage` · CSP; residual JSON-LD `dangerouslySetInnerHTML` |
| CSRF | **PARTIAL** | Guard on staff/super-admin paths; not universal |
| SSRF | **FAIL** | See §9 |
| Path Traversal (uploads) | **PASS** | Path prefix `${userId}/` |
| Open Redirect | **PASS** | `sanitizeNextPath` |
| Clickjacking | **PASS** | XFO DENY + CSP `frame-ancestors 'none'` |
| File Upload | **PASS** | MIME allowlist + size limits |

### FAIL detail

**F5.1 SSRF — server URL fetch (same as §9)**  
- Evidence: `lib/seller/migration/images/downloader.ts` — `isValidImageUrl` = `http://`/`https://` only; `downloadImageBuffer` → `fetch(url)` with timeout; **no** private-IP/DNS/redirect allowlist  
- Risk: Server induced to contact internal/metadata endpoints  
- Severity: **High**  
- Owner Action: Block RFC1918 / link-local / metadata IPs; validate redirects; enforce allowlist before fetch  
- Expected Verification: `http://127.0.0.1`, `http://169.254.169.254`, private LAN URLs rejected  

**F5.2 CSRF not universal**  
- Evidence: `lib/api/csrf-guard.ts` not applied to all cookie-auth mutating routes  
- Risk: Cross-site state change via session cookie  
- Severity: **Medium**  
- Owner Action: Extend Origin/Referer guard (future; freeze forbids now)  
- Expected Verification: Cross-origin POST without allowed Origin → 403  

---

## 6. API Security — PASS (84)

| Control | Result | Evidence |
|---------|--------|----------|
| JWT / session validation | **PASS** | `requireApiAuth` / Supabase `getUser()` |
| Role helpers | **PASS** | `requireApiRole` / super-admin |
| Rate limiting | **PASS** | `lib/api/rate-limit.ts` · production fail-closed |
| Error handling | **PASS** | Fail-closed user-safe messages |
| Cron secrets | **PASS** | `authorizeCronRequest` / live health cron healthy |
| Input validation | **PARTIAL** | Widespread Zod; not exhaustive inventory this run |

---

## 7. Payment Security — FAIL (48)

**Launch scope decision:** Stripe Live **is** part of v1.0 launch (ops cert documents live keys, live account `charges_enabled`, product Hosted Checkout). Therefore Payments = **PASS/FAIL**, not N/A.

| Control | Result | Evidence |
|---------|--------|----------|
| Stripe integration (code) | **PASS** | Checkout + webhook handler patterns |
| No card PAN storage | **PASS** | PM id + brand/last4 only |
| Webhook signature validation (code) | **PASS** | `constructEvent` · invalid/missing → 400 |
| Live webhook **enabled** | **FAIL** | `PRODUCTION_OPERATIONS_CERTIFICATION.md`: endpoint `we_1Tm0trRBSxXoAbnlOnxu1g0v` `status: "disabled"` · URL apex `https://rovexo.co.uk/api/stripe/webhook` |
| Fresh webhook list (this session) | **FAIL / UNKNOWN continuity** | Stripe API `GET /v1/webhook_endpoints` with configured secret returned **`webhook_count: 0`** (2026-08-03) — either disabled/removed or account mismatch; **cannot** certify enabled delivery |
| Production health Stripe | **PASS** (API reachability) | Live health `stripe: healthy` |

### FAIL detail

**F7.1 Stripe Live webhook not enabled / not deliverable**  
- Evidence: Ops cert disabled status; this session webhook endpoint count **0**  
- Risk: Missed `checkout.session.completed` / payment lifecycle · escrow/order desync  
- Severity: **Critical**  
- Owner Action: In Stripe Live Dashboard — create/enable webhook at **`https://www.rovexo.co.uk/api/stripe/webhook`**; confirm signing secret matches Production `STRIPE_WEBHOOK_SECRET`; send Dashboard test event  
- Expected Verification: Endpoint `status: enabled` · signed test delivery **HTTP 200**  

---

## 8. Dependencies — FAIL (28)

| Control | Result | Evidence |
|---------|--------|----------|
| Next.js upgraded | **FAIL** | Installed **`next@16.2.9`** (`npm ls next`) · advisories require **≥16.2.11** (audit fix path → 16.2.12) |
| High CVEs resolved | **FAIL** | `npm audit --omit=dev` → **5 high** (2026-08-03) |
| High packages | **FAIL** | Next nested **postcss** (path traversal / source map) · **sharp** libvips CVEs · **xlsx** prototype pollution / ReDoS (**no fix**) |

### FAIL detail

**F8.1 Next.js below patched floor**  
- Evidence: `next@16.2.9`; audit recommends ≥16.2.11 / 16.2.12  
- Risk: Middleware bypass / DoS / SSRF / cache-class issues per advisories  
- Severity: **Critical**  
- Owner Action: Authorize dependency upgrade sprint → Next ≥16.2.11; rebuild; smoke auth middleware  
- Expected Verification: `npm ls next` ≥16.2.11 · Next-related audit highs cleared  

**F8.2 Remaining high CVEs (xlsx / sharp / postcss)**  
- Evidence: `npm audit --omit=dev` 5 highs including `xlsx` with **no fix available**  
- Risk: Prototype pollution / ReDoS / image pipeline CVEs if untrusted input reaches parsers  
- Severity: **High**  
- Owner Action: Upgrade force path where safe; isolate or remove `xlsx` if untrusted spreadsheets accepted  
- Expected Verification: Audit zeros highs or documented Owner risk acceptance with compensating controls  

---

## 9. SSRF — FAIL (20)

| Control | Result | Evidence |
|---------|--------|----------|
| Server-side fetch protected | **FAIL** | Unrestricted `fetch(url)` after scheme check |
| Allowlist enforced | **FAIL** | None in downloader |
| Private / internal networks blocked | **FAIL** | No RFC1918 / localhost / metadata checks |
| Redirect validation | **FAIL** | No redirect hop validation |

### FAIL detail

**F9.1 Migration image downloader SSRF**  
- Evidence: `lib/seller/migration/images/downloader.ts` lines — `fetch(url, { signal: AbortSignal.timeout(20_000) })`; `isValidImageUrl` only checks `http://` / `https://` prefix  
- Risk: SSRF to cloud metadata / internal services during seller migration image pull  
- Severity: **High**  
- Owner Action: Pre-resolve DNS; block private/link-local/metadata ranges; disallow insecure redirects; optional host allowlist  
- Expected Verification: Attempts to `127.0.0.1`, `10.x`, `169.254.169.254` fail closed before connect  

---

## 10. Backup — FAIL (55)

| Control | Result | Evidence |
|---------|--------|----------|
| Backup creation | **PASS** | `.rovexo-backups/latest.json` `result: "PASS"` · run `20260802-232248` · `backup-20260802-232248.sql.gz` (36132 bytes) |
| Integrity verification | **PASS** | `verification.check: "PASS"` · `archiveIntegrity: true` · `checksumOk: true` · sha256 recorded |
| Backup restoration | **FAIL** | `BACKUP_RESTORE_GUIDE.md` documents procedure; **no restore drill evidence** (staging restore + schema verify) in this certification |
| Supabase PITR / daily (ops) | **UNKNOWN / FAIL evidence** | `PRODUCTION_OPERATIONS_CERTIFICATION.md` — no runtime evidence PITR/daily enabled |

### FAIL detail

**F10.1 Restoration not proven**  
- Evidence: Creation + checksum PASS; restore path documented only  
- Risk: Backup exists but unproven recoverable  
- Severity: **High**  
- Owner Action: Run staging restore per `BACKUP_RESTORE_GUIDE.md`; record PASS artifact; confirm Supabase dashboard backups/PITR  
- Expected Verification: Staging DB restored · `scripts/verify-schema.sql` PASS · written restore evidence file  

---

## Final Score Summary

| Domain | Score |
|--------|------:|
| Infrastructure | 92 |
| Authentication | 90 |
| Authorization | 88 |
| Marketplace | 90 |
| Application | 58 |
| API | 84 |
| Payments | 48 |
| Dependencies | 28 |
| Backup | 55 |
| **Overall Security Score** | **71** |
| Apple OAuth | **N/A (Planned v2.0)** |
| Facebook OAuth | **N/A (Planned v2.0)** |

---

## Owner Action Priority (v1.0 blockers only)

| # | Severity | Action |
|---|----------|--------|
| 1 | Critical | Upgrade Next.js to ≥16.2.11 / 16.2.12; clear Next-related highs; re-audit |
| 2 | Critical | Enable Stripe Live webhook on `https://www.rovexo.co.uk/api/stripe/webhook`; prove signed delivery |
| 3 | High | SSRF-harden `lib/seller/migration/images/downloader.ts` |
| 4 | High | Execute + document backup **restore** drill; confirm Supabase backups/PITR |
| 5 | Medium | Owner Google + MFA interactive proof on www (optional hardening after provider PASS) |
| — | N/A | Apple / Facebook OAuth — **do not block v1.0**; scheduled v2.0 |

---

## Final Verdict

```
PRODUCTION SECURITY READY = NO
```

Evidence only. No code changes. No commits. No pushes. No deployments.
