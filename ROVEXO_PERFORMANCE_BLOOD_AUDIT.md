# ROVEXO Performance Blood Audit

**Date:** 2026-08-03 / 2026-08-04  
**Host:** `https://www.rovexo.co.uk` (Production · deployment `dpl_AvWsMPMRCGeA63XyPkD7xVF8fXM7`)  
**Mode:** Evidence only · **NO code changes · NO commit · NO push · NO deploy**  
**Freeze:** Global Production Freeze remains ACTIVE  

**Evidence sources**

| Source | Path / method |
|--------|----------------|
| curl TTFB (3×) | Live HTML + API |
| Playwright Web Vitals + request timing | `test-results/perf-blood-audit/playwright-perf-*.json` |
| Lighthouse 13.4.1 (fresh) | `test-results/perf-blood-audit/lh-*-{mobile,desktop}.json` |
| Local `.next/static/chunks` sizes | Last production build artifacts |
| Repo asset sizes | `public/brand/**`, `public/hero/**` |
| `"use client"` inventory | ripgrep over `app` / `features` / `components` |

---

## FINAL VERDICT

**Production Performance = FAIL (<95)**

Lab Lighthouse mobile average ≈ **93** · desktop ≈ **95.5**, but **every measured HTML document waits ~3.1–4.8s before bytes** (curl + Playwright request timing + Lighthouse “Reduce initial server response time”). That is the lag users feel. FCP on authenticated Playwright runs is **~3.5–4.7s**.

---

## Overall Performance Score

| Lens | Score / result | Evidence |
|------|----------------|----------|
| Lighthouse mobile (avg of login/search/sell/home) | **93 / 100** | LH JSON |
| Lighthouse desktop (login/search) | **95.5 / 100** | LH JSON |
| Real document wait (median) | **FAIL** · ~4.0s | Playwright `resourceType=document` |
| curl HTML TTFB (login warm+cold) | **FAIL** · ~3.05–3.28s | curl timing |
| **Owner-facing perceived lag** | **FAIL** | FCP ≈ 3.4–4.7s |

**Score used for gate:** **93 (lab) with critical TTFB FAIL → overall FAIL (<95).**

---

## Per-page scores (Lighthouse Performance)

| Page | Form | Score | FCP | LCP | TBT | CLS | TTFB (LH) | Speed Index |
|------|------|------:|----:|----:|----:|----:|----------:|------------:|
| Login | Mobile | **91** | 1.1s | 2.9s | 26ms | 0.004 | 11ms* | **5.5s** |
| Login | Desktop | **96** | 0.24s | 0.26s | 0 | 0.001 | **3.28s** | 2.2s |
| Search | Mobile | **92** | 1.7s | 2.4s | 0 | 0 | **3.41s** | **6.1s** |
| Search | Desktop | **95** | 0.25s | 0.29s | 0 | 0 | **3.47s** | 2.4s |
| Sell† | Mobile | **95** | 0.79s | 0.86s | 126ms | 0.004 | **3.25s** | **5.3s** |
| Home† | Mobile | **94** | 0.79s | 0.86s | 139ms | 0.004 | **3.43s** | **5.6s** |

\*Mobile login TTFB audit under-reported once (11ms) while Speed Index stayed 5.5s — treat as outlier.  
†Guest `/` and `/sell` redirect to login in LH (network≈30) — scores reflect login shell more than authenticated surfaces.

### Playwright FCP (authenticated, mobile 390×844) — perceived lag

| Page | FCP ms | Document wait ms | JS KB | Slow reqs |
|------|-------:|-----------------:|------:|----------:|
| Login | 3440 | 3373 | 276 | 1 |
| Search | 3576 | 4374 | 353 | 2 |
| Home (auth) | 3960 | 4750 | 340 | 9 |
| Sell | 3492 | 4137 | **557** | 7 |
| Profile | 3532 | 4826 | 344 | 8 |
| Wallet | 3676 | 4706 | 336 | 11 |
| Orders | 3636 | 4672 | 328 | 13 |
| Inbox | 3900 | 3787 | 350 | 9 |
| Notifications | 3508 | 3562 | 342 | 12 |
| Settings | 3716 | **4839** | 337 | 7 |
| Checkout | 3488 | 3504–4104 | 316 | 13 |
| Listing | **4672** | 4490 | 438 | 11 |

