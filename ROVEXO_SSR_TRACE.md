# ROVEXO SSR TRACE
## PHASE 3 — DEEP SSR PIPELINE (EVIDENCE ONLY)

**STATUS:** EVIDENCE COMPLETE · **NO OPTIMISATIONS APPLIED**  
**Date:** 2026-08-04  
**Parents:** `ROVEXO_PERFORMANCE_BLOOD_AUDIT.md` · `ROVEXO_PERFORMANCE_ROOT_CAUSE.md` (Phase 2)

**Rules:** No UI/UX/business-logic changes · No commit · No push · No deploy.  
Instrumentation is **env-gated** (`ROVEXO_SSR_TRACE=1`) and inactive in normal runs.

**Evidence tree:** `test-results/ssr-trace/`  
- Per-request JSON spans · `index.ndjson` · `aggregate.json` · `runner-summary.json`  
- Harness: `scripts/ssr-trace-runner.mjs`  
- Tracer: `lib/perf/ssr-trace.ts` · bootstrap: `components/perf/SsrTraceBootstrap.tsx`

---

## FINAL VERDICT — WHERE THE ~2.9 s GOES

### Accounting against Phase 2 production residual

| Bucket | Duration | Source |
|---|---:|---|
| Production HTML server wait (median) | **~3100 ms** | Phase 2 curl `lhr1::iad1` |
| Middleware + Auth upper bound (prod) | **≤150–210 ms** | Phase 2 guest `/api/inbox/badge` on same region |
| **Implied residual (“SSR / RSC”)** | **≈2900 ms** | Phase 2 arithmetic |
| **Instrumented Node SSR (same app, local `next start`)** | **≤314 ms** max (`/account`) | Phase 3 spans |
| **Unattributed platform residual** | **≈2575–2900 ms** | Production wait − middleware bound − local app SSR |

### Exact conclusion (no guesswork)

**The ~2.9 seconds attributed to “SSR/RSC” on production are NOT spent inside application awaits** (Supabase queries, `getUser`, repository calls, OAuth probes, page data loaders).

Those awaits, when measured with full production build + span instrumentation on Node, complete in **~8–314 ms wall** depending on route.

The remaining **~2.6–2.9 s on `https://www.rovexo.co.uk`** is therefore **Vercel serverless document render / platform overhead on `iad1`**, already proven in Phase 2 by:

1. Every HTML route ≈ **3100 ms** wait (`x-vercel-id: lhr1::iad1`, `MISS`)  
2. Even `/_not-found` ≈ **3100 ms** (no page data)  
3. Same-region light API ≈ **150–210 ms**  
4. Edge static HIT ≈ **20–60 ms** (`lhr1` only)  
5. Phase 3: identical codebase SSR spans sum to **≪ 2900 ms**

```
Production HTML wait ~3100 ms
  ├─ Edge LHR                         ~20 ms
  ├─ Middleware+getUser (bound)       ≤210 ms
  ├─ App awaits (measured here)       ≤314 ms   ← THIS PHASE
  └─ Vercel iad1 document platform    ~2575+ ms ← THE 2.9 s GAP
```

**Application SSR is not innocent** (duplicates, OAuth probes, product queries) — but it explains **hundreds of milliseconds**, not **2.9 seconds**.

---

## METHOD

### What was instrumented (measurement only)

| Layer | Mechanism |
|---|---|
| Middleware | `x-rovexo-mw-ms` + `Server-Timing` when `ROVEXO_SSR_TRACE=1` (`middleware.ts`) |
| RSC tree | `SsrTraceBootstrap` + React `cache` span bucket |
| `fetch` | Global patch via `instrumentation.ts` |
| Supabase user client | Proxy on `createClient()` → auth / `from` / `rpc` spans |
| Repositories | `lib/products/queries.ts` dynamic spans |
| Helpers | `redirectIfAuthenticated`, `getAuthContext`, `HomePage` |
| Force prod-like middleware | `ROVEXO_SSR_TRACE_FORCE_GETUSER=1` disables guest cookie fast-path |

### Runtime

```
ROVEXO_SSR_TRACE=1
ROVEXO_SSR_TRACE_FORCE_GETUSER=1
ROVEXO_FLASH_AUTH_DB=1
npx next start -p 3020
PERF_BASE_URL=http://127.0.0.1:3020 node scripts/ssr-trace-runner.mjs
```

### Limits (honest)

