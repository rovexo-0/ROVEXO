# ROVEXO HOMEPAGE SSR ↔ CLIENT DOUBLE FETCH — FINAL CERTIFICATION v1

**STATUS:** PHASE 4 · P0 PERFORMANCE FORENSIC · READ ONLY · ABSOLUTE LOCK · EVIDENCE ONLY

| Field | Value |
|---|---|
| Generated (UTC) | 2026-08-07T21:10:39.634Z |
| Host | `http://127.0.0.1:3000` (Law v4.0) |
| Scope | Homepage only (`app/(platform)/page.tsx` → canonical feed) |
| Implementation | NONE — no code / cache / API / SSR / client changes |
| Commit / Push / Deploy | FORBIDDEN this phase |

---

## FINAL CERTIFICATION (ONE)

```
FAIL
```

**Reason:** Proven page-1 feed load occurs twice for a rendered Homepage — once on the server via `fetchHomepageFeed(1)` / `getHomepageFeed(1)`, and once on the client via mandatory `loadPage(1, "replace")` → `GET /api/homepage/feed?page=1` → second `getHomepageFeed(1)`. PASS requires no duplicate. Intentionality is recorded below as **EXPECTED REFRESH**, not as PASS.

---

## DOUBLE FETCH (ONE CLASSIFICATION)

```
EXPECTED REFRESH
```

**Evidence of intent (exact source):** `components/homepage/canonical/CanonicalMarketplaceFeed.tsx` lines 151–167 — comment states SSR seed can be stale under ISR `revalidate`; on mount the client **ALWAYS** fetches page 1 and **REPLACES** the seed. Guard: `initialFetchDoneRef` (once per mount). Not conditional on empty seed.

This is **not** `NO DUPLICATION` (two page-1 loads proven).  
This is **not** classified `TRUE DUPLICATE` as an accidental second path — the replace is deliberate and unconditional.  
Live browser Network waterfall for an authenticated Homepage session on this host: **NOT VERIFIED** (guest `GET /` → 307 `/login`). Classification rests on source + public API + SSR code path that runs when a session reaches `/`.

---

## REQUEST TIMELINE (when Homepage renders)

```
HTTP GET /
  ↓
middleware updateSession
  ↓ (authenticated only; guest → 307 /login — see Network note)
HomePage()                          [Server Component]
  ↓
awaitCheckoutSessionSelfHeal("homepage")   [sequential pre-feed]
  ↓
Promise.all([
  getPlatformVisualConfig,
  fetchHomepageFeed(1),             → getHomepageFeed(1) → Supabase products
  fetchShowcaseSellerSections(),
  listActivePreferredMarketplaceStores(),
])
  ↓
resolveHomepageV4Sections(...)      → resolveHomepageFeedItems + showcase reserved filter
  ↓
SSR HTML + RSC serialized props     (feed → CanonicalHomepage → initialPage)
  ↓
Hydration
  ↓
CanonicalHomepage (client)
  ↓
CanonicalMarketplaceFeed
  ↓ useState(seedItems) from initialPage   ← page 1 already in memory
  ↓ useEffect (mount)
  ↓ loadPage(1, "replace")
  ↓ shareInflightJson → GET /api/homepage/feed?page=1
  ↓ route GET → getHomepageFeed(1) + resolveHomepageFeedItems
  ↓ setItems(replace)                   ← State replace
  ↓ Final rendered feed
  ↓ (later) IntersectionObserver → loadPage(n, "append") for page > 1
```

---

## EVERY STEP

