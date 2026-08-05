# ROVEXO P11.1 — SECURITY HARDENING REPORT

**STATUS:** IMPLEMENTATION COMPLETE · VALIDATED · AWAITING OWNER APPROVAL  
**DATE:** 2026-08-05  
**PARENT AUDIT:** `ROVEXO_P11_SECURITY_IP_HARDENING_AUDIT.md`  
**RECERTIFICATION:** `ROVEXO_P11_1_SECURITY_RECERTIFICATION.md`  

**STRICT CONSTRAINTS HONOURED:** NO UI · NO CSS · NO marketplace feature changes · NO business-rule redesign · NO SEO · NO commits · NO push · NO deploy.

---

## Executive Summary

P11.1 implements **only** approved P11 audit findings. Critical access-control gaps on Marketplace OS and Orders/Messages UPDATE RLS are closed in application code and migration SSOT. High findings for CSP, CSRF, rate limiting, and health reconnaissance are mitigated with documented residuals. Dependency HIGH advisories remain **deferred** where upgrades are unsafe or regression-risking.

| Metric | Before (P11) | After (P11.1) |
|--------|--------------|---------------|
| Overall Security Score | **6.8 / 10** | **8.9 / 10** |
| Target ≥ 9.5 | — | **NOT MET** |
| Critical findings open | 2 | **0** (code); Orders RLS **ops-apply pending** |
| High findings open | 6 | **1 deferred** (deps) · **2 mitigated** (CSP/CSRF/rate residual) |
| Implementation verdict | — | **PASS** |
| Score-target verdict | — | **FAIL** (8.9 &lt; 9.5) |
| Production recommendation | CONDITIONAL | **CONDITIONAL** — harden ops apply + deps before “launch hardened” |

---

## Files Modified (P11.1 traceable)

### Phase A — Critical

| File | Audit ID | Change |
|------|----------|--------|
| `lib/marketplace-os/api-guard-v1.ts` | **C-01** | NEW — `requireMarketplaceOsAccess` (super_admin + rate limit + audit) |
| `app/api/marketplace-os/alerts/route.ts` | **C-01** | Gate all methods |
| `app/api/marketplace-os/health/route.ts` | **C-01** | Gate all methods |
| `app/api/marketplace-os/audit/route.ts` | **C-01** | Gate all methods |
| `app/api/marketplace-os/status/route.ts` | **C-01** | Gate all methods |
| `lib/supabase/middleware.ts` | **C-01** | Treat `/api/marketplace-os/` as super-admin API |
| `supabase/migrations/20260805010000_p11_1_orders_messages_update_least_privilege.sql` | **C-02** / **H-03** | Drop participant UPDATE; admin-only orders; sender-only messages |
| `lib/orders/store.ts` | **C-02** | Order status mutations via `createAdminClient()` after app authz |

### Phase B — High

| File | Audit ID | Change |
|------|----------|--------|
| `lib/ops/security-headers.ts` | **H-01** | Remove `'unsafe-eval'`; document residual `'unsafe-inline'` |
| `lib/auth/session.ts` | **H-02** | `requireApiAuth(request?)` / mutation CSRF path |
| `app/api/checkout/buy-now/route.ts` | **H-02** | CSRF-aware auth |
| `app/api/wallet/withdraw/route.ts` | **H-02** / **H-05** | CSRF + rate limit |
| `app/api/wallet/bank-account/route.ts` | **H-02** / **H-05** | CSRF + rate limit |
| `app/api/offers/route.ts` | **H-02** / **H-05** | Origin validation + rate limit |
| `app/api/offers/[id]/route.ts` | **H-02** / **H-05** | Origin validation + rate limit |
| `app/api/saved/route.ts` | **H-02** / **H-05** | CSRF + rate limit |
| `app/api/listings/route.ts` | **H-02** / **H-05** | Publish CSRF + rate |
| `app/api/listings/upload/route.ts` | **H-02** / **H-05** | Upload CSRF + rate |
| `app/api/sell/draft/route.ts` | **H-02** / **H-05** | Draft CSRF + rate |
| `app/api/listings/report/route.ts` | **H-02** / **H-05** | Report CSRF + rate |
| `app/api/users/report/route.ts` | **H-02** / **H-05** | Report CSRF + rate |
| `app/api/messages/[id]/route.ts` | **H-02** / **H-03** | CSRF; `senderRole` from `getViewerRole` (server-bound) |
| `app/api/admin/moderation/route.ts` | **H-05** | Admin rate limit |
| `app/api/health/route.ts` | **H-06** | Minimal public payload (no secret names) |
| `app/api/health/diagnostics/route.ts` | **H-06** | Super-admin only diagnostics |

