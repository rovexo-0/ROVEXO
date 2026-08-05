# ROVEXO Phase 6 — Dynamic Rendering Graph (Evidence Only)

**STATUS:** INVESTIGATION COMPLETE · NO CODE CHANGES · NO DEPLOY · AWAITING OWNER FOR PHASE 7  
**Date:** 2026-08-04  
**Hosts measured:** `https://www.rovexo.co.uk` (prod) · `http://127.0.0.1:3020` (Phase 3 SSR trace)

Parents: `ROVEXO_PERFORMANCE_ROOT_CAUSE.md` · `ROVEXO_SSR_TRACE.md` · `ROVEXO_PRODUCTION_INFRASTRUCTURE_TRACE.md` · `ROVEXO_PHASE5_PERFORMANCE.md`

---

## 0. Exact blocker (two stacked facts — both measured)

### Fact A — Every audited HTML document is dynamically rendered on production

Live headers (2026-08-04 probe):

| URL | `cache-control` | `x-vercel-cache` | `x-vercel-id` | `x-matched-path` |
|---|---|---|---|---|
| `/login` | `private, no-cache, no-store, max-age=0, must-revalidate` | `MISS` | `lhr1::iad1::…` | `/login` |
| `/search` | same | `MISS` | `lhr1::iad1::…` | `/search` |
| `/terms` | same | `MISS` | `lhr1::iad1::…` | `/terms` |

**Source of that Cache-Control string (not ROVEXO custom HTML headers):**

```14:15:node_modules/next/dist/server/lib/cache-control.js
    if (revalidate === 0) {
        return 'private, no-cache, no-store, max-age=0, must-revalidate';
```

ROVEXO `next.config.ts` `headers()` applies security headers + **static asset** caches only (`lib/ops/performance-headers.ts` — `/icons`, `/fonts`, `/images`, `/brand`, `/search/categories`, `/categories`). It does **not** set document `Cache-Control`.

**Implication:** `revalidate === 0` path → Vercel cannot CDN-HIT the HTML → request must execute a function in **`iad1`**.

### Fact B — On that same `iad1` path, document HTML waits ~3 s; light functions do not

| Surface (Phase 4 / Phase 6 re-probe) | Wait after TLS | Region |
|---|---:|---|
| HTML `/login` | **~3046–3843 ms** | `lhr1→iad1` |
| HTML `/search` | **~3027 ms** | `lhr1→iad1` |
| HTML `/terms` | **~2977 ms** | `lhr1→iad1` |
| HTML `/_not-found` | **~2979 ms** | `lhr1→iad1` |
| API `GET /api/inbox/badge` 401 | **~147 ms** | `lhr1→iad1` |
| Edge HIT favicon | **~20 ms** | `lhr1` only |

Phase 3 local SSR tree max (`/account`): **≤401 ms wall** (instrumented). Residual after light-function bound ≈ **2.6–2.9 s** on production documents.

### Exact blocker statement

```
HTML is forced DYNAMIC (cookies | force-dynamic | searchParams | redirect)
  → Cache-Control revalidate=0 (Next.js)
  → x-vercel-cache: MISS
  → Document must run on Vercel function region iad1
  → Document/SSR class on iad1 exhibits ~3000 ms floor
     (shared by /login, /search, /terms, /_not-found)
```

App awaits alone do **not** produce the 3 s floor (Phase 3). Dynamic routing onto `iad1` document execution **does** (Phase 4 + this phase header matrix).

---

## 1. Global dynamic primitives (shared by many routes)

| Primitive | File:line | What it does |
|---|---|---|
| `cookies()` inside SSR Supabase client | `lib/supabase/server.ts:13–14` | Any `await createClient()` opts the RSC tree into **dynamic** |
| `createClient` used for product reads | `lib/products/repository.ts:255,352,431,485,…` | Public catalog HTML becomes dynamic even without user session |
| Middleware stamps pathname header | `lib/supabase/middleware.ts:32–38` | Sets `x-rovexo-pathname` on every passthrough |
| Root loading reads headers | `app/loading.tsx:20–22` | `await headers()` in root `loading.tsx` |
| Middleware matcher | `middleware.ts:46–49` | Runs on all HTML (excludes static assets) |
| Guest `/` redirect | `lib/supabase/middleware.ts:72–77` (guest) and `194–198` (authed path without user) | Guests never receive `/` HTML |

