# ROVEXO P11 — SECURITY & IP HARDENING MASTER AUDIT

**STATUS:** AUDIT COMPLETE · EVIDENCE ONLY · AWAITING OWNER APPROVAL  
**PHASE:** Audit first — **NO implementation**  
**ASSUMPTION:** Production deployment posture  
**BASELINE:** P10 = PASS · P12 Wave A = PASS · Functional certification assumed  
**DATE:** 2026-08-05  
**METHOD:** Source + migration review · npm audit · route inventory · header/CSP SSOT · sampled critical money/auth paths  
**NOT PERFORMED:** Live exploit / red-team / penetration test against production credentials  

```
NO CODE · NO UI · NO CSS · NO DB · NO API · NO BUSINESS LOGIC · NO COMMIT · NO PUSH · NO DEPLOY
```

---

## Executive Summary

ROVEXO’s **money and commerce paths are intentionally fail-closed** (Buy Now guards, wallet RLS hardening, signed webhooks, session-bound withdraw). Authentication uses Supabase session cookies (`httpOnly` · `SameSite=Lax` · `secure` in production) with MFA and admin/super-admin **server** gates.

However, **production public exposure is not yet fully hardened**. The largest concrete risks found:

1. **CRITICAL** — Unauthenticated `/api/marketplace-os/*` control-center APIs.  
2. **HIGH** — Broad participant `UPDATE` RLS on `orders` (and messages) without column restriction.  
3. **HIGH** — Production CSP allows `'unsafe-inline'` + `'unsafe-eval'` (weak XSS backstop).  
4. **HIGH** — CSRF Origin guard exists but is **rarely wired** on cookie-auth mutations.  
5. **HIGH** — `npm audit`: **8 high** advisories (including **Next.js** middleware/proxy bypass + Server Actions DoS).  

**Overall Security Score: 6.8 / 10**

**Production recommendation:** **CONDITIONAL — HARDEN CRITICAL/HIGH BEFORE FULL PUBLIC TRAFFIC.**  
Do **not** treat functional PASS as security PASS. Money cores are stronger than the ops/API perimeter.

---

## Critical Findings

| ID | Finding | Evidence | Impact | OWASP |
|----|---------|----------|--------|-------|
| **C-01** | `/api/marketplace-os/{alerts,health,audit,status}` have **no auth** | `app/api/marketplace-os/*/route.ts` — bare `GET()` → snapshots / audit log | Ops intel, alerts, marketplace state disclosure to anyone who can hit the host | A01 Broken Access Control |
| **C-02** | Orders RLS allows any **buyer/seller participant** to `UPDATE` order rows with **no column-level restriction** | `supabase/migrations/20250618000002_rls_policies.sql` `orders_update_participant` | If client/PostgREST uses user JWT, order status/money fields may be mutable outside Commerce Engine | A01 · A04 |

---

## High

| ID | Finding | Evidence | Impact |
|----|---------|----------|--------|
| **H-01** | CSP `script-src` includes `'unsafe-inline'` `'unsafe-eval'` | `lib/ops/security-headers.ts` `PRODUCTION_CSP` | XSS mitigation largely defeated if any injection lands |
| **H-02** | CSRF Origin guard largely unwired | `lib/api/csrf-guard.ts` exists; most routes call `requireApiAuth()` / `requireApiSuperAdmin()` **without** `request` → no Origin check | Cross-site mutation risk mitigated mainly by SameSite=Lax |
| **H-03** | Messages participant `UPDATE` broad; client-supplied `senderRole` on message API | RLS policies + `/api/messages/[id]` | Spoofed role attribution / unread side-effects; message row tampering risk |
| **H-04** | npm **high** vulnerabilities including **Next.js 16.2.12** (middleware/proxy bypass · Server Actions DoS), sharp/libvips, undici, xlsx, postcss, etc. | `npm audit` → 8 high · 1 moderate · 0 critical | Framework/tooling exploit surface |
| **H-05** | Rate limiting covers ~**43 / 599** API routes | `enforceRateLimit*` usage vs route count | Abuse of uncovered mutations (offers, saved, bank-account, most admin) |
| **H-06** | Unauthenticated `/api/health` exposes `missingEnv` **secret key names** | `app/api/health/route.ts` → `environment.missingRequired` | Reconnaissance / config fingerprinting |

