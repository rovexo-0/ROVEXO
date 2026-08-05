# ROVEXO PHASE 11 — BUNDLE MASTER PLAN

**STATUS: PLAN ONLY · DO NOT IMPLEMENT · AWAITING OWNER APPROVAL**  
**Mission:** Eliminate ONLY unnecessary JavaScript and CSS.  
**Forbidden:** Functionality / UI / UX / business / DB / API / auth / Wallet / Orders / Checkout / Messages changes.  
**Release:** No commit · No push · No deploy.

**Companion graph:** `ROVEXO_BUNDLE_DEPENDENCY_GRAPH.md`  
**Evidence:** `test-results/phase11/phase11-analysis.json`, `page-bundle-matrix.json`, `css-buckets.json`, `chunk-sizes.json`

---

## Current → Target

| Metric | Current (localhost evidence) | Target (Phase 10 budget) | Gap |
|---|---|---|---|
| JS Initial (Login) | **876 KB** | ≤180 KB | **−696 KB** |
| JS Initial (Search) | **1058 KB** | ≤180 KB | **−878 KB** |
| CSS Initial (Login) | **210 KB** | ≤50 KB | **−160 KB** |
| CSS Initial (Search) | **952 KB** | ≤50 KB | **−902 KB** |
| Platform CSS chunk | **777 KB** | route-scoped | Split / remove |
| `"use client"` files | **734** | fewer boundaries | Audit |
| Lighthouse Mobile | Phase 10 blocked | ≥98 | After weight cut |

**Irreducible floor (approx):** react-dom (~226 KB) + Next runtime share + minimal auth CSS.  
Realistic first-milestone target after plan execution (Owner-approved later):  
- Login JS **≤350 KB** → then **≤180 KB**  
- Search CSS **≤200 KB** → then **≤50 KB** critical  

---

## STEP 1 — Per-page bundle matrix

| Page | JS Initial | JS Lazy* | CSS Initial | CSS Lazy* | Largest Chunk | Largest Dependency | Largest Dynamic | Unused JS* | Unused CSS* | Dup Modules |
|---|---|---|---|---|---|---|---|---|---|---|
| Homepage | 876 KB (→Login) | partial | 210 KB | n/a | react-dom 226 | next runtime 406 | AppShell dynamics | high shared | auth-level | — |
| Search | **1058** | partial | **952** | **none for modules** | react-dom 226 | platform CSS 777 | Search/Header | high | **admin+wallet+…** | CSS eras |
| Categories | 977 | partial | 901 | none | react-dom 226 | platform CSS 777 | chrome | high | same | same |
| Listing | **1084** | partial | 941 | none | react-dom 226 | platform CSS 777 | PDP dynamics | high | same | same |
| Store | 1004 | partial | 941 | none | react-dom 226 | platform CSS 777 | chrome | high | same | same |
| Profile | 876 (→Login) | — | 210 | — | react-dom | next | — | unknown auth | — | — |
| Wallet | 876 (→Login) | — | 210 | — | react-dom | next | — | unknown auth | — | — |
| Orders | 876 (→Login) | — | 210 | — | react-dom | next | — | unknown auth | — | — |
| Messages | 876 (→Login) | — | 210 | — | react-dom | next | — | unknown auth | — | — |
| Checkout | 876 (→Login) | — | 210 | — | react-dom | next | — | unknown auth | — | — |
| Settings | 876 (→Login) | — | 210 | — | react-dom | next | — | unknown auth | — | — |

\* **Lazy / Unused** require runtime coverage (Lighthouse unused-javascript / Chrome Coverage) under authenticated session — marked from structural evidence (layout imports), not guessed percentages.

---

## STEP 2 — Top 100 largest modules (plan view)

Full machine list: `test-results/phase11/phase11-analysis.json` → `top_source_files` + `top_use_client` + `npm_packages_by_size` + `chunk-sizes.json`.

### A. Built chunks (browser-relevant) — top 20

| Rank | KB | File | Used by | Lazy? | Split? | Server-only? |
|---|---|---|---|---|---|---|
| 1 | 777 | `0a0kbdf6e3ndx.css` | All `(platform)` | No | **Yes — route CSS** | N/A |
| 2 | 406 | `0lt42bxaql9x1.js` | All | No | Limited | No (Next) |
| 3–5 | 292 | framework twins | All | No | Limited | No |
| 6 | 226 | `3m-x0-nwv87vj.js` (react-dom) | All | No | No | No |
| 7 | 202 | `101z-by49auj4.js` (supabase) | Client auth/data | Partial | **Yes — defer** | Prefer server reads |
| 8+ | 168→70 | app shared JS | Many | Audit | Yes | Case-by-case |