---

## 2. Per-route dynamic triggers (file · line · reason)

### 2.1 `/` — `app/(platform)/page.tsx`

| # | Trigger | File:line | Reason HTML cannot be statically cached |
|---|---|---|---|
| 1 | `export const revalidate = 60` | `page.tsx:25` | ISR intent — **overridden** when dynamic APIs run (cookies) |
| 2 | `await searchParams` | `page.tsx` run block (~65) | Dynamic request API |
| 3 | Conditional `getAuthContext()` | `page.tsx` ~69 → `lib/auth/session.ts` → `createClient` → `cookies()` | Draft preview auth |
| 4 | `fetchHomepageFeed` → `createClient()` | `page.tsx` ~80 → `repository.ts:352` | Cookie-bound public feed |
| 5 | `fetchShowcaseSellerSections` → `createClient()` | `page.tsx` ~81 → `repository.ts:431` | Cookie-bound showcase |
| 6 | Middleware guest redirect | `middleware.ts` / `lib/supabase/middleware.ts:72–77` | Guests redirected to `/login` — `/` HTML is auth-gated in practice |

**No** `export const dynamic = "force-dynamic"` on homepage.

**Classification:** **UNNECESSARY DYNAMIC** for public catalog data path (cookie client for anonymous-readable listings). **MUST REMAIN DYNAMIC** for draft-preview auth branch and current guest→login policy. **SAFE TO STREAM** feed/showcase. **SAFE TO CACHE** only after public reads leave `cookies()` client (Owner Phase 7 decision).

---

### 2.2 `/login` — `app/(auth)/login/page.tsx`

| # | Trigger | File:line | Reason |
|---|---|---|---|
| 1 | `await searchParams` | `login/page.tsx:21` | Dynamic |
| 2 | `redirectIfAuthenticated` → `createClient()` → `cookies()` | `login/page.tsx:25–26` → `guest-redirect.ts:17–20` | Session gate |
| 3 | `getUser()` | `guest-redirect.ts:18–20` | Per-request auth |
| 4 | Possible `redirect()` | `guest-redirect.ts:27,32,40,43` | Navigation side-effect |

Layouts `app/layout.tsx`, `app/(auth)/layout.tsx`: **no** cookies/headers.

Middleware guest on `/login`: **no** `getUser` (guest fast-path `lib/supabase/middleware.ts:137–141`).

**Classification:** **MUST REMAIN DYNAMIC**. OAuth provider probe **SAFE TO DEFER**/already memory-cached 60s.

---

### 2.3 `/search` — `app/(platform)/search/page.tsx`

| # | Trigger | File:line | Reason |
|---|---|---|---|
| 1 | `generateMetadata` `await searchParams` | `search/page.tsx:17–18` | Dynamic metadata |
| 2 | Page `await searchParams` | `search/page.tsx:74` | Dynamic |
| 3 | `redirect(...)` when `visual === "1"` | `search/page.tsx:76–77` | Dynamic |
| 4 | Idle trending → `getTrendingSearches` → `getPopularSearches` → `getProductsBySection` → `createClient()` | `search/page.tsx:64` → `popular-searches.ts:11` → `repository.ts:255` | Cookie-bound public data |

**No** `force-dynamic` export.

**Classification:** **UNNECESSARY DYNAMIC** for empty landing if trending leaves cookie client. Query/category variants remain request-bound by `searchParams` (**MUST REMAIN DYNAMIC** for those URLs, or client-only). **SAFE TO STREAM** results (Suspense already). **SAFE TO CACHE** empty shell only with conditions above.

---

### 2.4 `/listing/[slug]` — `app/(platform)/listing/[slug]/page.tsx`