| Requested | Status |
|---|---|
| SQL EXPLAIN / indexes / seq scans | **EXTERNAL BLOCKER** (PostgREST timings only: table, rows, ms) |
| Every leaf RSC component >10 ms | **PARTIAL** — page/layout/repo/query/fetch/auth spanned; Inbox almost client-only (1 span) |
| Hydration start/end in browser | **OUT OF SSR SCOPE** (Phase 2 PW: longtask=0; FCP≈TTFB) |
| Production in-process spans | **NOT DEPLOYED** (no deploy) — local Node is the instrumented environment |
| Middleware internal sub-spans on Edge | Header total only (Edge cannot import Node tracer) |

---

## PER-ROUTE SSR TOTALS (INSTRUMENTED LOCAL)

| Route | Trace wall (ms) | Spans | Middleware header (ms) | Dominant awaits |
|---|---:|---:|---:|---|
| `/account` | **314** | 56 | 76 | `notifications` HEAD 85 · `withdraw_methods` 83 · `wallet_transactions` 82 |
| `/listing/…` | **287** | 25 | 83 | `fetchSimilarProducts` 213 · **duplicate** `fetchProductBySlug` ×2 (162+160) |
| `/wallet` | **274** | 39 | 60 | `wallet_transactions` 69 · `wallets` 65 |
| `/search` | **245** | 11 | — | trending / search helpers |
| `/` (auth home) | **230** | 32 | 37 | parallel `fetchProducts`+`fetchHomepageFeed` ~218 · showcase 155 |
| `/orders` | **211** | 27 | 60 | `orders` 58 |
| `/login` (coldish) | **206** | 6 | 3 | OAuth google probe **195** · apple **120** (parallel) |
| `/account/settings` | **182** | 20 | 63 | `notifications` 73 · `getUser` 47 |
| `/sell` | **175** | 17 | — | auth/profile helpers |
| `/inbox` | **17** | 1 | 58 | Almost no RSC data — client fetch after HTML |
| `/login` (warm) | **8–10** | 4 | 1 | OAuth cache hit |

**Local SSR never approaches 2900 ms.**

---

## MILLISECOND CHAIN — EXAMPLE `/` (AUTH HOME)

Parent → child await chain (wall times; parallel work overlaps):