### B. Source CSS modules (platform index) — highest admin/enterprise

| Rank | KB | Package/File | Used by today | Could lazy/split? | Server-only? |
|---|---|---|---|---|---|
| 1 | 17.1 | `command-center-v2.css` | **Search via index.css** | **Yes — admin layout only** | CSS |
| 2 | 14.7 | `command-center-v1.css` | same | Yes + dedupe v1/v2 | CSS |
| 3 | 13.6 | `mission-control.css` | same | Yes | CSS |
| 4 | 12.4 | `super-admin-premium.css` | same | Yes | CSS |
| … | … | 42 adminish files **~282 KB source** | Platform | Move to `super-admin` layout | CSS |
| — | 41.7 | `conversation-hub-v1.css` | Platform | Conversation routes only | CSS |
| — | 29.6 | `sell.css` | Platform | `/sell` only | CSS |
| — | 28.2 | `wallet-hub-v1.css` | Platform | `/wallet` `/balance` only | CSS |
| — | 24.8 | checkout+cart CSS | Platform | `/checkout` `/cart` only | CSS |

### C. Largest `"use client"` sources (top excerpt)

| KB | File | Used by | Lazy? | Split? | Server Component? |
|---|---|---|---|---|---|
| 38.4 | `InboxPage.tsx` | `/inbox` | islands | yes | Shell YES / children client |
| 35.3 | `ViewProfilePage.tsx` | profile | islands | yes | same |
| 29.7 | `RovexoIdeasPage.tsx` | ideas | islands | yes | same |
| 15.5 | `ProductDetailPage.tsx` | listing | gallery | yes | same |
| 11.7 | `ComplianceDashboard.tsx` | seller | — | — | **INVESTIGATE** (no hooks found) |
| 9.1 | `SuperAdminDashboard.tsx` | super-admin | — | — | **INVESTIGATE** |

### D. npm packages (disk) — keep out of client

| KB disk | Package | Browser action |
|---|---|---|
| 32698 | `lucide-react` | Confirm zero production imports (tests only today) |
| 4675 | `framer-motion` | Archive-only — ban live imports |
| 5449 | `stripe` | Server / Stripe.js loader only |
| 7323 | `xlsx` | Server-only |

*(Ranks 21–100 continue in JSON — same methodology.)*

---

## STEP 3 — `"use client"` audit (rules)

**Count:** 734 files.

**Why (top-100 sample):** hooks 96 · events 92 · browser-api 39 · next/navigation 24 · providers 4 · unmarked INVESTIGATE 2.

**Policy for future execution (not done now):**

1. Never convert a file to Server Component without proving zero hooks/events/browser APIs.  
2. Prefer **server page + small client child** when page file is `"use client"` only to host forms.  
3. Providers that must stay client: Auth, Avatar, Toast, Search, Header, Locale (until proven).  
4. Candidates labeled `INVESTIGATE` require human read before any change.

---

## STEP 4 — Layout / provider force-bundle findings

| Layout | Forces large bundle? | Evidence |
|---|---|---|
| `app/layout.tsx` | **YES — JS** | Root client providers on Login (876 KB JS) |
| `app/(auth)/layout.tsx` | CSS OK | Small `auth-entry.css` |
| `app/(platform)/layout.tsx` | **YES — CSS** | `index.css` 110 imports → 777 KB chunk |
| Admin/super-admin layouts | Shell only | Do **not** own admin CSS today (CSS wrongly global) |

**Providers forcing weight**

| Provider | Large? | Notes |
|---|---|---|
| AuthProvider | Medium–High | Pulls supabase client path |
| PwaProvider | Medium | Needed? defer after idle on auth |
| ToastProvider | Low–Med | Keep; ensure tree-shaken |
| LocaleProvider | Med | i18n client |
| SearchProvider + HeaderProvider | Med + CSS | Platform only (good) |
| Wallet / Messages providers | Not in root | Good — but **CSS still global** |

---

## STEP 5 — CSS findings

