# ROVEXO — Production Mobile Performance + SEO Master Audit v1.0

**STATUS:** READ ONLY · EVIDENCE-BACKED · NO IMPLEMENTATION  
**DATE:** 2026-08-07  
**HOST SCOPE (code):** Repository `/home/mihai/ROVEXO`  
**PRIMARY TARGET:** Mobile Production (1 Safari iPhone · 2 Chrome Android · 3 Samsung Internet)  
**DESKTOP:** Secondary  
**METHOD:** Static code verification (ripgrep + file reads). No Lighthouse, no field RUM, no live HTTP header capture in this pass.  
**ABSOLUTE:** No code changes · no refactor · no commit · no push · no deploy.

---

## Executive Summary

ROVEXO has a **strong SEO and security-configuration foundation** (App Router metadata, JSON-LD, robots/sitemap, production CSP/HSTS wiring, SafeImage SSOT, PWA manifest + service worker). Mobile production risk is dominated by **client-component density (~759 `"use client"` files)**, a **platform CSS megabundle (111 `@import`s in `styles/rovexo/index.css`)**, **Homepage SSR+client page-1 double fetch**, **listing pages forced dynamic**, **no marketplace list virtualization**, and **Following Feed query fan-out** when that surface runs.

Runtime Core Web Vitals, live Brotli, live CSP delivery, axe WCAG, FPS, and touch latency are **NOT VERIFIED** in this audit (code-only).

### Scores (implementation evidence only — not field measurements)

| Score | Value (/100) | Basis |
|------:|-------------:|-------|
| **Overall Production Score** | **74** | Weighted blend of areas below; capped by unverified runtime CWV + mobile JS/CSS weight |
| Mobile Score | **68** | Client density, CSS size, double fetch, no virtualization, Safari visualViewport unused |
| SEO Score | **84** | Strong meta/OG/JSON-LD/sitemap; gaps: Homepage H1, hreflang unused, robots omit `/wallet` `/inbox` |
| PWA Score | **82** | Manifest + SW + offline + icons; no iOS startup splash images |
| Accessibility Score | **72** | Skip link, labels, aria samples, reduced-motion; Homepage/Search-landing H1 missing; runtime WCAG NOT VERIFIED |
| Security Score | **81** | Headers + CSP configured for production; `'unsafe-inline'` residual; live headers NOT VERIFIED |
| Performance Score | **70** | Images/fonts/SW good; CSS megabundle + client trees + force-dynamic PDP + N+1 Following Feed |
| Production Readiness Score | **91** | 0 `console.log` in app/features; 0 TODO/FIXME in app/features/components/lib; removeConsole in prod |

---

## Evidence snapshot (verified counts)

| Metric | Value | Verification |
|--------|------:|--------------|
| `"use client"` files | **759** | `rg -l '"use client"'` excl. archive/apps/node_modules |
| `next/dynamic` files | **17** | ripgrep |
| `React.lazy` | **0** | ripgrep |
| `unstable_cache` in app/lib | **0** | ripgrep |
| `runtime = "edge"` | **0** | ripgrep |
| Platform CSS `@import`s | **111** | `styles/rovexo/index.css` |
| `blurDataURL` / `placeholder="blur"` | **0** | ripgrep |
| `console.log` in `app/` + `features/` | **0** | ripgrep |
| `\bTODO\b` / `\bFIXME\b` in app/features/components/lib | **0** | ripgrep |
| Virtualization deps (`react-window` / `virtua` / `@tanstack/react-virtual`) | **0** in `package.json` | package.json |
| `apple-touch-startup-image` | **0** | ripgrep |
| `SEARCH_DEBOUNCE_MS` | **300** | `features/search/types/index.ts` |
| Listing page | `dynamic = "force-dynamic"` | `app/(platform)/listing/[slug]/page.tsx` |
| Homepage | `revalidate = 60` | `app/(platform)/page.tsx` |
| Next.js / React | **16.3.0 / 19.2.4** | `package.json` |

---

# Audit sections 1–22

Legend for **Status**: ✅ Complete · 🟡 Can be optimized · ❌ Missing · **NOT VERIFIED**

For every finding: Status · File · Function/Component · Reason · Impact · Risk · Complexity · Changes functionality (YES/NO) · Recommendation.

---

## 1. Next.js

### F-N1 — App Router is sole routing model
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `app/`, `app/(platform)/`, `app/(auth)/` |
| Function / Component | App Router `page.tsx` / `layout.tsx` |
| Exact reason | Marketplace uses App Router only; no Pages Router dual path found. |
| Impact | Correct modern baseline |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Preserve singularity |

### F-N2 — High Client Component density
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | Repo-wide (`features/` ~513, `components/` ~172, `app/` ~35) |
| Function / Component | `"use client"` modules |
| Exact reason | **759** client modules; root wraps PageVisibility → Locale → Pwa → Toast → Auth → Avatar → AppShell (client). |
| Impact | High mobile JS parse/hydrate cost (Safari iPhone primary) |
| Risk | Medium |
| Complexity | High |
| Changes functionality | NO (if leaf-only extraction) |
| Recommendation | Push interactivity to leaves; keep static chrome as RSC — Owner gate (freezes apply) |

### F-N3 — Dynamic imports present
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | e.g. `components/layout/AppShellLayout.tsx`, `features/header/HeaderProvider.tsx`, `components/ui/ListingCard.tsx` |
| Function / Component | `next/dynamic` |
| Exact reason | **17** files use `next/dynamic` for non-critical chrome/overlays. |
| Impact | Smaller initial graphs where applied |
| Risk | Low |
| Complexity | Low |
| Changes functionality | NO |
| Recommendation | Extend to more heavy overlays after Owner approval |

### F-N4 — React.lazy unused
| Field | Value |
|-------|-------|
| Status | ✅ Complete (neutral) |
| File | — |
| Function / Component | `React.lazy` |
| Exact reason | **0** matches; `next/dynamic` used instead. |
| Impact | Neutral |
| Risk | — |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Prefer `next/dynamic` in this codebase |

### F-N5 — Suspense on many platform pages; not on listing shell
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `app/(platform)/listing/[slug]/page.tsx` vs search/orders/inbox pages |
| Function / Component | `Suspense` |
| Exact reason | Listing page awaits product then breadcrumbs; no Suspense streaming boundary found on listing shell. |
| Impact | Listing TTFB tied to full await |
| Risk | Low |
| Complexity | Medium |
| Changes functionality | NO (streaming UX) |
| Recommendation | Optional Suspense fallback around non-critical listing chrome |

### F-N6 — Link prefetch defaults
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | ~231 Link consumers |
| Function / Component | `next/link` |
| Exact reason | No widespread `prefetch={false}` overrides found → Next default prefetch. |
| Impact | Extra RSC/data prefetch on dense mobile lists |
| Risk | Low–Medium |
| Complexity | Low |
| Changes functionality | NO |
| Recommendation | Selective `prefetch={false}` on Inbox/Orders dense rows after mobile QA |

### F-N7 — Image optimization configured
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `next.config.ts` (~L153–177), `components/ui/SafeImage.tsx` |
| Function / Component | `images.formats`, SafeImage |
| Exact reason | AVIF + WebP; qualities; `minimumCacheTTL: 2592000`; SafeImage is sole `next/image` entry (tests enforce). |
| Impact | Strong mobile image bytes |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep SSOT; Favicon freeze separate |

