# ROVEXO — ORGANIC GROWTH ENGINE v1.0  
## PHASE 1 — SEO FOUNDATION / P0 REMEDIATION CERTIFICATION

| Field | Value |
|-------|-------|
| Status | **COMPLETE** · WORKING TREE ONLY (no commit / push / deploy) |
| Version | 1.0 |
| Date | 2026-08-08 |
| Source audit | `docs/audits/ROVEXO_ORGANIC_GROWTH_FORENSIC_AUDIT_v1.md` |
| Host evidence | `http://localhost:3000` + source tree |
| Performance baseline (Owner) | Mobile PageSpeed: Performance **96** · Accessibility **100** · Best Practices **100** · SEO **61** |
| Performance Program | **FROZEN** — not modified in this phase |

**Classification legend:** `PASS` · `FAIL` · `PARTIAL` · `NOT VERIFIED` · `BLOCKED`

---

## 1. Executive Summary

Phase 1 remediated **verified + safe + minimal** SEO foundation gaps without starting the full Organic Growth Engine, without programmatic expansion, and without weakening authentication.

**Homepage crawlability (P0-01) is BLOCKED** pending Owner approval: guest `GET /` still **307 → `/login`** by design (`lib/supabase/middleware.ts` + Auth Master / guest-entry freeze). Homepage **can** render from public marketplace data, but making `/` public changes Auth startup semantics — forbidden without Owner authorization.

Implemented safely:

- Removed root layout global `canonical: "/"` (inheritance risk on soft-unavailable pages).
- Homepage absolute root canonical with trailing slash (`https://…/` when `NEXT_PUBLIC_APP_URL` is production).
- `robots.txt` Disallow parity with `AUTH_PROTECTED_PREFIXES`.
- JSON-LD injection switched to server HTML `<script type="application/ld+json">` (no delayed client strategy).
- Optional GSC verification meta via `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (no hardcoded token).
- Product JSON-LD emits `Brand` only when `product.brand` is present.

Soft-200 unavailable listing/store/user pages remain **intentional** (Homepage freeze: never 404) with **noindex**. Sold listings remain **KEEP INDEXED** with Offer `OutOfStock` (business policy in product types/repository).

Gates: TypeScript **PASS** · ESLint **PASS** (0 errors) · Production build **PASS** · Focused SEO tests **PASS** · Localhost route smoke **PASS** (auth redirects preserved).

---

## 2. Findings Before Implementation

| ID | Finding | Class |
|----|---------|-------|
| P0-01 | Guest `GET /` → 307 `/login` — middleware cold-start | `VERIFIED` · Auth contract conflict with SEO |
| P0-02 | Root `app/layout.tsx` `alternates.canonical: "/"` inheritance risk | `VERIFIED` |
| P0-03 | Missing listing/store → soft UI HTTP 200 + noindex (not hard 404) | `VERIFIED` · Owner freeze prefers soft unavailable |
| P1-01 | robots Disallow incomplete vs `AUTH_PROTECTED_PREFIXES` | `VERIFIED` |
| P1-02 | Sold PDP public + indexable; JSON-LD OutOfStock via availability | `VERIFIED` policy KEEP INDEXED |
| P1-03 | `JsonLdScript` used `next/script` `afterInteractive` | `VERIFIED` · RISK for non-JS crawlers |
| P1-04 | No GSC verification in repo | `MISSING` |
| P1-05 | `product.brand` in repository; Product JSON-LD omitted brand | `VERIFIED` gap |

**Root cause of guest `/` → login (exact):**

- File: `lib/supabase/middleware.ts`
- Condition: `if (!user && (pathname === "/" || pathname === ""))`
- Action: redirect to `/login`
- SSOT alignment: `lib/auth/guest-entry.ts` (`AUTH_GUEST_ENTRY_PATH = login`); Auth Master Spec guest → Login

**Public vs private homepage data:** `app/(platform)/page.tsx` uses public feed/showcase queries; optional auth only for `visualPreview=draft` (super_admin). Safe to render for guests **if** Owner re-authorizes Auth startup.

---

## 3. Changes Made

1. **P0-02** — Removed root layout global canonical; homepage sets `rootCanonical` with trailing slash.
2. **P0-03** — No HTTP status change (Owner freeze). Soft-200 + noindex retained; root canonical removal prevents unavailable pages inheriting `/`.
3. **P1-01** — `app/robots.ts` builds Disallow from `AUTH_PROTECTED_PREFIXES` + auth/API/staff.
4. **P1-02** — No behavioural change; documented KEEP INDEXED + OutOfStock.
5. **P1-03** — `JsonLdScript` → native server-rendered JSON-LD script.
6. **P1-04** — Env-gated `metadata.verification.google` + `.env.example` note.
7. **P1-05** — `productJsonLd` includes schema.org `Brand` when brand string present.
8. **Tests** — `tests/organic-growth-phase1-seo-foundation.test.ts`.
9. **Docs** — this certification file only.

**Not changed:** Auth middleware guest `/` redirect · Performance Program · Sell/Checkout/Wallet/Orders/Inbox UI · programmatic SEO expansion · P2 items.

---

## 4. Files Modified

| File | Change |
|------|--------|
| `app/layout.tsx` | Remove root canonical; optional GSC verification |
| `app/(platform)/page.tsx` | Absolute trailing-slash root canonical |
| `app/robots.ts` | AUTH_PROTECTED_PREFIXES Disallow parity |
| `components/seo/JsonLdScript.tsx` | Server HTML JSON-LD script |
| `lib/seo/json-ld.ts` | Optional Product `brand` |
| `.env.example` | `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` documented |
| `tests/organic-growth-phase1-seo-foundation.test.ts` | **Added** |
| `docs/audits/ROVEXO_ORGANIC_GROWTH_PHASE1_CERTIFICATION_v1.md` | **Added** (this file) |

---

## 5. Homepage Crawlability Result

| Check | Result |
|-------|--------|
| Guest `/` HTTP | **307 → `/login`** (localhost 2026-08-08) |
| Guest crawlable homepage HTML | **FAIL** (by Auth design) |
| Authenticated `/` | Expected 200 homepage — **NOT VERIFIED** this phase (no auto-login) |
| Public-data safety if unlocked | **PASS** (feed/showcase public; draft preview gated) |
| Implementation of public `/` | **BLOCKED** — Owner Auth vs SEO decision required |

**Minimal proposed architecture (Owner approval required before implement):**

1. Remove or gate the middleware block at `lib/supabase/middleware.ts` L162–168 for pathname `/` only.
2. Keep `AUTH_PROTECTED_PREFIXES` unchanged.
3. Keep guest entry for deep links / cold start product decision documented in Auth freezes.
4. Re-certify Auth Master Spec + Owner Preview on `https://www.rovexo.co.uk/`.

**Do not** bypass auth globally or expose private user data.

---

## 6. Root Canonical Result

| Check | Result |
|-------|--------|
| Root layout global `canonical: "/"` | **Removed** · `PASS` |
| Homepage `alternates.canonical` | Absolute `rootCanonical` with trailing `/` · `PASS` (code) |
| Live guest `/` canonical in HTML | **NOT VERIFIED** (guest never receives homepage HTML) |
| Duplicate canonical systems | None added · `PASS` |

---

## 7. Soft-200 Result

| Lifecycle | HTTP (current) | robots meta | JSON-LD | Sitemap | SEO policy |
|-----------|----------------|-------------|---------|---------|------------|
| ACTIVE published listing | 200 | index | Product | eligible | INDEX |
| SOLD | 200 | index | OutOfStock | eligible | **KEEP INDEXED** |
| MISSING / deleted / invalid listing | 200 soft UI | **noindex** | none | no | Soft-200 intentional |
| Unavailable store/user | 200 soft UI | **noindex** | none | no | Soft-200 intentional |
| Forbidden slug | redirect `/` | — | — | — | Redirect |
| Auction listing | redirect `/search` | — | — | — | Redirect |
| EXPIRED / DELETED hard 410 | — | — | — | — | **NOT VERIFIED** / P2 |
| NOT_FOUND hard 404 for marketplace | — | — | — | — | **Forbidden** by Homepage freeze |

