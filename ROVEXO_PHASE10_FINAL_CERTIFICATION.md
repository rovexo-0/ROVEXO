# ROVEXO PHASE 10 — FINAL MOBILE PERFORMANCE CERTIFICATION

**STATUS: FAIL · STOP · AWAITING OWNER APPROVAL**  
**Mode:** Evidence only · No features · No redesign · No business/DB/API/auth/Wallet/Orders/Checkout/Messages changes  
**Release policy:** No commit · No push · No deploy · No hidden optimisations  

**Host (agent):** `http://127.0.0.1:3000`  
**Owner URL (reference probes):** `https://www.rovexo.co.uk`  
**Evidence:** `test-results/phase10/`  

---

## Executive verdict

**ROVEXO is NOT certified as Mobile First Marketplace Performance Ready.**

Primary budget failures (Homepage and every measured page):

| Budget | Target | Observed (localhost) | Result |
|---|---|---|---|
| JS Initial | ≤180 KB | **~766–1222 KB** (document script tags / networkidle) | **FAIL** |
| Critical CSS | ≤50 KB | **~209–951 KB** | **FAIL** |
| Lighthouse Mobile | ≥98 | **NOT MEASURED** (Chrome DevTools blocked) | **FAIL / BLOCKED** |
| Lighthouse Desktop | ≥99 | **NOT MEASURED** | **FAIL / BLOCKED** |
| LCP | ≤2.0 s | Often **unavailable** in harness; FCP usually strong | **INCOMPLETE** |
| INP | ≤150 ms | Click proxy only (~ms scale); not full INP | **INCOMPLETE** |
| CLS | ≤0.05 | **0** where measured | PASS (partial) |
| No duplicate URLs | 0 | Listing / Seller Profile: **1 duplicate** each | **FAIL** (those pages) |

**Per Fail Policy → STOP.**  
Explain why → propose smallest safe optimisation → **do not implement**.

---

## Why FAIL (root causes — evidence)

1. **JS weight far above 180 KB**  
   Initial HTML alone references **15–20** JS chunks totaling **~0.76–1.2 MB** uncompressed (HEAD/GET sizes). Networkidle totals are similar. This alone rejects the Homepage budget.

2. **CSS weight far above 50 KB**  
   Login/auth shells ~**210 KB** CSS; Search/Help/Legal/Listing pull **~900–950 KB** stylesheet bytes (multiple CSS chunks).

3. **Production TTFB gap vs competitors** (public probe, same agent network):

   | Site | Min TTFB | Encoding | Cache-Control (HTML) |
   |---|---|---|---|
   | ROVEXO `/` | **3.82 s** | br | `private, no-cache, no-store…` · edge **MISS** |
   | ROVEXO `/login` | **3.57 s** | br | private no-store · MISS |
   | ROVEXO `/search` | **4.16 s** | br | private no-store · MISS |
   | Vinted UK | **0.37 s** | gzip | private no-store · DYNAMIC |
   | Amazon UK | **0.56 s** | gzip | no-cache · CloudFront Miss |
   | eBay UK | **0.97 s** | gzip | — |

   Localhost public pages often show `x-nextjs-cache: HIT` and gzip; **live Owner origin still private/no-store + multi-second TTFB** on probed HTML.

4. **Lighthouse Mobile/Desktop scores** could not be produced in this environment (`Unable to connect to Chrome`). Budget ≥98/≥99 **cannot PASS**.

5. **Auth gate:** Guest `/` and account surfaces redirect to Login — authenticated Homepage/Wallet/Orders/Messages/Checkout image+UX metrics are **not fully certified**.

6. **Missing routes (404):** `/selling`, `/offers`, `/bundles` — not certifiable as pages (may be intentional product mapping elsewhere; still FAIL for listed paths).

---

## STOP — Smallest safe optimisations (PROPOSE ONLY · DO NOT IMPLEMENT)

Ordered by impact / risk for a future Owner-approved phase:

1. **JS Initial budget** — Audit Next App Router client boundaries; defer non-critical providers (analytics, PWA, toasts) behind idle/interaction; ensure route-level code splitting so Login/Search first paint does not pull Help/Sell/Wallet chunks. *Smallest first step:* measure webpack/Next client graph for `/login` and `/search` only; remove one largest unnecessary shared client import.  
2. **Critical CSS ≤50 KB** — Split global CSS; avoid loading search-landing + checkout + wallet CSS on Login; purge unused Tailwind layers per route. *Smallest first step:* route-group CSS imports so auth layout does not include marketplace landing CSS.  
3. **Production HTML cache** — Align live `www.rovexo.co.uk` public routes with Phase 8 local behaviour (`s-maxage` / ISR HIT for Search/Legal/Help/Categories). *Smallest first step:* verify deploy artifact includes Phase 8 public readers + cache headers; no redesign.  
4. **Lighthouse on Owner device / CI Chrome** — Unblock mobile LH ≥98 evidence before any PASS claim.  
5. **Duplicate request on Listing/Seller Profile** — Identify the single duplicated URL from metrics and dedupe fetch (one call).  
6. **Categories HTML `Cache-Control: public, max-age=31536000, immutable`** — Investigate whether HTML is incorrectly immutable (local evidence); correct only if confirmed mis-header (ops/config), without UI change.

---

## Page certification matrix

Legend:  
**PASS** = budget + route OK · **FAIL** = budget/route fail · **AUTH** = redirected to Login (shell only) · **404** = route missing · **UNRESOLVED** = no live entity · **INCOMPLETE** = metric missing  

| Page | Route | HTTP | Guest result | FCP (ms) | JS KB* | CSS KB* | IMG KB | CLS | Budget | Page verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| Homepage | `/` | 200 | AUTH→Login | 396 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Search | `/search` | 200 | OK | 120 | 948 | 952 | 0* | 0 | FAIL JS/CSS | **FAIL** |
| Categories | `/categories` | 200 | OK | 120 | 867 | 901 | 6.1 | 0 | FAIL JS/CSS | **FAIL** |
| Listing | `/listing/slepping-bag-msa9gnrb` | 200 | OK | 628 | 974 | 941 | 3.5 | 0 | FAIL JS/CSS + dup | **FAIL** |
| Store | — | — | UNRESOLVED | — | — | — | — | — | — | **FAIL** |
| Seller Profile | `/user/mishuu` | 200 | OK | 500 | 1037 | 960 | 7.6 | 0 | FAIL JS/CSS + dup | **FAIL** |
| Help | `/help` | 200 | OK | 120 | 1116 | 909 | 0 | 0 | FAIL JS/CSS | **FAIL** |
| Legal | `/legal` | 200 | OK | 132 | 902 | 909 | 0 | 0 | FAIL JS/CSS | **FAIL** |
| Login | `/login` | 200 | OK | 80 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Register | `/register` | 200 | OK | 104 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Sell | `/sell` | 200 | AUTH | 80 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Buyer Dashboard | `/account` | 200 | AUTH | 96 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Seller Dashboard | `/selling` | **404** | — | 60 | 768 | 124 | 0 | 0 | FAIL + 404 | **FAIL** |
| Wallet | `/wallet` | 200 | AUTH | 80 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Orders | `/orders` | 200 | AUTH | 84 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Messages | `/inbox` | 200 | AUTH | 88 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Notifications | `/inbox?tab=notifications` | 200 | AUTH | 80 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Checkout | `/checkout` | 200 | AUTH | 80 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Profile | `/account` | 200 | AUTH | 76 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Settings | `/settings` | 200 | AUTH | 80 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Addresses | `/account/addresses` | 200 | AUTH | 84 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Verification | `/account/verification` | 200 | AUTH | 80 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Privacy | `/legal/privacy-policy` | 200 | OK | 128 | 889 | 909 | 0 | 0 | FAIL JS/CSS | **FAIL** |
| Security | `/account/security` | 200 | AUTH | 84 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Favorites | `/saved` | 200 | AUTH | 84 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Offers | `/offers` | **404** | — | 64 | 768 | 124 | 0 | 0 | FAIL + 404 | **FAIL** |
| Reviews | `/account/reviews` | 200 | AUTH | 84 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Bundles | `/bundles` | **404** | — | 60 | 768 | 124 | 0 | 0 | FAIL + 404 | **FAIL** |
| Followers | `/account/followers` | 200 | AUTH | 108 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Following | `/account/following` | 200 | AUTH | 84 | 766 | 210 | 20.3 | 0 | FAIL JS/CSS | **FAIL** |
| Category | `/category/womens-fashion` | 200 | OK | 240 | 864 | 937 | 0* | 0 | FAIL JS/CSS | **FAIL** |