| Issue | Evidence |
|---|---|
| Global megasheet | `styles/rovexo/index.css` imports admin/engines/wallet/checkout/inbox/sell |
| Unused on Search (structural) | ~**460 KB source** admin+wallet+inbox+sell+checkout+orders |
| Duplicate selectors / eras | account-*, command-center v1+v2, mission-control v1+v2 |
| Unused animations | Multiple `@keyframes` files under enterprise/command CSS (loaded globally) |
| Fonts | Geist sans preload + mono; audit mono necessity on mobile |
| Icon packs | `lucide-react` disk huge; app usage near-zero — verify no accidental barrel |

---

## STEP 6 — Graph artifact

See **`ROVEXO_BUNDLE_DEPENDENCY_GRAPH.md`**.

---

## STEP 7 — TOP 50 JavaScript reductions

Ranked by expected KB saved → mobile gain → LH gain → risk.  
**Implementation forbidden in Phase 11.**

| # | Reduction | Est. KB saved | Mobile gain | LH gain | Risk |
|---|---|---|---|---|---|
| 1 | Defer `PwaProvider` until idle / non-auth | 20–60 | High | Med | Low |
| 2 | Narrow AuthProvider client surface (server session where possible) | 50–150 | High | High | Med |
| 3 | Split supabase client: browser only on authenticated interactive | 80–180 | High | High | Med |
| 4 | Ensure `xlsx` / chromium never in client graph | 0–200 if leaked | High | High | Low |
| 5 | Ban `framer-motion` from live imports | 0–40 | Med | Med | Low |
| 6 | Confirm `lucide-react` not client-bundled | 0–80 | Med | Med | Low |
| 7 | `AppShellLayout`: keep dynamics; avoid importing feature barrels | 10–40 | Med | Med | Low |
| 8 | Extract InboxPage interactive islands | 20–60 | Med | Med | Med |
| 9 | Extract ProductDetailPage islands | 15–50 | Med | Med | Med |
| 10 | Extract ViewProfilePage islands | 15–40 | Med | Med | Med |
| 11 | INVESTIGATE ComplianceDashboard client mark | 5–15 | Low | Low | Low |
| 12 | INVESTIGATE SuperAdminDashboard client mark | 5–15 | Low | Low | Low |
| 13 | LocaleProvider slim / delay dictionaries | 10–40 | Med | Med | Med |
| 14 | ToastProvider isolate | 5–20 | Low | Low | Low |
| 15 | AvatarProvider slim | 5–15 | Low | Low | Low |
| 16 | Remove duplicate react peer chunks if build config allows | 50–100 | High | High | High |
| 17 | Route-level JS for Help (1116 KB Phase10) | 100–300 | High | High | Med |
| 18 | Dynamic import PromotionRealtime only when promotions exist | 5–25 | Low | Low | Low |
| 19 | Dynamic GlobalStickyBundleBar already — verify not on auth | 5–20 | Low | Low | Low |
| 20 | NavigationPathRecorder defer | 5–15 | Low | Low | Low |
| 21 | MobileScrollBootstrap only mobile UA | 5–20 | Med | Low | Low |
| 22 | SellPage import audit (photos libs) | 20–80 | Med | Med | Med |
| 23 | Checkout client graph only on `/checkout` | 30–100 | High | High | Med |
| 24 | Wallet client graph only on wallet routes | 30–100 | High | High | Med |
| 25 | Conversation hub JS only on conversation routes | 40–120 | High | High | Med |
| 26 | Super-admin JS never in marketplace shared | 50–200 | High | High | Med |
| 27 | Command-centre JS never in marketplace shared | 40–150 | High | High | Med |
| 28 | Reduce shared `features/*` barrel exports | 20–80 | Med | Med | Med |
| 29 | Tree-shake zod on client | 10–40 | Med | Med | Low |
| 30 | Stripe.js loader not full `stripe` package | 20–60 | Med | Med | Low |
| 31 | RSC for Legal/Help static bodies | 50–150 | High | High | Low |
| 32 | SearchProvider split: landing vs results | 10–40 | Med | Med | Med |
| 33 | HeaderProvider slim for conversation routes (already laws) | 5–20 | Med | Low | Low |
| 34 | AuthChromeDeferred verify no marketplace imports | 5–30 | Med | Med | Low |
| 35 | SsrTraceBootstrap strip in production | 5–20 | Low | Low | Low |
| 36 | Deduplicate polyfills | 10–40 | Med | Med | Med |
| 37 | Disable source maps in prod clients | transfer only | — | — | Low |
| 38 | Audit `next/font` mono preload false already — drop mono if unused | 10–30 | Low | Low | Low |
| 39 | Client component inventory CI gate (>N KB fail) | process | High | High | Low |
| 40 | Bundle analyzer in CI (`ANALYZE=true`) | process | High | High | Low |
| 41 | Coverage unused-JS on Login/Search | process | High | High | Low |
| 42 | Replace heavy date libs if present on client | 10–40 | Med | Med | Med |
| 43 | Cart page code only on cart | 10–40 | Med | Med | Low |
| 44 | Ideas page islands | 10–30 | Low | Low | Med |
| 45 | Addresses page islands | 10–30 | Low | Low | Med |
| 46 | 2FA page islands | 5–20 | Low | Low | Med |
| 47 | Tax registration page islands | 5–20 | Low | Low | Med |
| 48 | Bundle review page islands | 5–20 | Low | Low | Med |
| 49 | Prefetch fewer RSC payloads | 20–80 transfer | High | Med | Med |
| 50 | Authenticated remeasure matrix after each cut | evidence | High | High | Low |