| Step | File | Function / Component | Server / Client | Reason |
|---|---|---|---|---|
| 1. HTTP `GET /` | `middleware.ts` → `lib/supabase/middleware.ts` | `middleware` / `updateSession` | Edge/server | Session refresh; guest `/` → redirect `/login` (lines 162–167) |
| 2. Page entry | `app/(platform)/page.tsx` | `HomePage` | **Server** | Canonical Homepage RSC |
| 3. Checkout self-heal | `lib/checkout/checkout-session-self-heal-server-v1.ts` (imported) | `awaitCheckoutSessionSelfHeal("homepage")` | **Server** | Runs **before** feed `Promise.all` |
| 4. SSR feed fetch | `lib/products/queries.ts` | `fetchHomepageFeed(1)` | **Server** | Thin wrapper → repository |
| 5. Repository | `lib/products/repository.ts` | `getHomepageFeed(1)` | **Server** | Supabase `products` query; page size 12; promo/created/views order + eligibility |
| 6. Showcase / stores (parallel) | `queries.ts` / preferred-stores store | `fetchShowcaseSellerSections`, `listActivePreferredMarketplaceStores` | **Server** | Parallel with feed in `Promise.all` |
| 7. Section resolve | `lib/homepage/v4-data.ts` | `resolveHomepageV4Sections` | **Server** | Calls `resolveHomepageFeedItems`; strips showcase-reserved IDs from feed items |
| 8. Feed resolve helper | `lib/homepage/feed-resolve.ts` | `resolveHomepageFeedItems` | **Server** (SSR) | Filter + re-rank + preferred-store slot inject |
| 9. Render shell | `page.tsx` | `BetaAppShell` → `HomePageShell` → `CanonicalHomepage` | **Server** render → client boundary | Passes `sections.feed` as props |
| 10. Client homepage | `components/homepage/canonical/CanonicalHomepage.tsx` | `CanonicalHomepage` | **Client** | Computes `reservedIds` from showcases; passes `initialPage={feed}` |
| 11. Feed seed state | `CanonicalMarketplaceFeed.tsx` | `useState(seedItems)` | **Client** | Hydrated/serialized page-1 items become initial React state |
| 12. Mount reconcile | `CanonicalMarketplaceFeed.tsx` | `useEffect` → `loadPage(1, "replace")` | **Client** | Documented always-on ISR freshness replace |
| 13. Client HTTP | `lib/performance/fetch.ts` | `shareInflightJson(..., "/api/homepage/feed?page=1", { ttlMs: 500 })` | **Client** | Browser `fetch` with `cache: "no-store"` inside share helper |
| 14. API route | `app/api/homepage/feed/route.ts` | `GET` | **Server** | `getHomepageFeed(page)`; if `page===1` also `resolveHomepageFeedItems` + preferred stores |
| 15. Second repository call | `lib/products/repository.ts` | `getHomepageFeed(1)` | **Server** (API) | Same function as SSR step 5 |
| 16. State replace | `CanonicalMarketplaceFeed.tsx` | `setItems` / `setPage` / `setHasMore` | **Client** | `mode === "replace"` clears base then merges API items |
| 17. Infinite scroll (not page-1 duplicate) | `CanonicalMarketplaceFeed.tsx` | `IntersectionObserver` → `loadPage(page+1, "append")` | **Client** | Append only; separate from mount replace |

**Not present on this path:** React Query · SWR · `useSWR` · TanStack Query (verified absent from feed component + page).

---

## COMPARE — SSR response vs Client response

| Question | Answer | Evidence |
|---|---|---|
| Same endpoint | **NO** | SSR: in-process `fetchHomepageFeed` / `getHomepageFeed`. Client: HTTP `GET /api/homepage/feed?page=1` |
| Same repository | **YES** | Both invoke `getHomepageFeed` (`lib/products/repository.ts` via `lib/products/catalog.ts` / `queries.ts`) |
| Same SQL | **YES** | Single repository implementation: `.from("products").select(...).eq("status","published").eq("is_demo",false).gt("stock",0).order(promotion_score, created_at, views).range(...)` (+ holiday filter + eligibility) |
| Same payload | **NO** (not byte-identical identity) | SSR: `resolveHomepageV4Sections` already removes showcase-reserved IDs from `feed.items` before props. API page-1: `resolveHomepageFeedItems` without showcase strip; client re-filters `reserved` on fetch. Preferred injection occurs on both resolve paths when stores exist. |
| Same page | **YES** | Both target **page 1** |
| Same filters | **YES** (core eligibility) / **PARTIAL** (reservation) | Core: `HomepageEligibility` inside `getHomepageFeed`. Reservation: SSR strips in `v4-data`; client strips in feed component |
| Same sort | **YES** | `computeHomepagePriorityScore` + `compareHomepageFeedProducts` in repository return and again in `resolveHomepageFeedItems` |

Live API probe (guest-accessible): `GET http://127.0.0.1:3000/api/homepage/feed?page=1` → **200** with `items[]` (evidence captured this session).

---

## CACHE