\* JS/CSS = Playwright networkidle transferred bytes (and confirmed by initial-document script/link sizes). IMG 0 on Search may mean heroes hydrated after measure window; Phase 9 optimizer probe still valid for delivery format.

**Positive signals (not enough for PASS):** Login FCP ~80 ms; Search/Categories/Help FCP ~120 ms; CLS 0; Auth emblem ~20.3 KB; favicon immutable; Phase 9 image pipeline static checks PASS.

---

## Image Engine Certification

| Check | Evidence | Result |
|---|---|---|
| AVIF preferred | `next.config` `formats: avif, webp` | **PASS** |
| WebP fallback | Same | **PASS** |
| Responsive sizes | Cards / gallery / search / teddy sizes present | **PASS** |
| Lazy loading | Non-priority SafeImage / cards / search cats | **PASS** |
| Progressive gallery | `ProductGalleryV1` nearActive + thumb strip | **PASS** |
| Thumbnail delivery | `thumbnail_url` + `deriveListingThumbnailUrl` | **PASS** |
| Critical preload only | Login Primary Emblem preload | **PASS** |
| Immutable cache | brand / search categories / assets / favicon | **PASS** (local) |
| No oversized runtime | Teddy AVIF; search WebPs recompressed (Phase 9) | **PASS** (delivery) |
| Live Listing images | Resolved `/listing/slepping-bag-msa9gnrb`; small IMG transfer in guest measure | **PARTIAL** |

**Image Engine:** PASS (code/delivery) · **does not override** page Performance Budget FAIL.

---

## Network Certification

| Check | Result | Notes |
|---|---|---|
| Duplicate requests | **FAIL** on Listing + Seller Profile (1 dup URL each) | Others 0 |
| Duplicate fetches / waterfalls | INCOMPLETE | No full waterfall flamegraph; JS chunk count high |
| Parallel requests | OBSERVED | Many parallel `/_next/static` loads |
| Bundle / code splitting | PARTIAL | Many chunks exist, but **shared weight still huge** on first document |
| Unused JS / CSS | **LIKELY FAIL** | Budget breach implies excess; exact unused % not measured without coverage tool |

---

## Production Certification (localhost vs live)

| Check | Localhost `:3000` | `www.rovexo.co.uk` |
|---|---|---|
| Edge / CDN HIT | N/A (local) | Probed HTML **MISS** / private no-store |
| ISR / s-maxage | Search `s-maxage=300` + **HIT**; Legal/Help long s-maxage + **HIT** | Probed Search still **private no-store** |
| Static | Categories HIT (note: immutable HTML suspicious) | Not verified as HIT |
| Dynamic | Listing/category private | Homepage private |
| Cache-Control | Mixed (good on some public) | Probed pages private no-store |
| ETag | Present on cached public | Not confirmed on probed HTML |
| Compression | **gzip** on HTML | **br** on HTML |
| Brotli | Accept br → not applied locally in probe | Applied on prod |
| HTTP/2 or HTTP/3 | Local HTTP/1.1 | `alt-svc` may advertise H3 (probe field captured in JSON) |

---

## Competitor benchmark (measurable only)

Source: `test-results/phase10/competitor-benchmark.json`  
Same network, 3 runs, min TTFB reported.

| Metric | ROVEXO prod `/` | Amazon UK | Vinted UK | eBay UK |
|---|---|---|---|---|
| TTFB (min) | **3.82 s** | 0.56 s | **0.37 s** | 0.97 s |
| Content-Encoding | br | gzip | gzip | gzip |
| HTML cache posture | private no-store | no-cache | private no-store | — |
| Edge hint | MISS | CloudFront Miss | DYNAMIC | — |

**Not compared (no evidence):** LCP/INP/CLS/JS weight/image delivery internals of competitors (would require their LH runs / speculation — forbidden).

**Finding:** ROVEXO live HTML TTFB is **~4–10× slower** than these marketplace homepages on this probe path.

---

## Metric coverage notes

| Metric | Coverage |
|---|---|
| TTFB | curl/header + nav timing partial |
| FCP | Measured (Performance paint) |
| LCP | Often null (observer timing / redirect) — **INCOMPLETE** |
| CLS | 0 where available |
| INP | Not full Event Timing API — click latency proxy only |
| FPS / scroll | Sample rAF FPS captured in raw JSON |
| CPU / Memory | **NOT MEASURED** (no CDP profiling this run) |
| Touch latency | Click proxy ms |
| Keyboard | **NOT MEASURED** |
| Hydration | Inferred via networkidle + React markers — **INCOMPLETE** |
| Lighthouse | **BLOCKED** |