**Verdict:** Soft-200 for unavailable = **PASS** as intentional Owner policy (not converted to 404/410). Root canonical inheritance risk mitigated.

---

## 8. Robots/Auth Result

| Check | Result |
|-------|--------|
| robots Disallow includes `/wallet/` `/inbox/` `/sell/` `/balance/` etc. | **PASS** (localhost `/robots.txt` verified) |
| SSOT = `AUTH_PROTECTED_PREFIXES` | **PASS** |
| Auth redirects for protected routes | **PASS** (smoke) |
| robots `Allow: /` while guest `/` redirects | Remaining **PARTIAL** conflict until P0-01 Owner unlock |
| Sitemap private routes | Static/product shards — private app routes not added · `PASS` (no change) |

---

## 9. Sold Listing SEO Result

| Policy | Evidence | Class |
|--------|----------|-------|
| KEEP INDEXED | `ProductDetail.status` comment: sold remains publicly viewable | `PASS` |
| Offer availability | sold → `availability: out_of_stock` → schema OutOfStock | `PASS` |
| Forced noindex/410 | Not supported by business logic | Not implemented |

---

## 10. JSON-LD Result

| Surface | Injection | Notes |
|---------|-----------|-------|
| Organization (root) | Server script via `JsonLdScript` | `PASS` |
| Homepage | Same | Crawl blocked for guests until P0-01 |
| Listing Product+Offer+Breadcrumb | Same + optional Brand | `PASS` |
| Category / Brand / Store / Seller | Existing engine paths unchanged | `PASS` leave |
| Duplicate JSON-LD systems | None added | `PASS` |
| afterInteractive delay | Removed | `PASS` |

Live HTML scrape of Product JSON-LD on a real listing URL this phase: **NOT VERIFIED** (no specific live slug exercised beyond code/tests).

---

## 11. GSC Result

| Item | Result |
|------|--------|
| Method | Optional HTML tag via Next `metadata.verification.google` |
| Env | `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` |
| Hardcoded token | None |
| Production validity | **NOT VERIFIED** until Owner sets env in Vercel + confirms in GSC |
| DNS / file upload methods | Not implemented (not required if HTML tag used) |

---

## 12. Product Brand Result

| Item | Result |
|------|--------|
| Data source | `products` → `brands (name)` in `lib/products/repository.ts` |
| Field | `Product.brand?: string` — **OPTIONAL** |
| JSON-LD | Emitted as `Brand` when non-empty · `PASS` |
| Invented brands | None |
| Sell flow | Unchanged |

---

## 13. Route Regression Matrix

Evidence: guest curl against `http://127.0.0.1:3000` (2026-08-08). Canonical/robots for private routes = N/A (redirect before page).

| Route | HTTP (guest) | Redirect | Indexability intent |
|-------|--------------|----------|---------------------|
| `/` | 307 | `/login` | Homepage crawl **BLOCKED** |
| `/login` | 200 | — | noindex + robots Disallow |
| `/search` | 200 | — | public |
| `/browse` | 200 | — | public |
| `/categories` | 200 | — | public |
| `/sell` | 307 | `/login?next=/sell` | private + robots Disallow |
| `/inbox` | 307 | `/login?next=/inbox` | private + Disallow |
| `/orders` | 307 | `/login?next=/orders` | private + Disallow |
| `/wallet` | 307 | `/login?next=/wallet` | private + Disallow |
| `/balance` | 308 | `/wallet` (then auth) | private |
| `/account` | 307 | `/login?next=/account` | private + Disallow |
| `/account/settings` | 307 | login next | private |
| `/checkout` | 307 | login next | private + Disallow |
| `/notifications` | 307 | login next | private + Disallow |
| `/business` | 308 | `/business/dashboard` | private chain |
| `/admin` | 307 | login next | private + Disallow |
| `/super-admin` | 307 | login next | private + Disallow |

---

## 14. SEO Regression Tests