---

## Largest bottlenecks (priority order)

1. **HTML document server response ~3.1–4.8s on all major routes** (login, search, home, sell, account, wallet, orders, listing, settings).  
   - curl login: dns/tls &lt;60ms · **ttfb ≈ 3.06–3.18s** (cold and warm).  
   - Lighthouse opportunity on 5/6 runs: **“Reduce initial server response time” (~3.25–3.47s)**.  
   - Middleware always runs `updateSession` → `supabase.auth.getUser()` (`middleware.ts` + `lib/supabase/middleware.ts`).

2. **Authenticated API latency 0.6–1.7s** (waterfall after HTML). Top measured: `/api/saved` 1730ms, `/api/views` 1563ms, `/api/account/snapshot` 1460ms, `/api/messages` 1404ms, `/api/homepage/feed` 1307ms, `/api/notifications` 1284ms, `/api/inbox/badge` 1203ms.

3. **Oversized brand PNG in header path: `app-icon-v1.png` = 2,656,168 bytes (~2.6MB)** loaded on homepage (Playwright transfer). Same size class: `app-icon-header-v1.png`, `favicon-rx-v1.png`, `rx-favicon-source-v1.png`.

4. **Sell route JS transfer ~557KB** (highest among measured pages).

5. **Search unused CSS (LH):** Est. **117 KiB** unused CSS on mobile search.

6. **Redirect tax (LH home/sell guest):** Est. **780ms** “Avoid multiple page redirects”.

7. **Huge hero masters in repo (not all proven on homepage critical path, but deploy/CDN risk):** up to **23.5MB** PNG (`public/hero/fast-delivery-3840.png`).

8. **Client-component footprint:** **729** `"use client"` files; largest product sources include `ConversationHub.tsx` (78KB), `InboxPage.tsx` (39KB), `SellProvider.tsx` (39KB).

---

## Top 20 slowest “components” / surfaces (by document or client cost)

Evidence is **route/document and module size**, not React Profiler (Profiler not available on production without instrumentation).

| # | Surface | Evidence |
|--:|---------|----------|
| 1 | `/account/settings` document | 4839ms |
| 2 | `/account` document | 4826ms |
| 3 | `/` (auth) document | 4750ms |
| 4 | `/wallet` document | 4706ms |
| 5 | `/orders` document | 4672ms |
| 6 | `/listing/[slug]` document | 4490ms |
| 7 | `/search` document | 4374–4449ms |
| 8 | `/sell` document | 4137ms |
| 9 | `/cart` redirect document | 4104ms |
| 10 | `/login` document | 3373–3589ms |
| 11 | `/inbox` document | 3787ms |
| 12 | Listing FCP | 4672ms |
| 13 | Home auth FCP | 3960ms |
| 14 | Inbox FCP | 3900ms |
| 15 | `SellProvider` client module | 39,256 bytes source |
| 16 | `ConversationHub` client module | 78,243 bytes source |
| 17 | `InboxPage` client module | 39,332 bytes source |
| 18 | Sell JS transfer | 557KB |
| 19 | Listing JS transfer | 438KB |
| 20 | Search JS transfer | 353KB |

---

## Top 20 slowest queries / APIs (measured max wait)