---

## Top 20 remaining bottlenecks

1. Initial JS **≫ 180 KB** on all routes  
2. Critical/global CSS **≫ 50 KB**  
3. Production HTML TTFB **~3.5–4.2 s**  
4. Production HTML `private, no-store` on public Search/Home probes  
5. Lighthouse Mobile/Desktop scores unavailable  
6. Authenticated marketplace pages not measurable as guest  
7. Search CSS payload ~950 KB  
8. Help JS ~1.1 MB  
9. Listing FCP 628 ms (worst public FCP in set)  
10. Seller Profile JS >1 MB  
11. Duplicate network URL on Listing  
12. Duplicate network URL on Seller Profile  
13. Store unresolved (no live store slug)  
14. `/selling` 404  
15. `/offers` 404  
16. `/bundles` 404  
17. Categories HTML marked `immutable` (possible mis-cache)  
18. Category empty image path may miss lazy Teddy in short measure  
19. LCP element attribution missing in harness  
20. Live edge cache MISS on Owner origin  

---

## Top 20 optimisation opportunities (future Owner phase — not implemented)

1. Cut shared client providers from auth + public shells  
2. Route-group CSS isolation (auth vs marketplace vs account)  
3. Dynamic `import()` for Help/Legal heavy client islands  
4. Verify/deploy Phase 8 cache headers to production  
5. Edge CDN HIT for anonymous Search/Categories/Legal/Help  
6. Prefetch policy: fewer speculative RSC payloads  
7. Tree-shake icon/CSS modules  
8. Reduce Geist / font preload cost if duplicated  
9. Listing page defer non-LCP below-fold JS  
10. Deduplicate Listing data fetch  
11. Deduplicate Seller Profile fetch  
12. Map Offers → Inbox hub (docs only) or add thin redirect — Owner decision  
13. Map Seller Dashboard to real selling workspace route  
14. Fix Categories cache header if HTML wrongly immutable  
15. Owner-device Lighthouse Mobile certification  
16. Demo-session authenticated page matrix  
17. Bundle analyzer gate in CI (≤180 KB initial)  
18. Critical CSS extraction for Login LCP  
19. HTTP/3 / CDN tuning after cache HIT works  
20. Memory/CPU CDP profiling on iPhone Safari  

---

## Estimated scores (engineering estimate · NOT Owner PASS)

| Estimate | Value | Basis |
|---|---|---|
| Mobile UX score | **58 / 100** | Strong FCP locally; failed JS/CSS budgets; prod TTFB poor; auth/LH gaps |
| Production readiness | **NOT READY** | Budget FAIL + live TTFB/cache FAIL + LH blocked |
| Image pipeline readiness | **READY (Phase 9)** | Does not certify overall mobile marketplace |

---

## Final recommendation

```
PHASE 10 CERTIFICATION = FAIL
STOP
NO COMMIT · NO PUSH · NO DEPLOY
NO IMPLEMENTATION WITHOUT OWNER APPROVAL
```

**Recommended next Owner decision:**  
Authorize a **Phase 11 — JS/CSS Budget + Production Cache** optimisation sprint (smallest fixes first: auth/public CSS isolation + shared client trim + verify Phase 8 headers on `www.rovexo.co.uk`), then re-run Phase 10 with:

1. Demo-authenticated session  
2. Lighthouse Mobile on real Chrome  
3. Initial JS ≤180 KB and Critical CSS ≤50 KB proven on Homepage + Search + Login  

Until those gates pass exactly, **do not claim Mobile First Marketplace Performance Certification**.

---

## Evidence index

| File | Contents |
|---|---|
| `test-results/phase10/certification-metrics.json` | Per-page vitals, transfers, duplicates, budgets |
| `test-results/phase10/initial-document-budget.json` | Initial HTML script/link weight |
| `test-results/phase10/competitor-benchmark.json` | ROVEXO vs Amazon/Vinted/eBay TTFB/headers |
| `test-results/phase10/static-checks.json` | Image engine static PASS checks |
| `test-results/phase10/dynamic-paths.json` | Resolved listing/user |
| `test-results/phase10/certify.log` | Measurement console |

---

*Phase 10 Final Mobile Performance Certification · 2026-08-04 · Evidence only · Owner approval required*