### F-N8 — No `unstable_cache` in application code
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized / ❌ Missing (server cross-request cache) |
| File | app/lib (search) |
| Function / Component | `unstable_cache` |
| Exact reason | **0** usages; caching via `revalidate` / `revalidatePath` / React `cache()` on product slug. |
| Impact | Missed cross-request server memo for hot reads |
| Risk | Medium |
| Complexity | Medium |
| Changes functionality | NO if tags preserve freshness |
| Recommendation | Candidate for homepage feed / category trees — Owner gate |

### F-N9 — ISR on marketing; listing force-dynamic
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `app/(platform)/page.tsx` (`revalidate=60`); browse/category `300`/`3600`; `app/(platform)/listing/[slug]/page.tsx` (`force-dynamic`) |
| Function / Component | `revalidate` / `dynamic` |
| Exact reason | Homepage/browse/categories cached; every listing view dynamic. Product fetch deduped via React `cache()` in `lib/products/repository.ts`. |
| Impact | PDP crawl/TTFB always hits origin |
| Risk | Medium (freshness vs cache) |
| Complexity | Medium |
| Changes functionality | YES if stale listings acceptable |
| Recommendation | Evaluate ISR for published listings only after Owner SEO + inventory policy |

### F-N10 — Edge runtime unused
| Field | Value |
|-------|-------|
| Status | ✅ Complete (intentional Node) |
| File | — |
| Function / Component | `runtime = "edge"` |
| Exact reason | **0** Edge routes; Supabase session middleware is Node-compatible path. |
| Impact | No Edge TTFB gains |
| Risk | High if forced onto auth |
| Complexity | High |
| Changes functionality | YES if Edge breaks cookies |
| Recommendation | Keep Node unless isolated static Edge candidate |

### F-N11 — Middleware matcher exclusions
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `middleware.ts`, `lib/supabase/middleware.ts` |
| Function / Component | Middleware matcher |
| Exact reason | Excludes `_next/static`, `_next/image`, `sw.js`, manifest, images. |
| Impact | Correct auth + SEO routing without SW interference |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-N12 — Metadata forced into initial HTML
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `next.config.ts` (`htmlLimitedBots: /.*/`) |
| Function / Component | Next metadata streaming policy |
| Exact reason | Forces metadata into initial HTML for all UAs (documented for Lighthouse/SEO). |
| Impact | Helps meta discovery |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-N13 — Bundle analysis (lab)
| Field | Value |
|-------|-------|
| Status | **NOT VERIFIED** |
| File | — |
| Function / Component | `@next/bundle-analyzer` / `.next` chunk sizes |
| Exact reason | No analyzer run in this read-only pass; no committed bundle report verified. |
| Impact | Unknown largest chunks |
| Risk | — |
| Complexity | Low to run |
| Changes functionality | NO |
| Recommendation | Run analyzer under Owner-approved QA host later |

---

## 2. React

### F-R1 — ListingCard memoized
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `components/ui/ListingCard.tsx` |
| Function / Component | `memo(ListingCard)` |
| Exact reason | Card memo + priority/loading/sizes wiring. |
| Impact | Feed re-render control |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-R2 — AuthProvider context memo + deferred profile
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `features/auth/providers/AuthProvider.tsx` |
| Function / Component | `useMemo` context value |
| Exact reason | Value memoized; profile fetch deferred on auth routes. |
| Impact | Reduces login LCP contention |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-R3 — Toast tree isolation
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `components/ui/Toast.tsx` |
| Function / Component | `ToastTree = memo` |
| Exact reason | Isolates toast updates from app tree. |
| Impact | Prevents global rerenders |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Reuse pattern for high-churn providers |

### F-R4 — Root provider stack fan-out
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `app/layout.tsx` |
| Function / Component | Provider nesting |
| Exact reason | Multiple client providers wrap all routes. |
| Impact | Hydration + update cost on mobile |
| Risk | Medium |
| Complexity | High |
| Changes functionality | YES if mis-scoped |
| Recommendation | Audit must-wrap-root vs route-scoped providers |

### F-R5 — RealtimeNotificationProvider churn
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `features/notifications/components/RealtimeNotificationProvider.tsx` |
| Function / Component | Realtime context |
| Exact reason | `useMemo` present but high-churn realtime updates. |
| Impact | Badge/inbox tree updates |
| Risk | Medium |
| Complexity | Medium |
| Changes functionality | NO if selectors narrowed |
| Recommendation | Ensure consumers take narrow slices / memo children |

### F-R6 — Product detail fully client
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `features/product-detail/ProductDetailPage.tsx` |
| Function / Component | ProductDetailPage |
| Exact reason | Server page fetches data; entire PDP UI is client (gallery, offers, CTA). |
| Impact | Large listing JS on mobile |
| Risk | Medium–High (marketplace freeze) |
| Complexity | High |
| Changes functionality | YES if split incorrectly |
| Recommendation | Extract static sections to RSC only with Owner + freeze gate |

### F-R7 — useVirtualizedFeedWindow exists
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized (limited use) |
| File | `components/home/hooks/useVirtualizedFeedWindow.ts` |
| Function / Component | `useVirtualizedFeedWindow` |
| Exact reason | Windowing when `itemCount >= 24`; not a full virtual list library. |
| Impact | Partial long-feed relief |
| Risk | Low |
| Complexity | Medium to expand |
| Changes functionality | NO |
| Recommendation | Verify whether Canonical feed uses it — expand carefully |

---

## 3. Mobile Performance

### F-M1 — FPS / scroll jank (runtime)
| Field | Value |
|-------|-------|
| Status | **NOT VERIFIED** |
| File | — |
| Function / Component | — |
| Exact reason | No Safari/Chrome mobile FPS traces captured in this pass. |
| Impact | Unknown |
| Risk | — |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Measure on iPhone Safari + Android Chrome on official host |

### F-M2 — Touch latency (runtime)
| Field | Value |
|-------|-------|
| Status | **NOT VERIFIED** |
| File | — |
| Function / Component | — |
| Exact reason | No INP/touch latency lab. |
| Impact | Unknown |
| Risk | — |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Field + Playwright mobile device certification |

### F-M3 — Passive listeners on key scroll handlers
| Field | Value |
|-------|-------|
| Status | ✅ Complete (partial coverage) |
| File | e.g. `components/home/HomepageHeader.tsx`, `components/header/RovexoHeaderV2.tsx`, `components/home/hooks/useVirtualizedFeedWindow.ts` |
| Function / Component | `addEventListener(..., { passive: true })` |
| Exact reason | Multiple scroll/touch listeners use `{ passive: true }`. |
| Impact | Better scroll responsiveness where applied |
| Risk | Low |
| Complexity | Low |
| Changes functionality | NO |
| Recommendation | Audit remaining non-passive scroll listeners |

### F-M4 — GPU / compositing CSS presence
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `styles/rovexo/**/*.css` |
| Function / Component | `will-change` / `transform` / `translate3d` (~518 hits across CSS) |
| Exact reason | Widespread transform/will-change usage; over-promotion risk not measured. |
| Impact | Can help or hurt GPU memory on mobile |
| Risk | Medium |
| Complexity | Medium |
| Changes functionality | NO |
| Recommendation | Profile on iPhone; avoid blanket will-change |

### F-M5 — Layout shift (runtime)
| Field | Value |
|-------|-------|
| Status | **NOT VERIFIED** |
| File | — |
| Function / Component | CLS |
| Exact reason | No CLS lab; sticky CTAs/bottom nav/gallery are code risk factors only. |
| Impact | Unknown measured CLS |
| Risk | — |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Lighthouse mobile + CrUX |

