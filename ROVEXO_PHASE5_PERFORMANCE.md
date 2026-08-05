# ROVEXO Phase 5 — Zero-Risk Performance Optimisations

**STATUS:** LOCAL COMPLETE · NOT DEPLOYED · AWAITING OWNER APPROVAL  
**Date:** 2026-08-04  
**Rules obeyed:** No business/UI/UX/auth architecture/API/schema/visual changes · No commit · No push · No deploy  

**Evidence:** `test-results/phase5-perf/` · parents Phase 2–4 reports  

---

## 1. Executive verdict

Phase 1–4 proved production HTML wait (~**3000–3840 ms**) is dominated by **Vercel `lhr1→iad1` dynamic document MISS**, not app awaits.

Phase 5 therefore:

1. Removed **real duplicated work** in the app (auth, homepage query, profile `getUser`, search idle waterfall).
2. Cut **image/asset bytes** that dominate mobile LCP after HTML arrives.
3. Split **heavy client islands** (ConversationHub, Stripe sheet, Offer sheet, homepage feed).

**Honest confidence:**

| Outcome | Confidence |
|---|---:|
| Local app SSR wait is already healthy (login ~35 ms, search ~57 ms) | **95%** |
| Asset/image optimisations will cut mobile bytes after deploy | **95%** |
| Auth/query dedupe removes redundant Supabase round-trips per request | **90%** |
| Production HTML TTFB (~3 s) will **not** fall materially from Phase 5 alone | **90%** (needs infra/region — Owner decision) |
| No user-visible behaviour change from these patches | **85%** (gates green; Owner visual still required before publish) |

---

## 2. Gates (verification)

| Gate | Result |
|---|---|
| Typecheck (`tsc --noEmit`) | **PASS** |
| ESLint | **PASS** (0 errors; pre-existing warnings only) |
| Production build (`npm run build`) | **PASS** |
| Unit tests (heroes, homepage, balance freeze) | **PASS** (21/21) |
| Localhost `:3000` profile (curl + Playwright iPhone 13 Pro) | **PASS** (measured) |
| Lighthouse Mobile CLI | **BLOCKED** in this environment (Chrome connect) — Playwright timings used instead |
| Production deploy profile | **NOT RUN** (forbidden — no deploy) |

---

## 3. What changed (zero-risk only)

### 3.1 Auth / request memoisation

| Change | File | Effect |
|---|---|---|
| `React.cache(createClient)` | `lib/supabase/server.ts` | One SSR client per request |
| `React.cache(getAuthContext)` | `lib/auth/session.ts` | One `getUser` + profiles status/role per request |
| Skip TRACE dynamic import when off | `session.ts`, homepage, queries | Removes instrumentation tax on hot path |
| `fetchCurrentProfile` passes email → no second `getUser` | `lib/profile/repository.ts` | −1 Auth round-trip on account/wallet/profile trees |
| Homepage draft preview uses `auth.role` | `app/(platform)/page.tsx` | −1 `getUserRole` profiles hit |
| Guest middleware fast-path (no auth cookie → no `getUser`) | `lib/supabase/middleware.ts` | Already present from prior work — retained |

### 3.2 Duplicate / wasted fetches

| Change | Effect |
|---|---|
| Removed homepage `fetchProducts("recommended")` | Canonical UI never renders `featured` — **1 full section query removed** |
| Listing `getProductBySlug` already `cache()`’d | Confirmed — metadata + page share one product read (no change required) |
| Wallet `getWalletData` already `Promise.all` | Confirmed — no change required |
| Search idle: parallel `recent` + `popular`, same merge via `buildTrendingTerms` | Removes sequential waterfall; identical trending semantics + cache key |

### 3.3 Parallel independent work

| Surface | Change |
|---|---|
| Login | `Promise.all(redirectIfAuthenticated, loadPublicOauthProviders)` |
| Search idle | `Promise.all(recent, popular)` then merge |
| Homepage | Remaining arms already parallel (minus removed recommended) |

### 3.4 Images / assets (masters kept)

| Asset | Before (prod / master) | After (local) | Savings |
|---|---:|---:|---:|
| `app-icon-v1.png` | **2,656,168 B** | **18,137 B** | **−99.3%** |
| `app-icon-v1.webp` | ~245 KB (old) | **31,082 B** | large |
| Search heroes (10) PNG sum | **9,866,242 B** | masters retained | — |
| Search heroes runtime path | `.png` | **`.webp`** sum **1,157,284 B** | **−88% vs PNG sum** |
| Wallet balance hero PNG | **2,453,020 B** | **513,449 B** (+ master kept) | **−79%** |
| Wallet hero WebP / AVIF | n/a | **124,888 / 67,410 B** | CSS `image-set` prefers modern |

Also:

- Header logo: removed `unoptimized`; set `sizes="42px"` (Next AVIF/WebP pipeline).
- Search category cards: removed `unoptimized`; `quality={75}` + responsive `sizes`.
- Cache headers extended for `/brand/*`, `/search/categories/*`, `/categories/*`.

### 3.5 JS islands / hydration surface

| Island | Change |
|---|---|
| ConversationHub | `ConversationHubLazy` via `next/dynamic` (SSR on; chunk split) |
| Homepage feed | `CanonicalMarketplaceFeed` dynamic (below-fold; skeleton while chunk loads) |
| Wallet CardSetupSheet | dynamic `ssr:false` — loads only when `clientSecret` set |
| PDP OfferComposerSheet | dynamic `ssr:false` — loads on Make Offer |