### Tests

| File | Purpose |
|------|---------|
| `tests/p11-1-security-hardening.test.ts` | NEW — gate / RLS / CSP / health / CSRF / middleware contracts |
| `tests/enterprise-security-production.test.ts` | Align CSP expectations |
| `tests/health-bundle-optimization.test.ts` | Align public health shape |

### Dependencies (**H-04**)

| Action | Result |
|--------|--------|
| Evaluate Next.js advisory vs `16.2.12` | **DEFERRED** — still HIGH in `npm audit`; jump to newer major/minor not applied (regression risk) |
| sharp / xlsx / undici / postcss / js-yaml / brace-expansion / fast-xml-parser | **DEFERRED** — see Residual Dependencies |

---

## Resolved Findings

| ID | Finding | Resolution |
|----|---------|------------|
| **C-01** | Unauthenticated `/api/marketplace-os/*` | `requireMarketplaceOsAccess` → `requireApiSuperAdmin` + rate limit + audit; middleware classification. Anonymous → **401/403**. |
| **C-02** | Broad orders participant UPDATE RLS | Migration drops `orders_update_participant`; `orders_update_admin` (`is_admin()` only). App updates via service_role admin client after Commerce Engine authz. |
| **H-03** (partial → resolved) | Messages broad UPDATE + client `senderRole` | Migration `messages_update_sender`; API binds role server-side. |
| **H-06** | Health exposes `missingEnv` secret names | Public `/api/health` returns status/checks/latency only; diagnostics behind super_admin. |

---

## Mitigated Findings

| ID | Finding | Mitigation | Residual |
|----|---------|------------|----------|
| **H-01** | CSP `unsafe-inline` + `unsafe-eval` | **`unsafe-eval` removed**. Residual justifications exported as `CSP_RESIDUAL_JUSTIFICATIONS`. | `'unsafe-inline'` retained (Next + Stripe Elements). Nonce CSP = P2. |
| **H-02** | CSRF rarely wired | Wired on buy-now, wallet withdraw/bank, offers, saved, listings publish/upload, sell draft, reports, messages PATCH. | Not every cookie-auth mutation across ~599 routes. |
| **H-05** | Sparse rate limits | Expanded to MOS, offers, saved, bank, publish, upload, sell draft, reports, admin moderation (+ prior auth limits). | Endpoint-specific; not blanket coverage of all APIs. |

---

## Accepted Findings

| Item | Justification |
|------|---------------|
| CSP `script-src 'unsafe-inline'` | Next App Router + Stripe Elements inline bootstrap; nonce migration deferred to avoid checkout/UI break. |
| CSP `style-src 'unsafe-inline'` | Component/third-party widget styles without full nonce/hash program. |
| SameSite=Lax as complementary CSRF control | Remains defence-in-depth alongside Origin guard on high-value mutations. |

---

## Deferred Findings

| ID | Item | Why deferred | Next step |
|----|------|--------------|-----------|
| **H-04** | npm **8 HIGH** advisories | Safe/stable/regression-free upgrade path not verified for Next jump + sharp/xlsx/undici/postcss/js-yaml/brace-expansion/fast-xml-parser | Dedicated deps sprint + CI fail-on-high |
| Ops | Apply `20260805010000_p11_1_orders_messages_update_least_privilege.sql` to live Supabase | Repo-only until Owner/ops migrate | **Owner must run migration** before claiming DB RLS closed in production |
| P2 | Captcha on auth, WAF, markdown DOMPurify, COEP/CORP | Out of P11.1 “audit findings only” scope / speculative | Per original P11 plan |

---

## OWASP Mapping (post-hardening)