### F-M6 — 100dvh + safe-area present
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `styles/rovexo/mobile-scroll-v1.css`, shell/inbox/checkout/home CSS |
| Function / Component | `100dvh`, `env(safe-area-inset-*)` |
| Exact reason | Mobile viewport and safe-area tokens used widely. |
| Impact | Safari dynamic toolbar / notch compatibility |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-M7 — visualViewport runtime unused
| Field | Value |
|-------|-------|
| Status | ❌ Missing (runtime) |
| File | `lib/mobile-first/mobile-first-absolute-law-v1.ts` (+ test) |
| Function / Component | Law/SSOT only |
| Exact reason | `visualViewport` appears in law/test only — **not** in product UI handlers. |
| Impact | Keyboard/open Safari layout risk on forms (Sell, Messages composer) |
| Risk | Medium on iPhone Safari |
| Complexity | Medium |
| Changes functionality | YES if poorly applied |
| Recommendation | Owner-approved keyboard/visualViewport handling where composers fail |

---

## 4. Images

### F-I1 — SafeImage SSOT
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `components/ui/SafeImage.tsx` |
| Function / Component | `SafeImage` |
| Exact reason | Validates src; `next/image` when valid; placeholder `<img>` on fail; failed-src cache. |
| Impact | No broken-image icons; optimizer used |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-I2 — AVIF / WebP
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `next.config.ts` |
| Function / Component | `images.formats` |
| Exact reason | `image/avif`, `image/webp`. |
| Impact | Smaller mobile payloads |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-I3 — priority + sizes on LCP candidates
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `components/ui/ListingCard.tsx`; homepage feeds; `features/product-detail/ProductGalleryV1.tsx` |
| Function / Component | `priority`, `sizes`, `loading` |
| Exact reason | Homepage early cards `priority`; PDP first image `priority` + `quality={90}` + `sizes="100vw"`. |
| Impact | LCP-aware pattern |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep first-N priority discipline |

### F-I4 — No blur LQIP
| Field | Value |
|-------|-------|
| Status | ❌ Missing |
| File | — |
| Function / Component | `placeholder="blur"` / `blurDataURL` |
| Exact reason | **0** matches. |
| Impact | Empty feel / possible perceived CLS |
| Risk | Low |
| Complexity | Medium |
| Changes functionality | NO |
| Recommendation | Optional remote blur if generation path exists — Owner gate |

### F-I5 — Preconnect
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `app/layout.tsx` |
| Function / Component | `preconnect` |
| Exact reason | Supabase origin + Stripe preconnect. |
| Impact | Faster media/payment connect |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

---

## 5. Fonts

### F-F1 — next/font Geist with swap + subsets
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `app/layout.tsx` |
| Function / Component | `Geist`, `Geist_Mono` via `next/font/google` |
| Exact reason | `subsets: ["latin"]`, `display: "swap"`; sans `preload: true`, mono `preload: false`. |
| Impact | Correct font loading |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep; do not add more Google fonts without Owner |

### F-F2 — Duplicate font-family declarations in account CSS
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `styles/rovexo/account.css`, `account-center.css`, `account-2026.css` |
| Function / Component | CSS `font-family` |
| Exact reason | Geist stack repeated across account CSS files. |
| Impact | Negligible runtime; CSS duplication |
| Risk | Low |
| Complexity | Low |
| Changes functionality | NO |
| Recommendation | Centralize tokens if CSS cleanup authorized |

---

## 6. CSS

### F-C1 — Auth CSS entry isolated
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `app/(auth)/layout.tsx`, `styles/rovexo/auth-entry.css` |
| Function / Component | Auth CSS entry |
| Exact reason | Auth loads limited sheets; platform index not on login. |
| Impact | Login LCP isolation |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-C2 — Platform CSS megabundle
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `styles/rovexo/index.css` (111 `@import`s), loaded via `app/(platform)/layout.tsx` |
| Function / Component | Platform CSS index |
| Exact reason | Includes Super Admin / enterprise / mission-control sheets for **all** platform routes. |
| Impact | Large CSS download/parse on mobile marketplace (Homepage, Inbox, Sell…) |
| Risk | Medium–High if split wrong |
| Complexity | High |
| Changes functionality | YES if wrong sheet omitted |
| Recommendation | Route-split admin CSS; keep marketplace-critical only — Owner gate |

### F-C3 — Homepage extra CSS imports
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `app/(platform)/page.tsx` |
| Function / Component | Homepage CSS imports |
| Exact reason | Imports `homepage-canonical.css`, responsive, `header-v2.css` **plus** platform `index.css`. |
| Impact | Extra CSS on `/` |
| Risk | Low–Medium |
| Complexity | Medium |
| Changes functionality | YES if overlap removed badly |
| Recommendation | Confirm overlap with `index.css` home-* imports |

### F-C4 — Automated critical CSS extraction
| Field | Value |
|-------|-------|
| Status | ❌ Missing / **NOT VERIFIED** tooling |
| File | — |
| Function / Component | Critical CSS pipeline |
| Exact reason | No evidence of automated critical-CSS extraction beyond route-split entries. |
| Impact | Unknown LCP CSS savings |
| Risk | Medium |
| Complexity | High |
| Changes functionality | YES if mis-extracted |
| Recommendation | Measure first; then split admin CSS |

---

## 7. Supabase

### F-S1 — Product / conversation indexes present
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | e.g. `supabase/migrations/20250618000001_foundation_schema.sql`, `20250715000001_enterprise_performance_indexes.sql`, `20250716000001_production_catalog_indexes.sql` |
| Function / Component | `CREATE INDEX` / partial indexes |
| Exact reason | Indexes on products (seller, status, category, created_at, trgm), conversations, messages. |
| Impact | Query plan support for marketplace reads |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep; live EXPLAIN **NOT VERIFIED** |

### F-S2 — Homepage SSR parallel fetches
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `app/(platform)/page.tsx` |
| Function / Component | `Promise.all` (visual + feed + showcase + preferred stores) |
| Exact reason | Parallel server fetches on homepage. |
| Impact | Lower TTFB vs sequential |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-S3 — Following Feed N+1 / fan-out
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `lib/following-feed/store.ts` |
| Function / Component | `getFollowingFeedPage`, `loadBadgeLabels` |
| Exact reason | Up to `MAX_FOLLOWED_SELLERS = 40` × `getEligibleListings`; badges via `sellerIds.map → getPublicBadges`. Note: Following feed **not** mounted on Canonical Homepage (`CanonicalHomepage.tsx` comment). |
| Impact | High DB fan-out when Following surface used (mobile data + latency) |
| Risk | Medium |
| Complexity | Medium–High |
| Changes functionality | NO if batched |
| Recommendation | Batch listings + badges single-query / `.in()` |

### F-S4 — Browse 10 parallel count queries
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `lib/listings/eligible-listings.ts` → `getCanonicalBrowseCategoryCounts` |
| Function / Component | `Promise.all` over 10 roots |
| Exact reason | Parallel eligible counts per canonical root. |
| Impact | 10 count queries per browse load |
| Risk | Low–Medium |
| Complexity | Medium |
| Changes functionality | NO if aggregate RPC |
| Recommendation | Consider single aggregate / materialized counts |

### F-S5 — Category API no-store; client session cache
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `app/api/categories/tree/route.ts`, `lib/categories/category-loader.ts` |
| Function / Component | `jsonWithCache(..., "no-store")`, sessionStorage TTL |
| Exact reason | API not edge-cached; client sessionStorage 24h + Catalog Master epoch. |
| Impact | Cold clients pay full tree fetch |
| Risk | Medium (Catalog Master fail-closed) |
| Complexity | Medium |
| Changes functionality | YES if stale taxonomy |
| Recommendation | Preserve fail-closed; optional short CDN cache with epoch key |