---

## Medium

| ID | Finding | Evidence |
|----|---------|----------|
| **M-01** | Help markdown inserts `href` without scheme allowlist (`javascript:` risk if content ever becomes user-controlled) | `lib/help/markdown.ts` + `dangerouslySetInnerHTML` |
| **M-02** | `/staff` pages lack server `requireRole` (client shells); staff APIs are gated | `app/(platform)/staff/layout.tsx` |
| **M-03** | No captcha / Turnstile on login·register·reset | Auth rate limits exist; stuffing still cheaper without challenge |
| **M-04** | Middleware does not block unauthenticated generic `/api/*` — relies on each handler | `lib/supabase/middleware.ts` (`!isApiRoute`) |
| **M-05** | Middleware super-admin path check misses `/api/v1/super-admin` prefix (handlers still gate) | Defense-in-depth gap |
| **M-06** | Upload MIME trusts browser `File.type` before content checks (listings partially mitigated by JPEG assert) | `lib/storage/upload.ts` · listing upload |
| **M-07** | Raw `error.message` on some upload / super-admin paths | Leakage of internal detail |
| **M-08** | CSP/HSTS/COOP only when `NODE_ENV === "production"` | Preview misconfig risk |
| **M-09** | IP: large architecture/cert docs in repo; no systematic proprietary headers; JS bundles reverse-engineerable | Repo + client bundles |
| **M-10** | robots.txt does not disallow `/wallet` `/inbox` `/super-admin` `/staff` | Crawl noise / surface mapping |

---

## Low

| ID | Finding |
|----|---------|
| **L-01** | COEP / CORP not set (often incompatible with Stripe embeds — acceptable trade-off) |
| **L-02** | Open redirect sanitizer blocks `//` and absolute URLs; destination allowlist not exhaustive |
| **L-03** | Homepage/client can expose architecture via minified bundles (normal for Next apps) |
| **L-04** | `productionBrowserSourceMaps: false` — good; still no IP obfuscation |

---

## Current Strengths

| Area | Why it is strong |
|------|------------------|
| **Buy Now / Checkout** | Auth · rate limit · 16-check guard · financial audit · RVX codes · fail-closed |
| **Wallet RLS** | Own select; update/insert of balances/transactions admin-only after production security migration |
| **Webhooks** | Stripe signature · Sendcloud HMAC · cron Bearer + timing-safe compare |
| **Session cookies** | `httpOnly` · `SameSite=Lax` · `secure` in production |
| **Admin / Super Admin pages** | Server layouts `requireRole` — not client-only |
| **MFA** | AAL fail-closed for protected pages/APIs |
| **Storage ACLs** | Folder owner = `auth.uid()` for avatars/products/messages |
| **Security headers SSOT** | XFO DENY · nosniff · Referrer-Policy · Permissions-Policy · prod HSTS · CSP · COOP · `frame-ancestors 'none'` |
| **Source maps** | Browser production source maps **disabled** |
| **Secrets in client** | No `SERVICE_ROLE` / `STRIPE_SECRET` in `"use client"` (repo scan) |
| **Offers** | Auth context + party checks + self-offer fraud block |
| **Rate-limit production** | Fail-closed without Upstash (non-localhost) |
| **View bots** | UA blocking in view engine |
| **Open redirects** | `sanitizeNextPath` on auth callback |

---

## Current Weaknesses

1. Ops/control APIs left open (`marketplace-os`).  
2. DB policy layer weaker than app engines for **order UPDATE**.  
3. XSS defense relies on careful coding + weak CSP.  
4. CSRF incomplete.  
5. Rate-limit surface tiny vs API surface (**599** routes).  
6. Dependency high advisories unpatched.  
7. Auth anti-automation (captcha) missing.  
8. IP protection = obscurity + private hosting only — architecture is learnable from code/bundles.  
9. Health diagnostics aid attackers’ config recon.  
10. Massive Super Admin API surface (332 routes) — high blast radius if a single gate fails.

---

## Risk Matrix