| OWASP | Status after P11.1 |
|-------|-------------------|
| **A01 Broken Access Control** | C-01 / C-02 / H-03 **RESOLVED** (migration apply pending for DB) |
| **A02 Cryptographic Failures** | Unchanged — TLS/cookie posture retained |
| **A03 Injection** | Improved (`unsafe-eval` gone); XSS residual via `unsafe-inline` **ACCEPTED** |
| **A04 Insecure Design** | CSRF **MITIGATED** on money/offer/sell/upload paths |
| **A05 Security Misconfiguration** | Health **RESOLVED**; CSP partial; deps **DEFERRED** |
| **A07 Auth Failures** | Existing auth rate limits retained; captcha still deferred |
| **A08 Software/Data Integrity** | Webhooks unchanged; dependency CVEs **DEFERRED** |
| **A09 Logging/Monitoring** | MOS access audit added |
| **A10 SSRF** | Unchanged (watch list) |

---

## Security Score (domain)

| Domain | P11 Before | P11.1 After | Delta |
|--------|------------|-------------|-------|
| Authentication | 8.0 | 8.0 | — |
| Authorization | 6.0 | **8.8** | +2.8 |
| API | 6.2 | **8.2** | +2.0 |
| Frontend | 6.5 | **7.5** | +1.0 |
| Backend | 7.2 | **8.2** | +1.0 |
| Infrastructure | 6.0 | **6.5** | +0.5 |
| Marketplace | 7.5 | **7.8** | +0.3 |
| IP Protection | 4.5 | 4.5 | — (out of scope) |
| Bot Protection | 5.5 | **7.0** | +1.5 |
| **Overall** | **6.8** | **8.9** | **+2.1** |

**Target ≥ 9.5:** FAIL (gap **0.6**). Closing gap requires: live RLS migration evidence · dependency HIGH reduction · CSP nonce or Owner-accepted residual scored as launch-hardened · broader CSRF/rate coverage.

---

## Risk Matrix (after)

| Risk | Likelihood | Impact | Residual rating |
|------|------------|--------|-----------------|
| MOS anonymous intel | Low | High | **Resolved** (code) |
| Participant order UPDATE via JWT | Low (after migrate) / Medium (before migrate) | Critical | **Resolved in repo · Ops pending** |
| XSS despite CSP | Medium | High | **Mitigated** (`eval` gone; inline accepted) |
| Cross-site cookie mutation | Low–Medium | High | **Mitigated** on critical paths |
| Dependency exploit (Next/sharp/xlsx) | Medium | High | **Deferred** |
| Auth/abuse flooding | Medium | Medium | **Mitigated** (expanded limits) |
| Health recon | Low | Low | **Resolved** |

---

## Regression Results (Phase C)

| Gate | Result |
|------|--------|
| TypeScript (`tsc --noEmit`) | **PASS** |
| ESLint (touched P11.1 paths) | **PASS** (0 errors) |
| Production Build (`npm run build`) | **PASS** |
| Vitest `tests/p11-1-security-hardening.test.ts` | **PASS** |
| Vitest enterprise-security + health + CSRF + buy-now + wallet suites | **PASS** (84 tests / 12 files in focused run) |
| UI / CSS / SEO / marketplace behaviour changes | **NONE intentional** |
| Auth / publish / checkout / wallet logic redesign | **NONE** (guards/wiring only) |

---

## Final Production Recommendation

| Question | Answer |
|----------|--------|
| Were Critical audit findings implemented? | **YES** (C-01 code; C-02 code + migration SSOT) |
| Score ≥ 9.5? | **NO** (8.9) |
| Commit / Push / Deploy authorized by this report? | **NO** — Owner approval required |
| Safe for increased public traffic vs P11 baseline? | **YES, after Owner applies Orders/Messages RLS migration** |
| Claim “Public launch hardened (9–10)”? | **NO** until deferred HIGH deps + score gap closed |

### Verdict

# **HARDENING IMPLEMENTATION: PASS**
# **SCORE TARGET (≥ 9.5): FAIL (8.9)**
# **PRODUCTION GATE: CONDITIONAL — WAIT FOR OWNER**

**STOP.** No commit · no push · no deploy until Owner approval.

---

## Owner checklist (ops, not code)

1. Apply migration `20260805010000_p11_1_orders_messages_update_least_privilege.sql` to Supabase.  
2. Smoke: unauthenticated `GET /api/marketplace-os/status` → 401/403.  
3. Smoke: public `GET /api/health` has no `missingEnv` / secret names.  
4. Decide next sprint: deps (H-04) and/or CSP nonce (H-01 residual).  
5. Approve commit of P11.1 files when ready.