### F-S6 — Search in-memory cache for trending/popular
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `lib/search/cache.ts` |
| Function / Component | `withSearchCache` |
| Exact reason | Process-local Map + TTL (~60s) for trending/popular helpers. |
| Impact | Reduces repeat trending load |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-S7 — Listing slug React.cache dedupe
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `lib/products/repository.ts` |
| Function / Component | `cache(getProductBySlug…)` |
| Exact reason | Metadata + page share one fetch per request. |
| Impact | Avoids duplicate PDP query |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-S8 — Live EXPLAIN / index hit rates
| Field | Value |
|-------|-------|
| Status | **NOT VERIFIED** |
| File | — |
| Function / Component | Production DB |
| Exact reason | No production query plans captured. |
| Impact | Unknown |
| Risk | — |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Owner-approved DB observability pass |

---

## 8. Memory

### F-MEM1 — Feature intervals cleared
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | e.g. `SearchInputActions.tsx`, `VerifyEmailScreen.tsx`, mission-control refresh |
| Function / Component | `setInterval` / `clearInterval` |
| Exact reason | Sampled feature intervals clear on cleanup. |
| Impact | Leak avoidance |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-MEM2 — Observers disconnect
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `CanonicalMarketplaceFeed.tsx`, `InboxPage.tsx`, `lib/performance/hooks.ts`, Sell clearance hook |
| Function / Component | `IntersectionObserver` / `ResizeObserver` |
| Exact reason | `disconnect()` in effect cleanup. |
| Impact | Memory stability on infinite scroll |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-MEM3 — SearchOverlay close timeout
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `features/search` SearchOverlay close path |
| Function / Component | `setTimeout` on close |
| Exact reason | Transition timeout may not clear if unmount mid-transition (minor stale-callback risk). |
| Impact | Low |
| Risk | Low |
| Complexity | Low |
| Changes functionality | NO |
| Recommendation | Clear timeout on unmount |

### F-MEM4 — Sleep/wake channel leak stress
| Field | Value |
|-------|-------|
| Status | **NOT VERIFIED** |
| File | Realtime modules |
| Function / Component | Keep-alive on hidden |
| Exact reason | Code intends cleanup on unmount/sign-out; production sleep/wake leak not measured. |
| Impact | Unknown |
| Risk | Medium |
| Complexity | Medium |
| Changes functionality | NO |
| Recommendation | Device certification with backgrounding |

---

## 9. SEO

### F-SEO1 — Root metadata + OG + Twitter
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `app/layout.tsx` |
| Function / Component | `metadata` |
| Exact reason | Title template, description, OpenGraph (`en_GB`, og-image 1200×630), Twitter `summary_large_image`, canonical `/`, `metadataBase`. |
| Impact | Strong default SEO |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-SEO2 — Page-level generateMetadata (listing/search/category)
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | listing/search/category pages; `lib/seo/metadata.ts`, `lib/seo/engine/metadata.ts` |
| Function / Component | `generateMetadata` / `buildPageMetadata` / `productPageMetadata` |
| Exact reason | Per-surface title, description, canonical, robots, OG, Twitter. Search query/`visual` → noIndex. |
| Impact | Index control |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-SEO3 — robots.ts + sitemap
| Field | Value |
|-------|-------|
| Status | ✅ Complete (with gaps below) |
| File | `app/robots.ts`, `app/sitemap.ts`, `next.config.ts` sitemap rewrite |
| Function / Component | `robots()`, sitemap ids, `/api/seo/sitemap-index` |
| Exact reason | Allow `/`; disallow admin/api/checkout/account/auth/messages/orders/saved/…; multi sitemap list. Private mode disallow `/`. |
| Impact | Crawl governance |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep; verify live HTTP **NOT VERIFIED** |

### F-SEO4 — robots omit `/wallet` and `/inbox`
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `app/robots.ts` |
| Function / Component | `disallow` list |
| Exact reason | `/orders/` and `/messages/` disallowed; **`/wallet` and `/inbox` not listed**. Auth enforcement at runtime **NOT VERIFIED**. |
| Impact | Potential crawl of private hubs if publicly reachable |
| Risk | Medium |
| Complexity | Low |
| Changes functionality | NO (robots only) |
| Recommendation | Add disallow if those routes should never be indexed |

### F-SEO5 — JSON-LD Organization / WebSite SearchAction / Product / Breadcrumb / FAQ
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `lib/seo/metadata.ts` `organizationJsonLd`; `lib/seo/json-ld.ts` `productJsonLd`; homepage/category/help FAQ; `components/seo/JsonLdScript.tsx` |
| Function / Component | JSON-LD injectors |
| Exact reason | Organization + WebSite SearchAction on root; Product + BreadcrumbList on listing; CollectionPage + FAQ on category/help. |
| Impact | Rich-result eligibility (live validation **NOT VERIFIED**) |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep; validate in Google Rich Results Test later |

### F-SEO6 — Homepage missing H1
| Field | Value |
|-------|-------|
| Status | ❌ Missing |
| File | `components/homepage/canonical/CanonicalHomepage.tsx` |
| Function / Component | CanonicalHomepage |
| Exact reason | Rail + showcase + feed; `ScrollContainer` as main; **no `<h1>`**. Empty state uses `<p>` pattern elsewhere. |
| Impact | SEO/a11y heading hierarchy gap on primary landing |
| Risk | Medium (CEO Homepage freeze) |
| Complexity | Low–Medium |
| Changes functionality | YES (visual/copy) |
| Recommendation | Owner-approved visually hidden or brand H1 only |

### F-SEO7 — Search landing missing H1
| Field | Value |
|-------|-------|
| Status | ❌ Missing |
| File | `features/search/components/SearchLandingView.tsx` |
| Function / Component | SearchLandingView |
| Exact reason | Sections use `<h2>`; no H1. Results view has H1 (`SearchResultsView.tsx`). |
| Impact | Hierarchy gap on idle `/search` |
| Risk | Medium (SEARCH_UI freeze) |
| Complexity | Low |
| Changes functionality | YES |
| Recommendation | Owner-approved H1 without UI redesign |

### F-SEO8 — hreflang scaffold unused
| Field | Value |
|-------|-------|
| Status | ❌ Missing (in HTML metadata) |
| File | `lib/seo/engine/markets-v2.ts` `buildHreflangAlternates`; exported via `lib/seo/engine/index.ts` |
| Function / Component | `buildHreflangAlternates` |
| Exact reason | Builder exists; **not wired** into page `metadata.alternates.languages` on homepage/listing/search. Markets UK-only. |
| Impact | No hreflang link tags from pages |
| Risk | Low while UK-only |
| Complexity | Low |
| Changes functionality | NO |
| Recommendation | Wire when multi-market launches; until then treat health `hreflangReady` as scaffold-only |

### F-SEO9 — SafeImage empty alt default
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `components/ui/SafeImage.tsx` |
| Function / Component | `alt` prop default `""` |
| Exact reason | Decorative default; ListingCard/gallery pass titles; `productImageAlt()` helper unused in PDP UI. |
| Impact | Risk if callers omit alt |
| Risk | Low–Medium |
| Complexity | Low |
| Changes functionality | NO if callers fixed |
| Recommendation | Require alt at call sites for content images |

### F-SEO10 — Live sitemap / indexing / private mode env
| Field | Value |
|-------|-------|
| Status | **NOT VERIFIED** |
| File | — |
| Function / Component | Production crawl |
| Exact reason | Live `https://www.rovexo.co.uk/sitemap.xml` and private-mode env not checked in this pass. |
| Impact | Unknown live indexability |
| Risk | — |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Owner live crawl check |

---