| # | Trigger | File:line | Reason |
|---|---|---|---|
| 1 | **`export const dynamic = "force-dynamic"`** | **`listing/[slug]/page.tsx:16`** | Hard `revalidate=0` — CDN HTML forbidden |
| 2 | `generateMetadata` → `fetchProductBySlug` → `createClient()` | `18–20` → `repository.ts:485` | Cookie read + duplicate call site vs page |
| 3 | Page `Promise.all(fetchProductBySlug, fetchSimilarProducts)` | `39–41` | Cookie reads (product deduped by `cache()` at `repository.ts:482`) |
| 4 | `getCategoryBreadcrumbsForProduct` | `56` | Server category read |
| 5 | `redirect()` | `47`, `53` | Dynamic |

**Classification:** **UNNECESSARY DYNAMIC** relative to a public PDP (`force-dynamic` is an explicit nail; cookie client is a second). **SAFE TO CACHE** / ISR **with conditions** (remove `force-dynamic`, public reader without `cookies()`). **SAFE TO STREAM** similar/breadcrumbs. Views already deferred to client beacon (comment lines 58–59).

---

### 2.5 `/account` — `app/(platform)/account/page.tsx`

| # | Trigger | File:line | Reason |
|---|---|---|---|
| 1 | `fetchProfile()` → `getUser` / `cookies()` | `account/page.tsx:12` → profile repository | Personal SSR |
| 2 | `fetchWalletData()` → `requireAuthContext` | `14` | Second auth path (request-memoized after Phase 5) |
| 3 | User-scoped snapshot/seller/settings | `15–17` | Personal data |

Middleware: `/account` ∈ `AUTH_PROTECTED_PREFIXES` (`lib/auth/protected-routes.ts:3`) → guest → `/login`.

**Classification:** **MUST REMAIN DYNAMIC**. **SAFE TO STREAM** hub subsections. Never CDN-cache HTML.

---

### 2.6 `/wallet` — `app/(platform)/wallet/page.tsx`

| # | Trigger | File:line | Reason |
|---|---|---|---|
| 1 | `fetchProfile()` | `wallet/page.tsx:19` | Session |
| 2 | `redirect("/login?…")` | `21–23` | Auth gate |
| 3 | `await searchParams` | `25` | Connect query |
| 4 | `fetchWalletData()` | `31` | Financial SSR |

Middleware: `/wallet` protected (`protected-routes.ts:10`).

**Classification:** **MUST REMAIN DYNAMIC**. **SAFE TO STREAM** widgets. Never static HTML.

---

### 2.7 `/orders` — `app/(platform)/orders/page.tsx`

| # | Trigger | File:line | Reason |
|---|---|---|---|
| 1 | `getProfile()` → cookies/`getUser` (+ redirect if missing) | `orders/page.tsx:16` → `lib/profile/data.ts:7–21` | Session |
| 2 | `fetchOrdersForUser` ×2 | `17–19` | Personal orders |

Middleware: `/orders` protected (`protected-routes.ts:6`).

**Classification:** **MUST REMAIN DYNAMIC**. **SAFE TO STREAM** bought/sold lists.

---

### 2.8 Settings — `/account/settings` (+ `/settings`)

#### `/account/settings` — `app/(platform)/account/settings/page.tsx`

| # | Trigger | File:line | Reason |
|---|---|---|---|
| 1 | `fetchProfile()` | `14` | Session |
| 2 | `countAccountActiveListings` | `15–17` | User-scoped |

**Classification:** **MUST REMAIN DYNAMIC**.

#### `/settings` — `app/(platform)/settings/page.tsx`

| # | Trigger | File:line | Reason |
|---|---|---|---|
| 1 | `redirect("/account/settings")` | settings page | Redirect = dynamic hop |
| 2 | Middleware protects `/settings` | `protected-routes.ts:21` | Guest → login |

**Classification:** Thin redirect; destination **MUST REMAIN DYNAMIC**.

---

## 3. Forced no-store inventory (document-relevant)