| # | Endpoint | Max ms | Notes |
|--:|----------|-------:|-------|
| 1 | `/api/saved` | 1730 | Auth fetch |
| 2 | `/api/views` | 1563 | Listing |
| 3 | `/api/account/snapshot` | 1460 | Profile |
| 4 | `/api/messages` | 1404 | Inbox |
| 5 | `/api/homepage/feed` | 1307 | Playwright; curl ~1.02–1.48s |
| 6 | `/api/notifications` | 1284 | Inbox |
| 7 | `/api/inbox/badge` | 1203 | Many pages |
| 8 | `/api/notifications/settings` | 1199 | Widespread |
| 9 | `/api/bundle` | 990 | Home/listing |
| 10 | `/api/profile` | 946 | Settings/profile |
| 11 | `/api/offers` | 921 | Listing |
| 12 | `/api/settings` | 860 | Settings |
| 13 | `/api/recently-viewed` | 759 | Listing |
| 14 | `/_next/image` | 709 | Image optimizer |
| 15 | `/api/analytics/live-presence` | 655 | Many pages |
| 16 | curl `/api/homepage/feed` cold | 1478 | Server |
| 17 | curl `/api/search?q=tent` cold | 1530 | Warm ~76ms (cached) |
| 18 | `/api/categories` | ~3100 | **404** HTML (wrong path — noise) |
| 19 | Guest `/api/inbox/badge` | ~171 | 401 fast (baseline) |
| 20 | Wallet RSC fetch `wallet/transactions/...?..._rsc=` | 3236 | RSC payload |

**Supabase:** No direct Postgres `EXPLAIN` in this audit (no schema change / no DB admin session). Latency attributed via app API timings above + middleware `getUser()` on every navigation.

---

## Top 20 largest bundles / assets

### Live JS (Playwright transfer, examples)

| Asset | Transfer |
|-------|---------:|
| `06es8zzmnhasg.js` | ~74 KB |
| `298k2439-xz7-.js` | ~55 KB |
| `3sqpdtikzccgs.js` | ~47 KB |
| `2oggnaegwqihr.js` | ~30 KB |
| Sell page total JS | **557 KB** |
| Listing total JS | 438 KB |
| Search total JS | 353 KB |
| Login total JS | 276 KB |

### Local build chunks (`.next/static/chunks`, last build)

| File | Size |
|------|-----:|
| `2mb0vdux0xjt1.css` | **780 KB** |
| `0lt42bxaql9x1.js` | 408 KB |
| `0yuny8gie2bal.js` | 296 KB |
| Several JS chunks | ~292 KB each |
| Total chunks dir | ~11 MB |

### Largest CSS

| Asset | Size |
|-------|-----:|
| `2mb0vdux0xjt1.css` (build) | 780 KB |
| Search unused CSS (LH) | ~117 KiB potential savings |
| Login CSS transfer (PW) | ~88 KB |

### Largest images / brand (repo + live)

| Asset | Bytes |
|-------|------:|
| `public/hero/fast-delivery-3840.png` | **23,455,688** |
| `public/hero/move-store-3840.png` | 18,011,534 |
| `public/hero/buy-securely-3840.png` | 13,865,210 |
| `public/brand/canonical-rx/app-icon-v1.png` | **2,656,168** (loaded live on homepage) |
| `app-icon-header-v1.png` / favicon sources | ~2.6 MB each |
| `rx-mark-v3.png` | 1,616,288 |

---

## Hydration / React / Next.js / Network / Memory / CPU

| Area | Finding | Evidence |
|------|---------|----------|
| Hydration | No widespread console hydration errors in PW runs | `consoleErrors` mostly empty; search had 3 console errors (text captured in raw JSON) |
| React | 729 `"use client"` modules; large hub/sell clients | ripgrep + file sizes |
| Next.js | Document generation dominates; middleware session on all matched routes | middleware matcher + TTFB |
| Prefetch | RSC wallet transaction prefetch 3236ms | Playwright slow request |
| Memory | Heap ~10MB used in PW (Chromium `performance.memory`) | summary `heapMB` |
| CPU / TBT | Lab TBT low (0–139ms); longtask API empty in PW | LH + PW |
| Network | 28–81 resources/page; authenticated pages 7–13 slow (&gt;300ms) requests | PW |
| Cache | Search API warm **76ms** after cold **1530ms** — caching helps APIs, **not** HTML (~3s warm login) | curl |