## 10. Core Web Vitals (ESTIMATE FROM CODE — not measured)

| Metric | Estimate from implementation | Evidence drivers | Status |
|--------|------------------------------|------------------|--------|
| **LCP** | Mixed / risk on Homepage | Client `CanonicalHomepage`; feed `priority` early cards; PDP gallery priority; Geist preload; CSS megabundle | ESTIMATE · field **NOT VERIFIED** |
| **CLS** | Moderate risk | Sticky CTAs, bottom nav, gallery, infinite append; SafeImage fill containers | ESTIMATE · **NOT VERIFIED** |
| **INP** | Risk on hubs | Large client hubs (`ConversationHub`, PDP, Checkout, SearchResults); framer-motion present | ESTIMATE · **NOT VERIFIED** |
| **FCP** | Helped by auth CSS split; hurt by platform CSS size | Auth entry vs 111 platform imports | ESTIMATE · **NOT VERIFIED** |
| **TTFB** | Homepage ISR 60s helps; listing `force-dynamic` hurts; checkout self-heal await on homepage | `revalidate`, `force-dynamic`, `awaitCheckoutSessionSelfHeal` | ESTIMATE · **NOT VERIFIED** |
| **TBT** | Likely elevated by client density + CSS parse | 759 client modules | ESTIMATE · **NOT VERIFIED** |

### F-CWV1 — Homepage client reconcile vs LCP
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `components/homepage/canonical/CanonicalMarketplaceFeed.tsx` |
| Function / Component | mount `loadPage(1, "replace")` |
| Exact reason | Client **always** replaces SSR seed with `/api/homepage/feed?page=1` (documented ISR freshness fix). |
| Impact | Extra network + potential LCP/INP work on every Homepage visit |
| Risk | Medium |
| Complexity | Medium |
| Changes functionality | YES if reconcile removed (stale risk) |
| Recommendation | Soften reconcile (ETag / hash compare) after Owner approval |

---

## 11. PWA

### F-PWA1 — Manifest
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `app/manifest.ts` |
| Function / Component | Web app manifest |
| Exact reason | name/short_name, standalone, icons incl. maskable, shortcuts, `start_url: "/"`. |
| Impact | Installable metadata |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep; Favicon/PWA Icon Freeze v1.0 applies |

### F-PWA2 — Service worker + offline
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `public/sw.js`, `components/pwa/PwaProvider.tsx`, `app/(platform)/offline/page.tsx` |
| Function / Component | SW register / precache / offline |
| Exact reason | Prod registers `/sw.js`; localhost unregisters; avoids RSC/flight intercept; financial offline → fail-closed HTML; offline page exists. |
| Impact | Offline shell |
| Risk | Medium (SW regressions) |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep RSC/financial guards |

### F-PWA3 — iOS startup splash images
| Field | Value |
|-------|-------|
| Status | ❌ Missing |
| File | — |
| Function / Component | `apple-touch-startup-image` |
| Exact reason | **0** matches. Auth Splash removed by product law. |
| Impact | iOS installed-PWA launch flash |
| Risk | Low (visual) |
| Complexity | Medium |
| Changes functionality | NO (assets only) |
| Recommendation | Only if Owner wants iOS splash assets |

### F-PWA4 — Install prompt
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `components/pwa/PwaProvider.tsx` |
| Function / Component | `beforeinstallprompt` banner |
| Exact reason | Custom install banner path present. |
| Impact | A2HS |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

---

## 12. Accessibility

### F-A1 — Skip link + main landmark
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `AppShellLayout.tsx`, `styles/rovexo/skip-link-v1.css`, Homepage `ScrollContainer id="main-content"` |
| Function / Component | Skip link / `#main-content` |
| Exact reason | Skip link + main content id on key shells. |
| Impact | Keyboard entry |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-A2 — Form labels (auth sample)
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `CanonicalInput`, LoginScreen |
| Function / Component | `htmlFor` / `label` |
| Exact reason | Auth inputs labeled. |
| Impact | Form a11y |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-A3 — Reduced motion widespread
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `app/globals.css`, PremiumButton, auth/product/search CSS |
| Function / Component | `prefers-reduced-motion` |
| Exact reason | CSS (+ some JS) respects reduced motion. |
| Impact | Vestibular safety |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-A4 — Runtime WCAG / axe
| Field | Value |
|-------|-------|
| Status | **NOT VERIFIED** |
| File | `e2e/accessibility-certification.spec.ts`, `e2e/helpers/accessibility-certification.ts` |
| Function / Component | Playwright axe helpers |
| Exact reason | Specs exist; **not executed** in this audit. |
| Impact | Unknown live WCAG score |
| Risk | — |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Run Owner-approved a11y certification |

### F-A5 — Homepage / Search landing H1
| Field | Value |
|-------|-------|
| Status | ❌ Missing |
| File | CanonicalHomepage, SearchLandingView |
| Function / Component | Heading hierarchy |
| Exact reason | Same as F-SEO6 / F-SEO7. |
| Impact | Screen reader / SEO hierarchy |
| Risk | Medium |
| Complexity | Low |
| Changes functionality | YES |
| Recommendation | Owner-approved H1 |

---

## 13. Security

### F-SEC1 — Security headers configured
| Field | Value |
|-------|-------|
| Status | ✅ Complete (config) |
| File | `next.config.ts`, `lib/ops/security-headers.ts` |
| Function / Component | `buildSecurityHeaders` |
| Exact reason | XFO DENY, nosniff, Referrer-Policy, Permissions-Policy; prod HSTS preload, CSP, COOP. |
| Impact | Strong baseline |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep; live delivery **NOT VERIFIED** |

### F-SEC2 — CSP `'unsafe-inline'` residual
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `lib/ops/security-headers.ts` `PRODUCTION_CSP`, `CSP_RESIDUAL_JUSTIFICATIONS` |
| Function / Component | CSP |
| Exact reason | `'unsafe-inline'` on script/style documented as required for Next + Stripe; no `'unsafe-eval'`. |
| Impact | XSS residual risk vs payment compatibility |
| Risk | Medium |
| Complexity | High (nonce sprint) |
| Changes functionality | YES if nonce breaks Checkout |
| Recommendation | Dedicated CSP nonce sprint only with Owner |

### F-SEC3 — Gzip compress true; Brotli
| Field | Value |
|-------|-------|
| Status | ✅ Complete (Gzip) · **NOT VERIFIED** (Brotli) |
| File | `next.config.ts` `compress: true` |
| Function / Component | Next compress |
| Exact reason | Gzip enabled in Next; Brotli typically host/edge — not configured in-repo. |
| Impact | Transfer size |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Confirm Vercel Brotli live |

### F-SEC4 — Immutable cache for static brand/icons
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `lib/ops/performance-headers.ts` |
| Function / Component | Performance route headers |
| Exact reason | Long-cache immutable for icons/brand/categories/favicons. |
| Impact | Repeat-visit perf |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep (Favicon freeze + cache-bust policy) |

### F-SEC5 — Live production headers
| Field | Value |
|-------|-------|
| Status | **NOT VERIFIED** |
| File | — |
| Function / Component | HTTPS responses |
| Exact reason | No live header capture this pass. |
| Impact | Unknown |
| Risk | — |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | `curl -I https://www.rovexo.co.uk` under Owner ops |

---

## 14. Production Readiness