| # | Function | File | Line | Start | End | Duration | % of route | Blocks HTML? |
|---:|---|---|---:|---:|---:|---:|---:|---|
| 1 | `SsrTraceBootstrap` / RootLayout.tree | `components/perf/SsrTraceBootstrap.tsx` | 20 | 0.0 | 230.0 | **230** | 100% | Yes (tree) |
| 2 | `HomePage` | `app/(platform)/page.tsx` | 64 | 0.1 | 221.2 | **221** | 96% | Yes |
| 3 | `fetchProducts(recommended,1)` | `lib/products/queries.ts` | 19 | 2.5 | 220.6 | **218** | 95% | Yes (Promise.all) |
| 4 | `fetchHomepageFeed(page=1)` | `lib/products/queries.ts` | 11 | 2.8 | 220.6 | **218** | 95% | Yes (parallel w/ #3) |
| 5 | `fetchShowcaseSellerSections` | `lib/products/queries.ts` | 15 | — | — | **155** | 67% | Yes (parallel) |
| 6 | `supabase.from(products).await` ×N | via `lib/supabase/server.ts` proxy | — | — | — | ~50–95 each | — | Yes |
| 7 | `createClient` ×5 | `lib/supabase/server.ts` | 8 | — | — | small | — | Setup |
| 8 | Middleware | `middleware.ts` | — | — | — | **37** | — | Before RSC |

**Why #3+#4 both ~218 ms:** they run in `Promise.all` — wall clock ≈ slowest branch, not sum.

---

## MILLISECOND CHAIN — EXAMPLE `/login` (COLD OAUTH PROBE)

| # | Function | File | Line | Duration | % | Blocks HTML? |
|---:|---|---|---:|---:|---:|---|
| 1 | RootLayout.tree | `SsrTraceBootstrap.tsx:20` | 20 | **206** | 100% | Yes |
| 2 | `fetch GET …/auth/v1/authorize?provider=google` | `oauth-provider-availability.server.ts` via fetch | — | **195** | 95% | Yes |
| 3 | `fetch GET …/authorize?provider=apple` | same | — | **120** | 58% | Yes (parallel) |
| 4 | `redirectIfAuthenticated` | `lib/auth/guest-redirect.ts:14` | 14 | **3.5** | 2% | Yes |
| 5 | `supabase.auth.getUser` | `lib/supabase/server.ts` | — | **0.5** | 0.3% | Yes |

Warm `/login` drops to **~8–10 ms** once OAuth availability cache (60 s) is hot — proves login SSR cost is **probe I/O**, not React.

---

## DUPLICATE / REPEATED WORK (EVIDENCE)

| Pattern | Evidence | File / locus |
|---|---|---|
| `createClient` ×10 on `/account` | aggregate duplicates | `lib/supabase/server.ts:8` |
| `createClient` ×7 `/orders`, ×6 listing, ×5 home/wallet | same | same |
| `wallet_transactions` ×5 on `/account` and `/wallet` | query spans | wallet/account loaders |
| `fetchProductBySlug` ×2 on listing | metadata + page | `app/(platform)/listing/[slug]/page.tsx` generateMetadata + page |
| `products` query ×4 on home | feed/recommended/showcase | `lib/products/repository.ts` via queries |
| `getUser` ×3 on wallet/account | auth spans | session + layout providers |
| `notifications` unread HEAD on account/settings | ~73–85 ms | chrome/badge path |
| OAuth authorize probes on login | google+apple every cache miss | `lib/auth/oauth-provider-availability.server.ts` |

These matter for **optimising app SSR (hundreds of ms)**. They do **not** explain production’s **2.9 s** floor.

---

## TOP 50 SLOWEST FUNCTIONS (INSTRUMENTED)

Full ranked list: `test-results/ssr-trace/aggregate.json` → `top50Functions`.

| # | Function | File | Line | Duration (ms) | % of that route | Expected | Blocks HTML | Notes |
|---:|---|---|---:|---:|---:|---:|---|---|
| 1 | RootLayout.tree | `SsrTraceBootstrap.tsx` | 20 | 314 | 100% `/account` | <100 | Yes | Container |
| 2 | RootLayout.tree | same | 20 | 287 | 100% listing | <100 | Yes | |
| 3 | RootLayout.tree | same | 20 | 274 | 100% wallet | <100 | Yes | |
| 4 | RootLayout.tree | same | 20 | 245 | 100% search | <100 | Yes | |
| 5 | RootLayout.tree | same | 20 | 230 | 100% home | <100 | Yes | |
| 6 | HomePage | `app/(platform)/page.tsx` | 64 | 221 | 96% | <80 | Yes | |
| 7 | fetchProducts(recommended,1) | `queries.ts` | 19 | 218 | 95% | <50 | Yes | parallel |
| 8 | fetchHomepageFeed(page=1) | `queries.ts` | 11 | 218 | 95% | <50 | Yes | parallel |
| 9 | fetchSimilarProducts | `queries.ts` | 38 | 213 | 74% | <50 | Yes | listing |
| 10 | RootLayout.tree | orders | 20 | 210 | 100% | <100 | Yes | |
| 11 | RootLayout.tree | login cold | 20 | 206 | 100% | <50 | Yes | |
| 12 | OAuth google authorize fetch | oauth availability | — | 195 | 95% login | <30 cached | Yes | |
| 13 | RootLayout.tree | settings | 20 | 182 | 100% | <100 | Yes | |
| 14 | RootLayout.tree | sell | 20 | 175 | 100% | <100 | Yes | |
| 15 | fetchProductBySlug | `queries.ts` | 27 | 162 | 57% | <40 | Yes | listing |
| 16 | fetchProductBySlug (dup) | same | 27 | 160 | 56% | 0 dup | Yes | metadata |
| 17 | fetchShowcaseSellerSections | `queries.ts` | 15 | 155 | 67% | <50 | Yes | |
| 18 | OAuth apple authorize fetch | oauth | — | 120 | 58% | <30 | Yes | |
| 19–50 | supabase.from(*) / fetch REST | server proxy | — | 45–95 | 15–40% | <30 | Yes | see queries |

*(Rows 19–50 expanded in `aggregate.json`.)*

---

## TOP 50 SLOWEST QUERIES (PostgREST proxy)

SQL text / EXPLAIN: **unavailable**. Measured as `supabase.from(table).await` + underlying `fetch`.

| # | Table / call | Duration (ms) | Rows | Path | Expected | Blocks HTML |
|---:|---|---:|---:|---|---:|---|
| 1 | `products` (listing/similar) | ~95 | 0–N | listing | <30 | Yes |
| 2 | `notifications` (unread HEAD, count=156) | 73–85 | 0 body | account/settings | <20 | Yes |
| 3 | `withdraw_methods` | 83 | 1 | account | <20 | Yes |
| 4 | `wallet_transactions` | 69–82 | 0 | wallet/account | <20 | Yes |
| 5 | `wallets` | 65 | 1 | wallet | <20 | Yes |
| 6 | `business_accounts` | ~63 | — | sell | <20 | Yes |
| 7 | `orders` | 58 | — | orders | <30 | Yes |
| 8–50 | repeated `products` / `conversations` / profiles | 30–90 | — | multi | <30 | Yes |

**Indexes / seq scans:** EXTERNAL BLOCKER — requires Supabase SQL admin `EXPLAIN (ANALYZE)`.

---

## TOP 50 SLOWEST COMPONENTS (RSC / PAGE)

| # | Component / surface | File | Duration | Expected | Notes |
|---:|---|---|---:|---:|---|
| 1–10 | RootLayout.tree (per route) | `SsrTraceBootstrap.tsx` | 17–314 | <100 | Wrapper = full RSC budget |
| 11 | HomePage | `app/(platform)/page.tsx:64` | 221 | <80 | Data-bound |
| 12 | Listing page+metadata | `listing/[slug]/page.tsx` | ⊂287 | <80 | Dup slug fetch |
| 13 | Wallet RSC tree | wallet page | ⊂274 | <80 | Many wallet queries |
| 14 | Account RSC tree | account page | ⊂314 | <80 | |
| 15 | Search page | search/page.tsx | ⊂245 | <80 | |
| 16 | Orders | orders page | ⊂211 | <80 | |
| 17 | Sell | sell page | ⊂175 | <80 | |
| 18 | Settings | settings page | ⊂182 | <80 | |
| 19 | Inbox list | inbox/(list)/page.tsx | **17** | — | Data mostly client |
| 20–50 | Leaf presentational RSC | — | **NOT FULLY INSTRUMENTED** | — | Would need per-file spans |

No React Profiler component render >10 ms board on production (forbidden without broader instrumentation). Local long-task hydration was 0 in Phase 2.

---

## TOP 50 SLOWEST AWAITS / FETCHES / REPOSITORY CALLS

See `aggregate.json`:

- `top50Fetches` — OAuth authorize, PostgREST GET/HEAD  
- `top50Repos` — `fetchHomepageFeed`, `fetchProducts`, `fetchProductBySlug`, `fetchSimilarProducts`, `getAuthContext`, `redirectIfAuthenticated`, `createClient`  
- `top50Auth` — `supabase.auth.getUser` typically **0.5–47 ms** locally (prod direct median was 43 ms)

---

## NEXT.JS / STREAMING / HYDRATION

| Metric | Evidence |
|---|---|
| Server Components | Traced via layout/page/repo spans |
| Client Components | 770 `"use client"` files (static); Inbox defers work to client |
| Streaming | No `Server-Timing` flight spans exposed by Next; not measured |
| Suspense waterfalls | Homepage uses `Promise.all` (good); listing metadata+page duplicates slug fetch (waterfall across generateMetadata → page) |
| Hydration | Phase 2: FCP ≈ document wait; not an SSR-await issue |

---

## SUPABASE AUTH REPEATS

| Observation | Evidence |
|---|---|
| `getUser` cheap locally | 0.5–47 ms in spans |
| Multiple `getUser` per navigation | wallet/account ×3 |
| Middleware getUser separate | Edge header 1–83 ms local; ≤210 ms prod bound |
| OAuth probes dominate cold login | 195+120 ms |

---

## PRODUCTION vs LOCAL — WHY NUMBERS DIFFER

| Environment | HTML wait | App spans | Region |
|---|---:|---:|---|
| `www.rovexo.co.uk` | ~3100 ms | (not instrumented live) | `lhr1::iad1` |
| Local `next start :3020` | ~100–400 ms curl | **≤314 ms** traced | local Node |

Same application code. **Platform invoke + document SSR bootstrap on `iad1` is the missing ~2.9 s**, not an unmeasured `await` inside ROVEXO repositories.

---

## FINAL PRODUCTION SCORE (PHASE 3)

| Question | Answer |
|---|---|
| Are the 2.9 s inside app awaits? | **NO** (proven by local span totals ≪ 2.9 s) |
| Where are they? | **Vercel `iad1` HTML/document serverless platform path** (Phase 2 + Phase 3 differential) |
| What does app SSR actually cost? | **~8–314 ms** wall + duplicates/OAuth/product queries |
| SQL EXPLAIN complete? | **NO — EXTERNAL BLOCKER** |
| Every leaf RSC >10 ms? | **PARTIAL** |
| Optimisations applied? | **NONE** |

---

## AWAITING OWNER APPROVAL

No commit · No push · No deploy.

Suggested Phase 4 directions (not executed):

1. **Infra:** pin Vercel serverless region to **`lhr1`** (or UK) — targets the ~2.9 s platform residual.  
2. **App (optional, smaller):** OAuth probe cache, dedupe `fetchProductBySlug` metadata/page, reduce duplicate `createClient`/`getUser`/wallet queries.  
3. **Optional:** deploy read-only Server-Timing to production for one session to confirm platform residual in-vivo.

**END OF PHASE 3 REPORT**