| Finding | Likelihood | Impact | Risk |
|---------|------------|--------|------|
| C-01 MOS unauthenticated | High (trivial GET) | High (ops intel) | **Critical** |
| C-02 Orders UPDATE RLS | Medium (needs user JWT + PostgREST) | Critical (money/state) | **Critical** |
| H-01 Weak CSP | Medium | High | **High** |
| H-02 CSRF unwired | Medium | High | **High** |
| H-04 Next.js advisories | Medium | High | **High** |
| H-05 Rate-limit gaps | High | Medium–High | **High** |
| H-06 Health env names | High | Low–Medium | **Medium** |
| M-03 No captcha | High | Medium | **Medium** |
| M-09 IP copyability | High | Business | **Medium** |

---

## Part 1 — Application Security (summary)

| Control | Status |
|---------|--------|
| Authentication | **Strong** (Supabase · getUser · MFA) |
| Authorization | **Mixed** (app strong; some RLS weak; MOS open) |
| Session | **Strong** |
| CSRF | **Weak** (guard exists, low wiring) |
| XSS | **Medium** (static help today; CSP weak; markdown href) |
| CSP | **Present but permissive** |
| Clickjacking | **Strong** (XFO + frame-ancestors) |
| Open redirects | **Mostly strong** |
| SSRF | No systemic user-URL fetch pattern flagged in this pass; remain vigilant on shipping/webhooks |
| SQLi | Supabase client parameterized; low classic SQLi risk |
| RLS | **Enabled widely**; wallet strong; orders/messages UPDATE weak |
| Secrets | Server-side OK; health leaks **names** |
| JWT | Session via Supabase cookies; do not trust client role claims |
| Cookies | **Strong** flags |
| Rate limiting | **Good design**, poor coverage |
| Uploads | **Good** listing path; MIME trust residual |
| Error handling | Mixed (RVX money paths good; some raw messages) |
| Replay | Webhooks signed; payment idempotency exists in commerce design — continue to treat as must-verify |

---

## Part 2 — Marketplace Security

| Domain | Privilege escalation assessment |
|--------|----------------------------------|
| Listings / Sell | Seller ownership checks on upload; role whitelist on signup |
| Offers | Party-scoped; self-offer blocked |
| Checkout / Buy Now | Session buyer only; financial audit |
| Wallet | Session-bound withdraw/bank; RLS blocks balance self-update |
| Orders | **Risk:** RLS UPDATE too broad vs engine |
| Messages | Participant scoped; **senderRole** client risk |
| Notifications | Server engines; verify IDOR on any user-facing mark-read |
| Reports | Admin-gated samples |
| Admin / Super Admin | Server layouts + middleware role; large API surface |
| Business / Seller / Buyer | Unified account model; capabilities via verification — no separate “become seller” account type |

**Verdict:** Classic UI privilege escalation (fake admin in React) is **unlikely** if APIs hold. **DB-level order UPDATE** and **open MOS** are the realistic escalation/disclosure paths.

---

## Part 3 — API Security

| Metric | Value |
|--------|------:|
| Total `route.ts` | **599** |
| Mentions of requireAuth*/requireApi* | **~498** files (not all methods equally gated) |
| Rate-limited routes | **~43** |
| Super-admin routes | **~332** |

**Patterns**
- Money paths sampled: auth + validation + often rate limit.  
- Webhooks: signature verification.  
- Gaps: unauthenticated ops/health; incomplete CSRF; sparse rate limits; occasional error leakage.  
- IDOR: money routes bind `auth.user.id`; residual risk wherever service-role admin client used without app authz.

---

## Part 4 — Client Security

| Item | Status |
|------|--------|
| Production browser source maps | **Off** |
| Service role / Stripe secret in client | **Not found** |
| `NEXT_PUBLIC_*` | Expected publishable keys only |
| Bundle IP leak | Architecture/logic recoverable from JS |
| Runtime config | Env-driven; health reveals missing key names |

---

## Part 5 — IP Protection (assessment only — no implementation)

### How easily could a competitor copy ROVEXO?

| Asset | Exposure | Copy difficulty |
|-------|----------|-----------------|
| UI/UX | Public pages + CSS | **Easy** |
| Marketplace flows | Observable click paths | **Easy** |
| SEO system | Public HTML + sitemaps + robots | **Easy–Medium** |
| Category taxonomy | Public category URLs + Catalog Master names | **Easy** |
| Wallet / offers / checkout rules | Partially inferable; engines in JS/server | **Medium** |
| Full architecture / Blood laws / engines | If **git repo or docs leak** → **Easy**; if private → **Harder** |
| Exact fee/ledger/RLS | Server + DB | **Harder** without insider access |