### 3.6 CSS

Global `styles/rovexo/index.css` still loads many page sheets (FOUC risk if split aggressively). **Deferred** full CSS surgery as non-zero-risk without Owner visual QA. No page-specific CSS removed from global in this phase.

---

## 4. Before vs After (measured)

### 4.1 Production (still **pre-Phase-5 deploy**)

| Metric | Before (Phase 4 / re-probe) | After on prod | Notes |
|---|---:|---:|---|
| `/login` HTML wait | **~3046–3843 ms** | unchanged | `lhr1→iad1` MISS |
| `/search` HTML wait | **~3027 ms** | unchanged | same |
| `app-icon-v1.png` | **2,656,168 B** | still 2.6 MB live | local ready |
| Search `electronics.png` | **1,053,018 B** | still live PNG | runtime will use WebP after deploy |
| Wallet hero PNG | **2,453,020 B** | still 2.4 MB live | local ready |

### 4.2 Localhost `:3000` **after** Phase 5 build

| Route | Median wait after TLS | Bytes |
|---|---:|---:|
| `/login` | **35 ms** | 70,954 |
| `/search` | **57 ms** | 218,797 |
| `/terms` | **45 ms** | 194,686 |
| App icon PNG | **1 ms** | **18,137** |
| Search electronics WebP | **1 ms** | **86,066** |

### 4.3 Playwright mobile (iPhone 13 Pro · local · after)

| Page | FCP | responseStart | nav→networkidle | JS body sum* | CSS body sum* | Images |
|---|---:|---:|---:|---:|---:|---:|
| `/login` | **148 ms** | 41 ms | 987 ms | ~5.8 MB* | ~255 KB | ~21 KB |
| `/search` | **120 ms** | 65 ms | 1540 ms | ~2.1 MB* | ~982 KB | 0 (heroes may hit after idle) |

\*Playwright sums **decoded response bodies**, not compressed transfer — useful for relative chunk weight, not CDN transfer.

LCP entry was null in short capture window (paint observer); FCP is reliable.

### 4.4 Estimated savings after Owner deploy (mobile)

| Category | Estimated savings | Confidence |
|---|---|---:|
| App icon on first paint | **~2.64 MB → ~18 KB** (or WebP/AVIF via optimizer) | **95%** |
| Search landing 10 heroes | **~9.9 MB PNG → ~1.2 MB WebP** source | **90%** |
| Wallet hero (AVIF path) | **~2.45 MB → ~67 KB** | **90%** |
| Homepage SSR | **−1 products section query** + role query | **90%** |
| Auth trees | **−N duplicate getUser/createClient** per request | **90%** |
| Production HTML TTFB | **~0–100 ms** from app opts alone | **80%** that delta stays ≪ 3 s floor |

**Milliseconds saved on production document TTFB from Phase 5 alone:** expect **negligible vs ~3000 ms platform floor** until region/config work (Owner).

**Milliseconds saved on local SSR / post-HTML mobile:** already shown (login FCP ~148 ms local; icon LCP contributor removed).

---

## 5. Scoreboard (requested fields)

| Field | Value |
|---|---|
| Queries removed | Homepage `recommended` section; redundant `getUserRole`; second profile `getUser`; request-scoped auth/client dupes |
| Requests removed / parallelised | Login OAuth∥auth; Search idle recent∥popular |
| Images optimised | App icon, favicon twin, search heroes → WebP, wallet hero PNG+WebP+AVIF |
| Bundle / hydration | ConversationHub + feed + Stripe sheet + Offer sheet code-split |
| JS reduced | Deferred Stripe/`OfferComposer`/hub chunks off critical first load of parent routes |
| CSS reduced | **0** global removals this phase (deferred — FOUC risk) |
| HTML wait (prod) | **Unchanged** until deploy+infra |
| HTML wait (local) | Login **35 ms** / Search **57 ms** |
| Hydration | Reduced island surface via dynamic imports |
| Confidence (overall Phase 5 app opts correct & safe) | **88%** |
| Confidence (prod TTFB fixed by Phase 5) | **10%** — infra remains primary |

---

## 6. Explicit non-goals / not done

- No Vercel `regions` change (Owner infra decision — Phase 4).
- No HTML cache-control change (would alter behaviour/security model).
- No global CSS split (visual risk).
- No commit / push / deploy.
- No Auth/OAuth/UI redesign.
- SSR TRACE files remain env-gated measurement-only (`ROVEXO_SSR_TRACE=1` must stay off in production).

---

## 7. Owner next steps (publication gate)

1. Visual smoke on `http://localhost:3000` — Login · Search · Homepage · Wallet · Conversation · Product Make Offer.  
2. Approve Phase 5 patches.  
3. Separate Owner decision on **iad1 region / platform** (only path to kill ~3 s HTML floor).  
4. Only then: Commit → Push → Deploy → re-measure production Lighthouse Mobile + CWV.

---

## 8. Final statement

Phase 5 delivers **zero-risk app + asset performance wins** that will improve **bytes, LCP contributors, duplicate server work, and client chunking** after deploy.

It does **not** claim to have fixed production HTML TTFB — that remains a **Vercel `iad1` document-path** problem per Phase 4.

**Await Owner approval before publication.**