| Kind | Where | Applies to HTML? |
|---|---|---|
| Next.js `revalidate === 0` header | `node_modules/next/dist/server/lib/cache-control.js:14–15` | **Yes** — every dynamic document |
| `export const dynamic = "force-dynamic"` | `listing/[slug]/page.tsx:16` (+ inbox/conversation, many APIs) | **Yes** for that page |
| Client `fetch(..., { cache: "no-store" })` | e.g. `CanonicalMarketplaceFeed.tsx:80`, `AuthProvider.tsx:79`, inbox/wallet hooks | **No** for initial HTML document (client after hydrate) |
| `lib/ops/performance-headers.ts` | Static assets only | **No** for HTML |

---

## 4. Auth dependency map

```
Middleware (every HTML match)
  ├─ No auth cookie → guest fast-path (NO getUser)     [middleware.ts:137–141]
  │     ├─ "/" → redirect /login
  │     └─ protected prefix → redirect /login?next=
  └─ Auth cookie → getUser() + optional role                 [middleware.ts:163–165]

RSC createClient()                                        [server.ts:13–14]
  └─ cookies() → DYNAMIC document
        ├─ getUser() via getAuthContext / redirectIfAuthenticated / fetchCurrentProfile
        └─ Same client used for PUBLIC product queries → also DYNAMIC
```

**Duplicated server auth paths (same request):**

| Route | Paths |
|---|---|
| `/account` | `fetchProfile` + `fetchWalletData`→`requireAuthContext` (Phase 5 `cache()` collapses) |
| `/wallet` | `fetchProfile` + `fetchWalletData` |
| `/listing/[slug]` | `generateMetadata` product + page product (`getProductBySlug` `cache()` at `repository.ts:482`) |
| `/login` | Middleware guest skip + RSC `redirectIfAuthenticated` `getUser` |

---

## 5. SSR dependency graph (with measured / bounded durations)

Durations: Phase 3 local instrumented wall / middleware header, or Phase 4 production curl.  
`UNMEASURED` = no span in evidence set.

```
Request (GB probe)
│  DNS+TLS ~20–30 ms (Phase 4)
▼
Middleware                                          [middleware.ts → updateSession]
│  Duration: guest ~1–3 ms local; authed ~37–83 ms local (Phase 3 Server-Timing)
│            prod light path upper bound ~147 ms includes function (badge)
│  Blocking? YES (must finish before document)
│  Can stream? NO
│  Can cache? NO (edge middleware)
│  Can defer? NO for auth gates; guest fast-path already skips getUser
▼
Root layout                                         [app/layout.tsx]
│  Duration: UNMEASURED (static shell; fonts/providers)
│  Blocking? Structural YES
│  Can stream? Children can
│  Can cache? Layout itself has no cookies — but children force dynamic
│  Can defer? Client providers already client-side
▼
Group layout                                        [app/(platform)| (auth)/layout.tsx]
│  Duration: CSS import cost UNMEASURED separately
│  Blocking? YES for CSS
│  Can stream? Children can
│  Can cache? No cookies in layout
│  Can defer? Platform CSS already route-split from auth (RC6/RC7)
▼
Root loading (Suspense fallback)                    [app/loading.tsx:20–22]
│  Duration: headers() only when fallback paints
│  Blocking? Only while suspended
│  Can stream? It IS the fallback
│  Can cache? headers() is a dynamic API
│  Can defer? N/A
▼
Metadata                                            [generateMetadata where present]
│  /search: awaits searchParams (line 17)
│  /listing: awaits product via createClient (line 18–20)
│  Duration: bundled into document TTFB; listing product span local ~162–287 ms (Phase 3 listing trace)
│  Blocking? YES for metadata emission before full document in many paths
│  Can stream? Limited
│  Can cache? Listing metadata blocked by force-dynamic + cookies
│  Can defer? Partial (static titles where no data)
▼
Auth / cookies                                      [server.ts:14 · session · guest-redirect]
│  Duration: getUser median ~43 ms direct (Phase 2); local mw authed 37–83 ms
│  Blocking? YES when awaited before paint content
│  Can stream? After auth gate, yes for rest
│  Can cache? Session HTML: NO. Public data should not need cookies.
│  Can defer? Public shells: YES (move auth to client). Session pages: NO for gate.
▼
Supabase queries                                    [repository / wallet / orders]
│  Duration: included in Phase 3 page walls ≤401 ms local
│  Blocking? When awaited in page body before return
│  Can stream? YES with Suspense
│  Can cache? Public catalog: YES with non-cookie client / unstable_cache. Personal: NO
│  Can defer? Below-fold YES
▼
Page body                                           [per-route page.tsx]
│  Duration prod HTML wait: ~3000 ms (Phase 4) — platform document class
│  Duration local wall: login 16 ms · search 269 · home_auth 277 · account 401 · wallet 349 · orders 285 · settings 255 · listing 382 (Phase 3)
│  Blocking? First byte waits for dynamic pipeline on iad1
│  Can stream? Partially (Suspense islands exist on search/orders/settings)
│  Can cache? See classifications §2
│  Can defer? Client islands already deferred in Phase 5 (not deployed)
▼
Stream / Response
│  cache-control: private, no-store (Next revalidate=0)
│  x-vercel-cache: MISS
│  Function region: iad1
```