---

## Exact blockers (priority) — Performance &lt; 95

1. **P0 — Server HTML TTFB / document wait 3.1–4.8s** on Login, Search, Home, Sell, Account, Wallet, Orders, Listing, Settings (curl + Playwright + Lighthouse opportunity).  
2. **P0 — Middleware auth `getUser()` on nearly all navigations** (code path evidence correlating with universal HTML latency).  
3. **P1 — Authenticated API waterfall 0.6–1.7s** (`saved`, `views`, `account/snapshot`, `messages`, `feed`, `notifications`, `badge`, …).  
4. **P1 — 2.6MB app icon PNG** served on homepage chrome (`/brand/canonical-rx/app-icon-v1.png`).  
5. **P2 — Sell JS ~557KB** transfer.  
6. **P2 — Search unused CSS ~117KiB** (Lighthouse).  
7. **P2 — Guest redirect chains (~780ms)** on `/` and `/sell` in LH.  
8. **P3 — Mega hero PNG masters in repo (up to 23MB)** — CDN/deploy weight risk.  
9. **P3 — Large client islands** (ConversationHub / Inbox / SellProvider).  

---

## Quick wins (highest impact / lowest risk) — **DO NOT IMPLEMENT YET**

| # | Recommendation | Est. gain | Risk |
|--:|----------------|-----------|------|
| 1 | Diagnose & cut HTML TTFB (profile middleware `getUser`, edge region, cold compute, caching for public login/search shells) | **−2.0 to −3.0s** FCP/TTFB | Med (auth-sensitive) |
| 2 | Replace 2.6MB `app-icon-v1.png` with compressed ≤20–40KB WebP/AVIF for header | **−0.5 to −2.0s** on homepage image path; −2.5MB bytes | Low (asset swap) |
| 3 | Parallelize / cache hot APIs (`badge`, `notifications/settings`, `profile`, `bundle`, `feed`) | **−0.3 to −1.0s** authenticated INP/load | Med |
| 4 | Ensure search/category CSS code-split (unused CSS 117KiB) | **−50 to −150ms** TBT/parse | Low |
| 5 | Avoid guest double redirects where product allows | **−0.5 to −0.8s** (LH est.) | Low/Med |

## Medium optimizations

| # | Recommendation | Est. gain |
|--:|----------------|-----------|
| 1 | Slim Sell client bundle (dynamic import heavy widgets) | −100 to −250KB JS · −0.2–0.5s |
| 2 | Deduplicate homepage chrome fetches (`badge`/`settings`/`presence`) | −0.2–0.6s |
| 3 | Compress/remove unused `public/hero/*-3840.png` from deploy artifact | Deploy size −50MB+ |
| 4 | Listing page: defer `views`/`offers`/`saved` until idle | −0.5–1.0s listing quiet time |

## Heavy optimizations

| # | Recommendation | Est. gain |
|--:|----------------|-----------|
| 1 | Architectural session strategy (JWT edge validation without round-trip every HTML) | −1–3s TTFB if proven root | High |
| 2 | Split ConversationHub / SellProvider | Maintainability + incremental hydration | High |
| 3 | Full RSC boundary audit reducing 729 client modules | Long-term JS | High |

---

## Known measurement limits (honesty)

- React Profiler / Chrome CPU profile on every page: not attached to production (no code injection).  
- Direct Supabase SQL timings / indexes: not queried (no DB schema access this run).  
- Profile/Login/Wallet interactive INP field data: not from CrUX; lab + Playwright only.  
- Lighthouse `/sell` and `/` as guest largely measure login redirect target.  
- One LH mobile-login TTFB=11ms outlier; contradicted by curl + Playwright document timing.

---

## STOP

No optimizations applied.  
No commits. No pushes. No deploys.  
**Await Owner approval before any optimisation.**