| # | Test | Result |
|---|------|--------|
| 1 | Guest `/` public if safely public | **FAIL / BLOCKED** — still 307 (intentional Auth) |
| 2 | Private routes protected | **PASS** |
| 3 | Root canonical correct in code | **PASS** |
| 4 | No duplicate canonical system | **PASS** |
| 5 | robots.txt valid + expanded Disallow | **PASS** |
| 6 | sitemap remains valid | **PASS** (build + prior live index; shards unchanged) |
| 7 | Sitemap does not expose private routes | **PASS** (no private shard added) |
| 8 | Unavailable pages uncontrolled indexable | **PASS** (noindex retained) |
| 9 | JSON-LD not duplicated | **PASS** |
| 10 | Product JSON-LD matches visible brand when present | **PASS** (unit) · live listing **NOT VERIFIED** |
| 11 | No query-index explosion | Unchanged · **PASS** |
| 12 | No new crawl trap | Unchanged · **PASS** |
| 13 | No performance implementation modified | **PASS** |

Focused Vitest: `tests/organic-growth-phase1-seo-foundation.test.ts` — **9/9 PASS**.

---

## 15. Performance Regression Check

| Item | Result |
|------|--------|
| CSS / React SC / images / fonts / prefetch / homepage perf arch | **Not modified** |
| New global CSS / providers / SEO libraries | **None** |
| JSON-LD | Preferential server HTML (lighter than delayed Script strategy) |
| Owner PageSpeed re-run | **NOT VERIFIED** this phase (no deploy) |

---

## 16. Remaining P0

| ID | Status |
|----|--------|
| P0-01 Homepage crawlability for guests | **BLOCKED** — Owner Auth vs SEO decision |
| P0-02 Root canonical | **PASS** (code) · live guest HTML **NOT VERIFIED** until P0-01 |
| P0-03 Soft-200 policy | **PASS** (intentional soft + noindex); hard 404/410 **deferred** |

---

## 17. Remaining P1

| ID | Status |
|----|--------|
| P1-01 robots/auth parity | **PASS** (code + localhost robots) |
| P1-02 sold policy | **PASS** KEEP INDEXED (documented; no change) |
| P1-03 JSON-LD injection | **PASS** (code/tests) · live HTML scrape **NOT VERIFIED** |
| P1-04 GSC | **PARTIAL** — env hook ready; Owner must set token + verify in GSC |
| P1-05 Product brand | **PASS** when brand present; empty brand remains optional |

---

## 18. Deferred P2

- hreflang  
- Review schema  
- Merchant feed  
- 410 lifecycle  
- UI breadcrumbs  

---

## 19. NOT VERIFIED

- Itemised Lighthouse SEO audits causing score 61  
- Logged-in homepage HTML / canonical in browser  
- Live production HTML after deploy (no deploy this phase)  
- GSC property verification success  
- Full Product JSON-LD vs visible fields on a live listing slug  
- Exact EXPIRED listing DB status → SEO mapping beyond sold/missing  
- `/business` full redirect chain after 308 under guest  

---

## 20. Risks

- **Auth vs SEO:** Leaving guest `/` → login keeps SEO homepage weak until Owner unlocks.  
- **Soft-200:** Google may treat soft unavailable as soft-404 despite noindex; Owner freeze forbids hard 404.  
- **GSC env missing in production:** verification meta absent until env set.  
- **robots Allow `/`:** still allows crawl of `/` which redirects — wasteful crawl until P0-01 resolved.

---

## 21. Final Certification

| Gate | Result |
|------|--------|
| TypeScript | **PASS** |
| ESLint | **PASS** (0 errors; pre-existing warnings only) |
| Production build | **PASS** |
| Focused SEO tests | **PASS** (9/9) |
| Production route smoke (localhost) | **PASS** |
| Performance Program untouched | **PASS** |
| Commit / push / deploy | **NOT DONE** (locked) |
| Phase 1 overall | **PARTIAL** — safe P0/P1 done; **P0-01 BLOCKED** |

**Owner decision required before Phase 2 / homepage public unlock.**

No Phase 2. No Programmatic SEO. No mass page generation. No Merchant Engine. No Content Engine.