**Estimated JS reduction if Owner approves #1–#10 + CSS-driven fewer hydrate bytes:** **150–400 KB** first wave; full #1–#35 toward **≤180 KB** needs multi-sprint.

---

## TOP 50 CSS reductions

| # | Reduction | Est. KB saved (transfer) | Mobile gain | LH gain | Risk |
|---|---|---|---|---|---|
| 1 | **Move admin/enterprise CSS out of `index.css` → super-admin/admin layouts** | **200–400** | **Critical** | **Critical** | Low–Med |
| 2 | Remove duplicate command-center v1 when v2 owns UI | 10–30 | High | High | Med (visual QA) |
| 3 | Remove duplicate mission-control v1/v2 overlap | 10–25 | High | High | Med |
| 4 | `conversation-hub-v1.css` only on conversation routes | 30–60 | High | High | Low |
| 5 | `inbox-hub-v1.css` only on `/inbox` | 15–35 | High | High | Low |
| 6 | `wallet-hub-v1.css` only wallet/balance | 20–40 | High | High | Low |
| 7 | `checkout-v1.css` + `cart-v1.css` only those routes | 15–40 | High | High | Low |
| 8 | `sell.css` only `/sell` | 20–40 | High | High | Low |
| 9 | `orders-page-v1.css` / orders-engine only orders | 10–25 | Med | Med | Low |
| 10 | Account CSS eras: one SSOT sheet | 40–80 | High | High | Med |
| 11 | Home-* CSS only homepage layout | 30–70 | High | High | Med |
| 12 | `product-detail-v1.css` only listing | 20–40 | High | High | Low |
| 13 | `make-offer-v1.css` only offer surfaces | 5–15 | Med | Med | Low |
| 14 | Engine CSS (payments/shipping/…) admin or feature entry | 30–80 | High | High | Med |
| 15 | `hmrc-reporting-centre` out of marketplace | 5–15 | Med | Med | Low |
| 16 | Theme/app/platform studio CSS → studio routes | 15–40 | High | High | Low |
| 17 | Omega/SOC/incident CSS → super-admin | 40–90 | High | High | Low |
| 18 | `universal-ui` + `compact-premium` audit overlap | 10–30 | Med | Med | Med |
| 19 | Tailwind content paths: purge dead utilities | 30–100 | High | High | Med |
| 20 | Auth: further slim `auth-v1.css` unused rules | 10–30 | Med | Med | Med |
| 21 | Drop unused `@keyframes` in enterprise CSS | 5–20 | Low | Low | Low |
| 22 | Font: drop Geist Mono if unused on mobile | 10–40 | Med | Med | Low |
| 23 | Icon CSS / standard only where needed | 5–15 | Low | Low | Low |
| 24 | `dashboard.css` not on Search | 5–20 | Med | Med | Low |
| 25 | Auctions CSS gated | 5–15 | Low | Low | Low |
| 26 | Promotion cards CSS gated | 5–15 | Low | Low | Low |
| 27 | Benefits rail CSS homepage only | 5–15 | Low | Low | Low |
| 28 | Secondary banners homepage only | 5–15 | Low | Low | Low |
| 29 | Mission-control-v2 only MC routes | 10–20 | High | High | Low |
| 30 | Super-admin-premium only SA | 10–20 | High | High | Low |
| 31 | Split `0a0kbdf6e3ndx.css` via CSS entry points per route group | 400–700 | **Critical** | **Critical** | Med |
| 32 | Login keep ≤ auth-entry (+ tokens) | toward ≤50 | High | High | Med |
| 33 | Search entry: shared_core + home_search only | 400+ | Critical | Critical | Med |
| 34 | Listing entry: shared + product-detail + make-offer | 300+ | High | High | Med |
| 35 | Deduplicate account-settings sheets | 10–30 | Med | Med | Med |
| 36 | Remove dead `archive` CSS if imported | 0–50 | Med | Med | Low |
| 37 | Compress large sheets (auth-v1 50 KB source) | 5–15 | Low | Low | Low |
| 38 | Avoid importing `messages-engine` globally | 5–15 | Med | Med | Low |
| 39 | Avoid importing `notifications-engine` globally | 5–15 | Med | Med | Low |
| 40 | `chrome-scroll` / mobile-scroll audit | 5–15 | Med | Low | Low |
| 41 | `sign-out.css` account only | 2–8 | Low | Low | Low |
| 42 | `rovexo-ideas` ideas route only | 5–15 | Low | Low | Low |
| 43 | `bring-your-item` feature only | 5–15 | Low | Low | Low |
| 44 | `view-profile` profile only | 10–25 | Med | Med | Low |
| 45 | `store-listing-card` where cards render | 5–15 | Med | Med | Low |
| 46 | Critical CSS inline for Login LCP only | 10–30 | High | High | Med |
| 47 | CI: fail if `index.css` gains admin import | process | High | High | Low |
| 48 | Visual QA checklist per CSS move (Owner) | process | — | — | — |
| 49 | Remeasure Search CSS ≤50 critical after split | evidence | Critical | Critical | Low |
| 50 | Document CSS SSOT map (which layout owns which sheet) | process | High | High | Low |