| Layer | Status | Evidence |
|---|---|---|
| Next.js page ISR / `revalidate` | **USED** | `export const revalidate = 60` on `app/(platform)/page.tsx` |
| React `cache()` on `getHomepageFeed` | **NOT USED** | `cache()` wraps `getProductBySlug` / checkout variant only — **not** `getHomepageFeed` |
| `fetch` cache (Next Data Cache) on SSR feed | **NOT USED** | SSR uses direct Supabase client call, not `fetch()` to self |
| Router cache | **NOT VERIFIED** | No Homepage-specific router-cache instrumentation in this forensic |
| Browser HTTP cache for page-1 API | **NOT USED** (by intent) | Client `shareInflightJson` → inner `fetch(..., { cache: "no-store" })` |
| Memory soft cache (client) | **USED** (short) | `shareInflightJson` / `shareCache` TTL **500ms** — coalesces Strict Mode / remount only; does **not** share with SSR |
| Inflight Promise share (client) | **USED** | Concurrent callers of same key share one Promise |

**SSR ↔ Client shared cache:** **NOT USED** — no mechanism reuses the SSR `getHomepageFeed(1)` result for the client HTTP call.

---

## HYDRATION

| Question | Answer |
|---|---|
| Does hydration already contain page 1? | **YES** |
| Evidence | `CanonicalMarketplaceFeed` receives `initialPage` from SSR `sections.feed`; `useState(seedItems)` seeds from `initialPage.items` (after reserved filter). First client render can paint listing cards from seed without waiting for the API. |
| Why is page 1 fetched again? | **Documented always-on mount reconcile** — author comment: SSR seed may be stale under ISR (`revalidate = 60`); client always replaces with `/api/homepage/feed` as SSOT. Runs once per mount via `initialFetchDoneRef`. |

---

## NETWORK

| Metric | Evidence |
|---|---|
| SSR request count (feed) | **1** logical `getHomepageFeed(1)` per Homepage RSC render (inside `Promise.all` with other queries) |
| Client request count (page 1) | **1** `GET /api/homepage/feed?page=1` per mount (coalesced if concurrent remount within 500ms TTL) |
| Parallel (SSR) | **YES** — feed + showcase + preferred stores + visual config |
| Sequential (cross-tier) | **YES** — SSR completes → HTML/RSC → hydrate → `useEffect` → client fetch |
| Conditional client page-1 fetch | **NO** — unconditional when effect runs (not gated on empty seed) |
| Guest `GET /` | **307 → `/login`** — full Homepage SSR+client Network waterfall **NOT VERIFIED** without session on this host |
| Public feed API | **200** verified without session |

**SSR request count (browser Network for document `/`):** guest path does not render Homepage (redirect). Authenticated document request count: **NOT VERIFIED** this session.

---

## CWV

| Metric | Estimate |
|---|---|
| LCP | **NOT VERIFIED** (no lab/field trace on authenticated Homepage this session) |
| INP | **NOT VERIFIED** |
| TTFB | **NOT VERIFIED** |
| CLS | **NOT VERIFIED** (possible layout shift on replace if API payload differs from seed — not measured) |

Prior audits estimated risk from dual feed work; this Phase 4 does not invent new CWV numbers.

---

## IF DUPLICATE / SECOND FETCH — ROOT CAUSE ONLY

**Root cause:** `CanonicalMarketplaceFeed` mount `useEffect` unconditionally calls `loadPage(1, "replace")` after SSR already computed and serialized page 1 into `initialPage`, because the component treats `/api/homepage/feed` as the post-hydrate source of truth to correct possible ISR-stale SSR seeds (`revalidate = 60`). There is no shared cache between the RSC `getHomepageFeed(1)` call and the later API `getHomepageFeed(1)` call.

No fix proposed (Phase 4 absolute lock).

---

## LIVE HOST CONSTRAINT (evidence)

| Probe | Result |
|---|---|
| `GET /` (no session) | **307** `http://127.0.0.1:3000/login` — middleware cold-start guest rule |
| `GET /api/homepage/feed?page=1` | **200** JSON feed |
| Authenticated Homepage HTML + client Network | **NOT VERIFIED** this session |

Source path above applies when middleware allows `/` for an authenticated user (`lib/supabase/middleware.ts` guest redirect only when `!user`).

---

## ABSOLUTE RULES HONORED

- Evidence only
- No optimisation
- No implementation
- No code generation
- No TODOs
- No speculative recommendations
- No commits / push / deploy

## STOP

Phase 4 Homepage double-fetch final certification complete.