### F-PR1 — console.log hygiene
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `app/`, `features/` |
| Function / Component | — |
| Exact reason | **0** `console.log` in app/features; gated homepage feed debug behind `NEXT_PUBLIC_HOMEPAGE_FEED_DEBUG`; prod `removeConsole` excludes error/warn. |
| Impact | Clean production clients |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-PR2 — TODO/FIXME
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | app/features/components/lib |
| Function / Component | — |
| Exact reason | **0** word-boundary TODO/FIXME matches. |
| Impact | No documented unfinished markers in those trees |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-PR3 — Heavy `xlsx` dependency
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `package.json`; `lib/seller/migration/connectors/file/xlsx-parser.ts` |
| Function / Component | `xlsx` |
| Exact reason | Heavy SheetJS present for seller migration. |
| Impact | Risk if pulled into client graph |
| Risk | Medium |
| Complexity | Medium |
| Changes functionality | NO if server-only |
| Recommendation | Ensure server/dynamic-only; never homepage path |

### F-PR4 — Duplicate libraries / dead code volume
| Field | Value |
|-------|-------|
| Status | **NOT VERIFIED** (full dead-code map) |
| File | archive/, apps/ |
| Function / Component | — |
| Exact reason | Full unused-export analysis not run; archive exists but out of runtime path by convention. |
| Impact | Unknown bundle waste |
| Risk | — |
| Complexity | High |
| Changes functionality | NO |
| Recommendation | Owner-approved knip/depcheck later |

---

## 15. Bundle Analysis

### F-B1 — Dependency posture
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `package.json` |
| Function / Component | dependencies |
| Exact reason | No moment / full lodash / date-fns; Next 16.3 / React 19.2; framer-motion + lucide + stripe + supabase + zod. |
| Impact | Relatively lean marketplace stack |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep avoiding moment/lodash-full |

### F-B2 — optimizePackageImports
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `next.config.ts` |
| Function / Component | `experimental.optimizePackageImports` |
| Exact reason | lucide-react, react-hook-form, resolvers, zod, framer-motion. |
| Impact | Tree-shake icons/forms/motion |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-B3 — Largest bundles / duplicated packages (measured)
| Field | Value |
|-------|-------|
| Status | **NOT VERIFIED** |
| File | — |
| Function / Component | Bundle analyzer |
| Exact reason | Analyzer not run. |
| Impact | Unknown |
| Risk | — |
| Complexity | Low to run |
| Changes functionality | NO |
| Recommendation | Run under QA |

### F-B4 — Dynamic import candidates (code-evident)
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | Heavy client hubs / admin CSS / `xlsx` |
| Function / Component | ConversationHub, admin sheets, xlsx |
| Exact reason | Large client modules and admin CSS load on marketplace shell. |
| Impact | Mobile JS/CSS weight |
| Risk | Medium |
| Complexity | High |
| Changes functionality | YES if split wrong |
| Recommendation | Dynamic/route-split after Owner |

---

## 16. Network

### F-NET1 — Homepage SSR + client page-1
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `app/(platform)/page.tsx`, `CanonicalMarketplaceFeed.tsx` |
| Function / Component | SSR feed + `loadPage(1,"replace")` |
| Exact reason | Duplicate page-1 transfer by design. |
| Impact | Extra mobile RTT/bytes on every visit |
| Risk | Medium |
| Complexity | Medium |
| Changes functionality | YES if reconcile removed |
| Recommendation | Conditional reconcile |

### F-NET2 — Search AbortController
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `use-search-results.ts`, `SearchResultsView.tsx` |
| Function / Component | AbortController |
| Exact reason | Aborts previous query on new input. |
| Impact | Cancels stale search waterfalls |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-NET3 — shareInflightJson coalesce
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `lib/performance/fetch.ts` (used by CanonicalMarketplaceFeed) |
| Function / Component | `shareInflightJson` |
| Exact reason | Coalesces identical in-flight homepage page-1 GETs. |
| Impact | Dedupes Strict Mode / parallel callers |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep; extend carefully |

### F-NET4 — Measured waterfalls (devtools)
| Field | Value |
|-------|-------|
| Status | **NOT VERIFIED** |
| File | — |
| Function / Component | — |
| Exact reason | No Safari/Chrome Network panel capture. |
| Impact | Unknown |
| Risk | — |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Mobile network audit on device |

---

## 17. Listing / surface performance

| Surface | Status | Evidence | Mobile note |
|---------|--------|----------|-------------|
| Homepage | 🟡 | SSR parallel + client CanonicalHomepage + page-1 replace + IO infinite scroll | Double fetch; client shell |
| Search | 🟡 | Debounce 300ms; AbortController; page size 8; landing vs results | Good debounce; no virtualization |
| Browse | 🟡 | `revalidate=300`; 10 parallel counts → SearchLandingView | Count fan-out |
| Listing | 🟡 | `force-dynamic` + React.cache slug; client ProductDetailPage | Dynamic TTFB + large client PDP |
| Sell | 🟡 | Server profile; client SellPage; category session cache | Photo/camera heavy (not re-audited here) |
| Messages/Inbox | 🟡 | Thin server; client InboxPage + realtime; IO pagination | Client-heavy |
| Orders | ✅/🟡 | Server parallel bought/sold + client + realtime cleanup | Moderate |
| Wallet | ✅/🟡 | Server wallet + client live channel cleanup | Moderate |
| Profile/Account | 🟡 | Profile then parallel wallet/snapshot/settings | Partial waterfall |

**Following feed on Homepage:** not mounted (`CanonicalHomepage` comment) — N+1 applies when Following surface is used elsewhere.

---

## 18. Infinite Scroll

### F-IS1 — No marketplace virtualization library
| Field | Value |
|-------|-------|
| Status | ❌ Missing |
| File | `package.json` |
| Function / Component | react-window / virtua / @tanstack/react-virtual |
| Exact reason | Dependencies absent. Admin-only custom `useVirtualList` exists. |
| Impact | Homepage/Search/Inbox DOM growth → memory/scroll cost on mobile |
| Risk | Medium |
| Complexity | High (freeze-sensitive) |
| Changes functionality | YES if wrong |
| Recommendation | Owner-approved virtualization for long feeds only |

### F-IS2 — IntersectionObserver pagination present
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | CanonicalMarketplaceFeed, InboxPage, Search hooks |
| Function / Component | IntersectionObserver sentinels |
| Exact reason | Load-more via sentinel; disconnect on cleanup. |
| Impact | Infinite scroll works without full virtualization |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep; pair with virtualization later |

### F-IS3 — Showcase not infinite
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | FeaturedStoreSection / CEO freeze |
| Function / Component | Showcase rail |
| Exact reason | Horizontal 9 + View All; no infinite scroll (law). |
| Impact | Bounded showcase memory |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep frozen |

---

## 19. Realtime

### F-RT1 — Channel cleanup patterns
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `lib/inbox/realtime.ts`, `conversation-realtime.ts`, `lib/notifications/realtime.ts`, `RealtimeNotificationProvider.tsx`, search/following/orders/wallet realtime modules |
| Function / Component | `removeChannel` / `unsubscribe` |
| Exact reason | Documented cleanup on unmount/sign-out across major realtime modules. |
| Impact | Leak avoidance |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-RT2 — Reconnect under backgrounding
| Field | Value |
|-------|-------|
| Status | **NOT VERIFIED** |
| File | Realtime keep-alive paths |
| Function / Component | visibility / online listeners |
| Exact reason | Code has online/visibility handlers; Safari background reconnect not measured. |
| Impact | Unknown badge/message freshness after sleep |
| Risk | Medium |
| Complexity | Medium |
| Changes functionality | NO |
| Recommendation | iPhone Safari background test |

---

## 20. Search