### Current exposure
- Large `ROVEXO_*.md` / `docs/engineering/**` in workspace (not Next-routed, but **repo confidentiality** is the control).  
- No systematic copyright/SPDX headers.  
- No code obfuscation beyond Next minify (normal).  
- robots disallow `/api/` (good for casual scrapers, not real protection).

### Recommended protection (plan only)
1. Keep git **private**; restrict CI artifact access.  
2. Legal: ToS · copyright · DB rights · scraping prohibition.  
3. Technical: API auth · rate limits · bot challenges · anomaly detection — already partial.  
4. Do **not** rely on obfuscation as primary IP strategy.  
5. Optional later: watermarking, selective server-only business rules, monitoring for clone sites.

---

## Part 6 — Bot & Scraping

| Threat | Current posture |
|--------|-----------------|
| Mass crawl | robots + private mode switch; sitemaps expose public catalog |
| Content harvest | Listing HTML scrapable; rate limits sparse on public pages |
| API abuse | Rate limit fail-closed if Upstash configured; many routes uncovered |
| Credential stuffing | Auth rate limits; **no captcha** |
| Fake accounts | Email verification flows exist; no strong bot signup challenge |
| Spam (chat/offers) | Policy + reporting; limited automated spam filters observed in this pass |

---

## Part 7 — Performance Abuse

| Vector | Notes |
|--------|-------|
| Request amplification | Large Super Admin surface; MOS open GETs cheap |
| Heavy queries | Search/listings — rate limited on some paths |
| Upload abuse | Size limits + listing rate limit; other uploads weaker |
| Search abuse | Some search rate limits; continue monitoring |
| Expensive SEO/programmatic | Inventory gates reduce thin page cost; still crawlable |

---

## Part 8 — Dependencies (`npm audit`)

| Severity | Count |
|----------|------:|
| Critical | 0 |
| High | **8** |
| Moderate | 1 |
| Low | 0 |

**Notable highs:** `next` (middleware/proxy bypass · Server Actions DoS) · `sharp` (libvips CVEs) · `undici` · `xlsx` (prototype pollution / ReDoS) · `postcss` · `js-yaml` · `fast-xml-parser` · `brace-expansion`

**Action (plan):** Patch Next.js to fixed release; `npm audit fix` where non-breaking; isolate/replace `xlsx` if admin import paths are exposed; rebuild sharp.

---

## Part 9 — Production Headers

| Header | Present (prod SSOT) |
|--------|---------------------|
| CSP | Yes (permissive) |
| HSTS | Yes |
| Permissions-Policy | Yes |
| Referrer-Policy | Yes |
| COOP | Yes |
| COEP | **No** |
| CORP | **No** |
| X-Content-Type-Options | Yes |
| X-Frame-Options / frame-ancestors | Yes (`DENY` / `'none'`) |

---

## Part 10 — Security Score

| Domain | Score / 10 | Notes |
|--------|------------|-------|
| Authentication | **8.0** | Supabase + MFA + cookies |
| Authorization | **6.0** | App strong; MOS + RLS UPDATE drag down |
| API | **6.2** | Money good; coverage uneven |
| Frontend | **6.5** | Headers + maps off; CSP weak |
| Backend | **7.2** | Engines + webhooks + wallet RLS |
| Infrastructure | **6.0** | Depends on Upstash/Vercel/Supabase ops; Next CVEs |
| Marketplace | **7.5** | Buy Now / offers / wallet design strong |
| IP Protection | **4.5** | Easy UI/SEO copy; repo docs risk |
| Bot Protection | **5.5** | Rate limits + robots; no captcha |
| **Overall** | **6.8** | |

---

## OWASP Mapping (Top risks)

| OWASP Top 10 | ROVEXO mapping |
|--------------|----------------|
| A01 Broken Access Control | C-01 MOS · C-02 orders RLS · H-03 messages |
| A02 Cryptographic Failures | Cookie flags OK; continue TLS-only prod |
| A03 Injection | CSP/XSS residual · markdown href · xlsx |
| A04 Insecure Design | CSRF optional wiring · huge admin surface |
| A05 Security Misconfiguration | Health env names · CSP unsafe-* · Next CVEs |
| A07 Identification & Auth Failures | No captcha · stuffing risk |
| A08 Software/Data Integrity | Webhooks signed (good); dependency CVEs |
| A09 Logging/Monitoring Failures | Ops snapshots exist; ensure auth + retention |
| A10 SSRF | Watch outbound fetch surfaces |