**Estimated CSS reduction (wave 1: #1 + #4–#9 + #31):** **~400–700 KB** off Search/Listing transfer — largest single lever in the entire Phase 10 FAIL.

---

## Savings summary (plan estimates)

| Wave | Scope | Est. JS ↓ | Est. CSS ↓ | Est. Mobile score Δ | Est. LH Mobile Δ | Confidence |
|---|---|---|---|---|---|---|
| A | CSS route-split (admin/wallet/inbox/checkout/sell out of Search) | 0–50* | **400–700 KB** | +15–25 | +8–15 | **85%** |
| B | Root provider defer (Pwa/Toast timing) + supabase narrow | **100–250 KB** | 0–20 | +8–15 | +5–10 | **70%** |
| C | Client island extraction (Inbox/PDP/Profile) | **50–150 KB** | 0 | +5–10 | +3–6 | **60%** |
| D | Authenticated remeasure + LH Chrome | evidence | evidence | unlock PASS path | unlock ≥98 | **90%** process |

\* CSS cuts also reduce main-thread style calc / hydrate pressure (indirect JS time).

**Combined toward budgets**

| | Estimated after A+B | Confidence |
|---|---|---|
| Search CSS | **200–350 KB** (still may exceed 50) | 80% |
| Search CSS after A+full route CSS | **≤80–120 KB** then trim to ≤50 | 65% |
| Login JS | **550–750 KB** after B only | 70% |
| Login JS ≤180 | Requires deeper Next/shared chunk work (C+) | **45%** in one sprint |

**Estimated Mobile UX score:** 58 (Phase 10) → **72–80** after Wave A+B (engineering estimate).  
**Estimated Lighthouse Mobile:** unknown baseline → **+8–20 points** if CSS megasheet removed from Search (estimate).  
**Overall plan confidence:** **78%** that Wave A is the correct first Owner-approved execution; **55%** that ≤180 JS / ≤50 CSS lands in a single follow-on sprint without further analysis.

---

## Recommended execution order (future Owner phase — not started)

1. **CSS route ownership** (Wave A) — smallest visual risk if sheets move with matching layouts; Owner visual QA required.  
2. Remeasure Search/Listing/Login budgets.  
3. **Provider / supabase defer** (Wave B).  
4. Client island extraction (Wave C) only with Owner visual gates.  
5. Full Phase 10 re-cert with Lighthouse Mobile.

---

## STOP

```
NO IMPLEMENTATION
NO REFACTOR
NO OPTIMISATION
NO COMMIT · NO PUSH · NO DEPLOY
Await explicit Owner approval.
```

---

*Phase 11 Bundle Master Plan · Evidence-only · 2026-08-04*