### F-SE1 — Debounce 300ms
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | `features/search/types/index.ts`, `useDebouncedValue` |
| Function / Component | `SEARCH_DEBOUNCE_MS = 300` |
| Exact reason | Debounced search wiring present; visibility-aware debounce skips when hidden. |
| Impact | Fewer fetches while typing |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-SE2 — Abort + idle path
| Field | Value |
|-------|-------|
| Status | ✅ Complete |
| File | search hooks / `searchAll` idle path |
| Function / Component | AbortController; idle recent+trending |
| Exact reason | Idle avoids product fan-out; abort cancels stale. |
| Impact | Mobile network savings |
| Risk | Low |
| Complexity | — |
| Changes functionality | NO |
| Recommendation | Keep |

### F-SE3 — Query result TTL cache
| Field | Value |
|-------|-------|
| Status | 🟡 Can be optimized |
| File | `lib/search/cache.ts` vs results path |
| Function / Component | `withSearchCache` |
| Exact reason | Trending/popular cached; full query results not shown as TTL-cached beyond abort/coalesce. |
| Impact | Repeat identical queries refetch |
| Risk | Low–Medium |
| Complexity | Medium |
| Changes functionality | NO if short TTL |
| Recommendation | Optional short TTL for identical queries |

---

## 21. Safari Audit

| Finding | Status | Evidence | Note |
|---------|--------|----------|------|
| `100dvh` / safe-area | ✅ | mobile-scroll + shells | Good |
| `-webkit-overflow-scrolling` / tap-highlight / appearance | ✅ | styles/rovexo | Present |
| `visualViewport` handlers | ❌ | law only | Keyboard risk |
| Passive scroll listeners | ✅ partial | headers/feed window | Good where present |
| iOS PWA splash | ❌ | no startup images | Launch flash |
| Safari FPS/INP | **NOT VERIFIED** | — | Need device lab |
| Favicon/PWA pearl icons | ✅ (prior freeze) | Favicon freeze v1.0 | Do not redesign |

---

## 22. Android Audit

| Finding | Status | Evidence | Note |
|---------|--------|----------|------|
| Manifest + maskable icons | ✅ | `app/manifest.ts` | Install |
| SW register in production | ✅ | PwaProvider | Chrome/Samsung |
| `beforeinstallprompt` | ✅ | PwaProvider | Chrome |
| Samsung Internet specifics | **NOT VERIFIED** | — | No Samsung-only code found |
| Android Chrome CWV | **NOT VERIFIED** | — | Need lab |
| Touch-action pan-y | ✅ | mobile-scroll-v1.css | Present |

---

## 23. Production Risk Matrix

| ID | Priority | Theme |
|----|----------|-------|
| F-C2 Platform CSS megabundle | **P0** | Mobile FCP/LCP |
| F-N2 Client density | **P0** | Mobile TBT/INP |
| F-NET1 / F-CWV1 Homepage double fetch | **P0** | Mobile network + LCP |
| F-S3 Following Feed fan-out | **P1** | Mobile latency when used |
| F-N9 Listing force-dynamic | **P1** | SEO TTFB + crawl cost |
| F-IS1 No virtualization | **P1** | Memory/scroll on long feeds |
| F-SEO6/7 Missing H1 | **P1** | SEO + a11y |
| F-SEO4 robots wallet/inbox | **P1** | Crawl risk |
| F-M7 visualViewport missing | **P1** | Safari keyboard |
| F-SEC2 CSP unsafe-inline | **P2** | Security residual |
| F-I4 No blur LQIP | **P2** | Perceived perf |
| F-SEO8 hreflang unused | **P2** | Multi-market readiness |
| F-PWA3 No iOS splash | **P3** | Visual polish |
| F-F2 Duplicate font CSS | **P3** | Cleanup |
| Runtime CWV/FPS/a11y/Brotli/live headers | **P0 verification debt** | **NOT VERIFIED** — blocks true production score |

---

# TOP 100 — Ranked opportunities

Order: Highest impact · Lowest regression risk · Mobile-first · SEO value.  
**Functional change:** YES/NO. **Estimated gain:** qualitative (code-only; not measured).