---

## Recommended Hardening Plan (NO implementation in this phase)

### P0 — before public traffic (1–3 days)
1. **Auth-gate** all `/api/marketplace-os/**` with `requireApiSuperAdmin`.  
2. **Tighten orders UPDATE RLS** (column triggers / revoke client UPDATE; service_role-only for money/status).  
3. Same for **messages UPDATE** (sender-only or service_role).  
4. **Patch Next.js** (and review middleware bypass advisory applicability).  
5. Redact `/api/health` `missingEnv` for unauthenticated callers.

### P1 — 1–2 weeks
6. Wire `validateMutationOrigin(request)` into all cookie-auth mutations.  
7. Bind `senderRole` server-side from conversation parties.  
8. Extend rate limits to offers · saved · bank-account · payment-methods · auth-adjacent.  
9. Add captcha/Turnstile on login/register/password reset.  
10. CSP tighten: remove `'unsafe-eval'`; migrate toward nonces (harder with Next/Stripe).

### P2 — 2–6 weeks
11. DOMPurify / scheme allowlist for markdown.  
12. Server-gate `/staff` layouts.  
13. Dependency cleanup (`xlsx`, sharp, undici).  
14. Bot/scrape monitoring + WAF (Cloudflare) rules.  
15. IP: private repo policy · legal scrape ban · copyright notices.

### P3 — ongoing
16. Reduce Super Admin API surface / consolidate.  
17. Penetration test + RLS policy fuzzing.  
18. Regular `npm audit` in CI fail-on-high.

---

## Estimated Effort

| Phase | Effort | Priority |
|-------|--------|----------|
| P0 Critical/High gates | **2–5 engineer-days** | **P0** |
| P1 CSRF · rate · captcha · CSP start | **1–2 weeks** | **P1** |
| P2 Sanitize · deps · WAF · IP legal | **2–6 weeks** | **P2** |
| P3 Pen-test · continuous | Continuous | **P3** |

---

## Final Security Score

# **6.8 / 10**

| Band | Meaning |
|------|---------|
| 9–10 | Public launch hardened |
| **7–8** | Strong cores; perimeter gaps |
| **6–7** | **← ROVEXO now** — money cores good; open ops + RLS + CSP + deps |
| &lt;6 | Do not launch |

---

## Production Recommendation

```
PRODUCTION RECOMMENDATION = CONDITIONAL
```

**MAY deploy to controlled Owner/private hosts** with private mode / restricted access.  
**MUST NOT** treat current state as “fully public marketplace security PASS” until at least:

- [ ] C-01 Marketplace OS auth  
- [ ] C-02 Orders (and messages) UPDATE RLS tightened  
- [ ] H-04 Next.js security patch evaluated/applied  
- [ ] H-06 Health recon redaction  

Functional certification (P10 / P12 Wave A) **does not equal** security certification.

---

## Evidence Index

| Source | Role |
|--------|------|
| `app/api/marketplace-os/*/route.ts` | C-01 |
| `supabase/migrations/20250618000002_rls_policies.sql` | C-02 |
| `supabase/migrations/20250620000005_production_security.sql` | Wallet RLS strength |
| `lib/ops/security-headers.ts` | Headers / CSP |
| `lib/api/csrf-guard.ts` · `lib/api/rate-limit.ts` | CSRF / rate |
| `app/api/checkout/buy-now/route.ts` · `app/api/wallet/withdraw/route.ts` | Money strength |
| `lib/supabase/middleware.ts` · `lib/auth/session-cookies.ts` | Session / gates |
| `app/robots.ts` | Crawl policy |
| `next.config.ts` | Source maps · headers wiring |
| `npm audit` | Dependency highs |
| Explore agents | [API/RLS audit](53ddc6d3-8321-4d76-af99-eaa991ef3cae) · [Headers/IP audit](5a9f05dd-8ac7-419f-9089-4f7987f13a09) |

---

## STOP

Audit complete. **No changes made.**  
Awaiting Owner approval before any hardening implementation sprint.