---

## 6. Blocking render checklist

| Blocking step | Evidence it blocks TTFB |
|---|---|
| Middleware completes before document | Always; Server-Timing `mw` on traced builds |
| Dynamic opt-in (`cookies` / `force-dynamic` / `searchParams` / `redirect`) | Forces function invocation + `private, no-store` |
| `iad1` document execution floor | Identical ~3 s for `/login`, `/terms`, `/_not-found` (Phase 4) |
| App data awaits | Bounded ≤~400 ms local (Phase 3) — **not** the 3 s floor |

---

## 7. Classification board (Owner Phase 7 input)

| Finding | SAFE TO CACHE | SAFE TO STREAM | SAFE TO DEFER | MUST REMAIN DYNAMIC | UNNECESSARY DYNAMIC |
|---|---|---|---|---|---|
| `/login` session gate | | | OAuth probe | **YES** | |
| `/account` HTML | | subsections | | **YES** | |
| `/wallet` HTML | | widgets | | **YES** | |
| `/orders` HTML | | lists | | **YES** | |
| `/account/settings` HTML | | | | **YES** | |
| `/` catalog reads via `cookies()` | conditional | **YES** | draft auth | guest policy | **YES** (catalog path) |
| `/search` empty trending via `cookies()` | conditional | **YES** | | query URLs | **YES** (landing data) |
| `/listing/[slug]` `force-dynamic` | conditional | **YES** | | | **YES** (explicit) |
| `/listing/[slug]` cookie product client | conditional | **YES** | | | **YES** |
| Next `private, no-store` on dynamic HTML | | | | **YES** (framework) | |
| Vercel `iad1` document ~3 s floor | | | | Platform (not app toggle) | |
| Client `cache: "no-store"` fetches | N/A HTML | | | post-hydrate only | |

---

## 8. Final verdict

1. **Why HTML cannot be cached:** each audited route opts into **dynamic rendering** via one or more of: `cookies()` (`createClient`), `export const dynamic = "force-dynamic"`, `await searchParams`, or `redirect()`. Next then emits `Cache-Control` with `revalidate === 0` → `private, no-cache, no-store`.

2. **Why that becomes a ~3 second wait on production:** dynamic HTML is executed on **`iad1`** (`x-vercel-id: lhr1::iad1`). Measured document wait is ~3 s even for pages with almost no app work (`/terms` redirect, `/_not-found`). Same region light API is ~147 ms. Phase 3 proves app SSR ≪ 3 s locally.

3. **Exact blocker for Owner:**  
   **Dynamic document rendering → Vercel `iad1` HTML MISS path → ~3000 ms floor.**  
   App-level dynamic triggers are fully enumerated above; platform residual duration is **not** explained by app awaits.

4. **No optimisations applied in Phase 6.** No commit · no push · no deploy.

**Owner approval required before Phase 7.**