| # | Priority | Item | Est. gain | Regression risk | Complexity | Functional change |
|--:|----------|------|-----------|-----------------|------------|-------------------|
| 1 | P0 | Split admin/enterprise CSS out of platform `index.css` | High mobile FCP/CSS parse | Medium | High | YES if omit wrong sheet |
| 2 | P0 | Measure mobile LCP/INP/CLS on iPhone Safari + Android Chrome | Truth for all scores | None | Low | NO |
| 3 | P0 | Soften Homepage page-1 reconcile (hash/ETag skip) | High network/LCP | Medium | Medium | YES if stale |
| 4 | P0 | Reduce root client provider fan-out | Medium–High TBT | Medium | High | YES if mis-scoped |
| 5 | P0 | Confirm live CSP/HSTS/Brotli on www.rovexo.co.uk | Security/perf truth | None | Low | NO |
| 6 | P0 | Run axe a11y certification suite | A11y truth | None | Low | NO |
| 7 | P1 | Batch Following Feed listings + badges | High when Following used | Medium | Medium | NO |
| 8 | P1 | Evaluate published-listing ISR vs force-dynamic | SEO TTFB | Medium | Medium | YES freshness |
| 9 | P1 | Add `/wallet` `/inbox` to robots disallow | Crawl hygiene | Low | Low | NO |
| 10 | P1 | Owner-approved Homepage H1 | SEO/a11y | Medium (freeze) | Low | YES |
| 11 | P1 | Owner-approved Search landing H1 | SEO/a11y | Medium (freeze) | Low | YES |
| 12 | P1 | Selective Link `prefetch={false}` on dense lists | Mobile data | Low | Low | NO |
| 13 | P1 | PDP Suspense streaming for non-critical chrome | TTFB feel | Low | Medium | NO |
| 14 | P1 | Virtualize Homepage feed (Owner + freeze gate) | Memory/scroll | High | High | YES |
| 15 | P1 | Virtualize Search results | Memory/scroll | High | High | YES |
| 16 | P1 | Virtualize Inbox list | Memory/scroll | High | High | YES |
| 17 | P1 | Safari visualViewport for composers (keyboard) | Safari UX | Medium | Medium | YES |
| 18 | P1 | Browse category counts → single aggregate | DB load | Medium | Medium | NO |
| 19 | P1 | `unstable_cache` / tags for homepage feed | TTFB/DB | Medium | Medium | NO |
| 20 | P1 | Ensure `xlsx` never in client graph | Bundle safety | Low | Low | NO |
| 21 | P1 | Narrow RealtimeNotification consumers | INP | Medium | Medium | NO |
| 22 | P1 | Extract static PDP sections to RSC (Owner) | Listing JS | High | High | YES |
| 23 | P1 | Confirm Showcase reservedIds + feed not duplicating network | Network | Low | Low | NO |
| 24 | P1 | Category tree short CDN cache with epoch key | Cold start | Medium | Medium | YES taxonomy |
| 25 | P2 | Wire hreflang when multi-market | SEO | Low | Low | NO |
| 26 | P2 | CSP nonce sprint (Owner) | XSS posture | High | High | YES Checkout risk |
| 27 | P2 | Optional blur LQIP for listing images | Perceived LCP | Low | Medium | NO |
| 28 | P2 | Clear SearchOverlay transition timeout on unmount | Tiny leak | Low | Low | NO |
| 29 | P2 | Audit remaining non-passive listeners | Scroll | Low | Low | NO |
| 30 | P2 | Profile will-change overuse on iPhone | GPU memory | Medium | Medium | NO |
| 31 | P2 | Short TTL cache identical search queries | Network | Low | Medium | NO |
| 32 | P2 | more `next/dynamic` for rare overlays | JS | Low | Low | NO |
| 33 | P2 | Centralize account font-family CSS | CSS bytes | Low | Low | NO |
| 34 | P2 | Confirm homepage CSS overlap with index | CSS bytes | Medium | Medium | YES |
| 35 | P2 | Account page profile waterfall → fuller parallel | TTFB | Low | Low | NO |
| 36 | P2 | Use `productImageAlt` in PDP gallery | SEO/a11y | Low | Low | NO |
| 37 | P2 | Require SafeImage alt for content images | a11y | Low | Low | NO |
| 38 | P2 | Sleep/wake realtime reconnect certification | Reliability | Medium | Medium | NO |
| 39 | P2 | Samsung Internet install + SW smoke | Android | Low | Low | NO |
| 40 | P2 | Android Chrome CWV lab | Truth | None | Low | NO |
| 41 | P2 | Bundle analyzer CI artifact | Truth | None | Low | NO |
| 42 | P2 | Check `@stripe/stripe-js` import graph | Bundle | Low | Low | NO |
| 43 | P2 | Audit framer-motion call sites on Homepage | INP | Medium | Medium | YES motion |
| 44 | P2 | Inbox Event Engine sync under low network | Reliability | Medium | Medium | NO |
| 45 | P2 | Preload LCP image URL on listing metadata | LCP | Low | Low | NO |
| 46 | P2 | Review `awaitCheckoutSessionSelfHeal` cost on Homepage | TTFB | Medium | Medium | YES finance |
| 47 | P2 | Sell photo compression path already uses browser-image-compression — verify mobile HEIC | Sell | Medium | Medium | NO |
| 48 | P2 | Orders/Wallet live debounce sufficiency | INP | Low | Low | NO |
| 49 | P2 | Confirm maskable icons match Favicon freeze | PWA | Low | Low | NO |
| 50 | P2 | SW TEMP console probes cleanup if any remain | Hygiene | Low | Low | NO |
| 51 | P3 | iOS apple-touch-startup-image (Owner only) | Visual | Low | Medium | NO |
| 52 | P3 | Expand `generateStaticParams` for SEO locations only | SEO | Low | Medium | NO |
| 53 | P3 | Document hreflangReady vs HTML truth | Docs | None | Low | NO |
| 54 | P3 | Dead-code knip on archive | Maintainability | Low | High | NO |
| 55 | P3 | Duplicate package version audit | Bundle | Low | Low | NO |
| 56 | P3 | Edge candidate for pure static SEO HTML | TTFB | High | High | YES |
| 57 | P3 | FAQ schema coverage audit beyond help/category | SEO | Low | Low | NO |
| 58 | P3 | BreadcrumbList completeness on all category depths | SEO | Low | Medium | NO |
| 59 | P3 | Internal linking density audit (code only partial) | SEO | Low | Medium | NO |
| 60 | P3 | Duplicate content canonical audit live | SEO | Low | Medium | NO |
| 61 | P3 | Twitter card image CDN cache | SEO | Low | Low | NO |
| 62 | P3 | OG image AVIF alternate | Bytes | Low | Low | NO |
| 63 | P3 | Font subset further if non-latin unused | Bytes | Low | Low | NO |
| 64 | P3 | Mono font preload already false — keep | — | — | — | NO |
| 65 | P3 | Review `htmlLimitedBots` tradeoffs | SEO/perf | Low | Low | NO |
| 66 | P3 | Permissions-Policy camera self — confirm Sell/Camera Search | Security | Low | Low | NO |
| 67 | P3 | COOP same-origin interaction with OAuth popup | Auth | Medium | Medium | YES |
| 68 | P3 | Verify private-mode robots in staging | SEO | Low | Low | NO |
| 69 | P3 | Sitemap image index freshness | SEO | Low | Medium | NO |
| 70 | P3 | Prefer stores query cost on Homepage | TTFB | Low | Low | NO |
| 71 | P3 | Showcase seller batch already good — keep | — | — | — | NO |
| 72 | P3 | Holiday mode seller set batch — keep | — | — | — | NO |
| 73 | P3 | Trust enrich `.in` batch — keep | — | — | — | NO |
| 74 | P3 | Search realtime 250ms debounce — keep | — | — | — | NO |
| 75 | P3 | Document visibility-aware debounce | Docs | None | Low | NO |
| 76 | P3 | Super Admin virtual list pattern reuse | Perf | Medium | Medium | YES |
| 77 | P3 | Checkout UI freeze — no CSS perf redesign | Protect | — | — | NO |
| 78 | P3 | Conversation Hub freeze — no redesign for perf | Protect | — | — | NO |
| 79 | P3 | Auth freezes — no auth rewrite for perf | Protect | — | — | NO |
| 80 | P3 | Favicon freeze — block asset redesign | Protect | — | — | NO |
| 81 | P3 | ListingCard freeze — no card redesign | Protect | — | — | NO |
| 82 | P3 | SEARCH_UI freeze — H1 only if Owner | Protect | — | — | YES |
| 83 | P3 | Homepage CEO lock — H1 only if Owner | Protect | — | — | YES |
| 84 | P3 | Verify `outputFileTracingExcludes` still effective | Deploy size | Low | Low | NO |
| 85 | P3 | `productionBrowserSourceMaps: false` — keep | Security | — | — | NO |
| 86 | P3 | `poweredByHeader: false` — keep | Security | — | — | NO |
| 87 | P3 | GA debug flags default off — keep | Hygiene | — | — | NO |
| 88 | P3 | API `console.error` retention — acceptable | Ops | — | — | NO |
| 89 | P3 | Preconnect Stripe — keep | Perf | — | — | NO |
| 90 | P3 | Image `minimumCacheTTL` 30d — keep | Perf | — | — | NO |
| 91 | P3 | Auth CSS entry — keep as model for admin split | Pattern | — | — | NO |
| 92 | P3 | Wallet scoped CSS precedent — replicate for admin | Pattern | — | — | YES |
| 93 | P3 | Offline page — keep | PWA | — | — | NO |
| 94 | P3 | Financial offline RVX fail-closed — keep | Safety | — | — | NO |
| 95 | P3 | Middleware SW exclusion — keep | Correctness | — | — | NO |
| 96 | P3 | React Strict Mode double-invoke handled by shareInflight — keep | Correctness | — | — | NO |
| 97 | P3 | Mobile scroll `touch-action: pan-y` — keep | Safari/Android | — | — | NO |
| 98 | P3 | Body scroll lock cleanup — keep | Memory | — | — | NO |
| 99 | P3 | E2E mobile-device certification scripts exist — execute | Truth | None | Low | NO |
| 100 | P3 | Re-score after P0 measurements only | Process | None | Low | NO |

---

## Absolute constraints for any future work

1. **READ ONLY audit complete** — this document is the deliverable.  
2. No implementation from this audit without **explicit Owner approval**.  
3. Frozen modules (Homepage, Search UI, Checkout UI, Conversation Hub, Auth, Favicon/PWA Icon Freeze, Marketplace freeze, etc.) may only receive bug/security/perf fixes that **do not change Owner-approved visuals or behaviour**, unless Owner re-authorizes.  
4. Runtime scores (CWV, FPS, touch latency, live headers, Brotli, axe) remain **NOT VERIFIED** until measured on mobile production targets.

---

## Document control

| Field | Value |
|-------|-------|
| Document | `docs/audits/ROVEXO_MOBILE_PERFORMANCE_SEO_MASTER_AUDIT_v1.md` |
| Version | 1.0 |
| Mode | READ ONLY |
| Implementation | NONE |
| Commit / Push / Deploy | NONE |

**END OF AUDIT · STOP.**
