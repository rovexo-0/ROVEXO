# ROVEXO Phase 7 — Public Page Cacheability & Static Eligibility

**STATUS:** EVIDENCE ONLY · NO CODE CHANGES · NO DEPLOY · AWAITING OWNER FOR PHASE 8  
**Date:** 2026-08-04  
**Parents:** Phase 4 infra · Phase 5 app opts · Phase 6 dynamic graph  

---

## 0. Exact production fact (re-probed this phase)

Live `https://www.rovexo.co.uk` headers (all guest requests):

| Path | HTTP | `cache-control` | `x-vercel-cache` |
|---|---|---|---|
| `/categories` | 200 | `private, no-cache, no-store, max-age=0, must-revalidate` | **MISS** |
| `/legal` | 200 | same | **MISS** |
| `/legal/terms-and-conditions` | 200 | same | **MISS** |
| `/help` | 200 | same | **MISS** |
| `/help/faq` | 200 | same | **MISS** |
| `/search` | 200 | same | **MISS** |

**Implication:** Even pages whose **page module** has no `cookies()` / `createClient()` / `force-dynamic` still emit Next’s `revalidate === 0` document header (`node_modules/next/dist/server/lib/cache-control.js:14–15`).

**Global poison (file:line):**

```20:22:app/loading.tsx
export default async function RootLoading() {
  const headerStore = await headers();
  const pathname = headerStore.get(ROVEXO_PATHNAME_HEADER) ?? "";
```

`headers()` in root `loading.tsx` opts the App Router segment into **dynamic rendering**. Until this is isolated, **page-local static/ISR eligibility cannot become production Edge HIT**.

`SsrTraceBootstrap` (`components/perf/SsrTraceBootstrap.tsx:19–20`) only calls `headers()` when `ROVEXO_SSR_TRACE=1` — not the default production poison.

---

## 1. Shared dependency: `createClient` → `cookies()`

```13:14:lib/supabase/server.ts
export const createClient = cache(async () => {
  const cookieStore = await cookies();
```

| Question | Evidence answer |
|---|---|
| WHY | Supabase SSR needs request cookies for session |
| WHO | Every RSC that loads DB via anon SSR client — including **public** product/category/store reads |
| Can remove? | **No** for session surfaces. **Yes for public catalog** if replaced with a non-cookie reader (service-role / published-only) — behaviour parity required |
| Can isolate? | **Yes** — public data path vs auth path |
| Client boundary? | **Partial** — shell static, data client-fetch (changes TTFB content strategy; must preserve SEO HTML if required) |
| Stream? | **Yes** under Suspense |
| Cache? | Public reader + tags → **YES**. Cookie client → **NO** |

---

## 2. Per-page matrix

Legend for APIs: Y = present on critical path · N = absent · C = conditional · G = global via `app/loading.tsx`

### 2.1 Homepage `/` — `app/(platform)/page.tsx`

| API | Present? | File:line |
|---|---|---|
| cookies via createClient | **Y** | feed/showcase → `repository.ts:352,431` via page ~80–81 |
| headers | **G** | `app/loading.tsx:21` |
| searchParams | **Y** | `page.tsx:60,65` (`visualPreview`) |
| getUser / getAuthContext | **C** | `page.tsx:69` only if `visualPreview=draft` |
| redirect | **N** (page) | Middleware **Y**: guests `/` → `/login` (`lib/supabase/middleware.ts:72–77`) |
| force-dynamic | **N** | |
| revalidate | **60** | `page.tsx:25` (overridden by dynamic APIs) |
| draftMode | **N** | |
| dynamic metadata | **N** (static `metadata` export) | |

**Dependency notes**

| Dep | WHY | WHO | Remove? | Isolate? | Client? | Stream? | Cache? |
|---|---|---|---|---|---|---|---|
| Guest `/` → login | Auth startup contract | Guests | **No** (product law) | N/A | N/A | N/A | Homepage HTML **not public** to guests today |
| Feed `createClient` | Load listings | CanonicalHomepage | Replace with public reader | **Yes** | Below-fold possible | **Yes** | After public reader + loading fix |
| `searchParams` draft | Super-admin preview | Owner preview | Split route | **Yes** | Possible | N/A | Live path free of searchParams |

**Eligibility today:** **MUST REMAIN DYNAMIC** (middleware + cookies + searchParams + global loading).  
**After conditions:** **SAFE ISR** for authed homepage shell (not guest-public).  
**Verdict:** **KEEP DYNAMIC** until guest policy + public reader + loading fix. Confidence **92%**.

---

### 2.2 Search Landing `/search` (empty q) — `app/(platform)/search/page.tsx`

| API | Present? | File:line |
|---|---|---|
| cookies via createClient | **Y** (empty landing) | trending → `popular-searches.ts:11` → `repository.ts:255` |
| headers | **G** | loading.tsx |
| searchParams | **Y** | `17–18`, `73–74` |
| getUser | **N** (page) | |
| redirect | **C** | `76–77` if `visual=1` |
| force-dynamic | **N** | |
| no-store (client) | client results fetches | not initial SSR cause alone |

**Dependency notes**

| Dep | WHY | WHO | Remove/isolate/client/stream/cache |
|---|---|---|---|
| `searchParams` | Branch q/category/visual | Metadata + body | Split `/search` landing vs `/search/results` → landing free of searchParams |
| Trending via cookie client | Popular chips | SearchResultsView | Public/static trending or client API; **stream OK** |
| Global loading headers | Auth splash vs skeleton | Root fallback | Isolate pathname without `headers()` |

**Eligibility today:** **MUST REMAIN DYNAMIC**.  
**After conditions:** **SAFE ISR** / **SAFE EDGE CACHE** for empty landing; query URLs **KEEP DYNAMIC** or client.  
**Verdict:** **MAKE ISR** (landing only) after loading + trending isolation. Confidence **85%**.

---

### 2.3 Listing Details `/listing/[slug]` — `app/(platform)/listing/[slug]/page.tsx`

| API | Present? | File:line |
|---|---|---|
| force-dynamic | **Y** | **`page.tsx:16`** |
| cookies via createClient | **Y** | metadata+page product `18–20`, `39–41` → `repository.ts:485` |
| headers | **G** | loading |
| searchParams | **N** | |
| getUser | **N** (page) | |
| redirect | **C** | `47`, `53` |
| dynamic metadata | **Y** | `18–34` (awaits product) |

**Dependency notes**

| Dep | WHY | WHO | Notes |
|---|---|---|---|
| `force-dynamic` | Explicit uncacheable | Next | Removable **only after** public reader + revalidate/tags |
| Product `createClient` | PDP + SEO | Buyer | Isolatable to public published reader |
| Similar + breadcrumbs | Enrichment | PDP / JSON-LD | Stream / cache tags |

**Eligibility today:** **MUST REMAIN DYNAMIC** (force-dynamic + cookies + loading).  
**After conditions:** **SAFE ISR** (tagged revalidate on publish/sold) · **SAFE PARTIAL PRERENDER** (shell + stream similar) · **SAFE EDGE CACHE** once static-capable.  
**Verdict:** **MAKE ISR** (primary SEO page). Confidence **80%** (sold/holiday/RLS parity is the risk).

---

### 2.4 Categories

#### `/categories` — `app/(platform)/categories/page.tsx`

| API | Present? | File:line |
|---|---|---|
| cookies / createClient / getUser | **N** | Uses `CANONICAL_ROOT_CATEGORIES` in-memory (`:4`, `:27`) |
| headers | **G only** | `app/loading.tsx:21` |
| searchParams | **N** | |
| force-dynamic | **N** | |
| revalidate | **3600** | `:7` |
| redirect | **N** | |

**Page-local:** **SAFE STATIC** / **SAFE ISR** / **SAFE EDGE CACHE**.  
**Production today:** still `private, no-store` — **blocked only by global loading `headers()`** (measured).  

**Verdict:** **MAKE STATIC** or **MAKE ISR** (already `revalidate=3600`) after loading fix. Confidence **95%** (page-local) · **90%** including loading fix.

#### `/category/[...slug]` — `app/(platform)/category/[...slug]/page.tsx`

| API | Present? | File:line |
|---|---|---|
| revalidate | **300** | `:13` |
| cookies via createClient | **Y** | `resolveCategoryPage` `:21,:42` + `getEligibleListings` `:48–54` |
| headers | **G** | loading |
| dynamic metadata | **Y** | `:19–37` |

**Verdict:** **MAKE ISR** after public reader + loading fix. Confidence **78%**.

---

### 2.5 Public Seller Profile

#### `/user/[username]` — `app/(platform)/user/[username]/page.tsx`

| API | Present? | File:line |
|---|---|---|
| cookies via createClient | **Y** | store/profile/reviews/trust loaders |
| getAuthContext / getUser | **Y** | `:101` → own-profile, drafts, follow, holiday owner view |
| headers | **G** | loading |
| force-dynamic | **N** | |

**Personalization is real behaviour** (`isOwnProfile`, drafts, `isFollowing`).  

**Verdict:** **KEEP DYNAMIC** for full page as wired · **MAKE PARTIAL PRERENDER** (public shell) + client personalize after isolation. Confidence **88%** keep-dynamic full page · **70%** PPR shell.

#### `/store/[slug]` — `app/(platform)/store/[slug]/page.tsx`

| API | Present? | File:line |
|---|---|---|
| cookies via createClient | **Y** | `resolveStoreByRouteParam` `:28,:45` · trust `:51` |
| getAuthContext | **N** | |
| headers | **G** | loading |

**Verdict:** **MAKE ISR** after public reader + loading fix (closer than `/user`). Confidence **82%**.

---

### 2.6 Help

#### `/help` — `app/(platform)/help/page.tsx`

| API | Present? | File:line |
|---|---|---|
| searchParams | **Y** | `:10,:14` (`q`) |
| cookies/createClient/getUser | **N** | Client `HelpCentrePage` |
| headers | **G** | loading |

**Verdict:** **MAKE STATIC** / **MAKE EDGE CACHE** if `q` moves to client `useSearchParams` + loading fix. Confidence **90%**.

#### `/help/[slug]` — `app/(platform)/help/[slug]/page.tsx`

| API | Present? | File:line |
|---|---|---|
| cookies/createClient | **N** | `getHelpArticle` in-memory `:58` |
| redirect | **C** | legal/delivery aliases `:50,:55` |
| headers | **G** | loading |
| generateStaticParams | **N** today | Can add for full static |

**Verdict:** **MAKE STATIC** after loading fix (+ optional `generateStaticParams`). Confidence **93%**.

---

### 2.7 Legal — `/legal`, `/legal/[slug]`

| Route | cookies/createClient | Other | File |
|---|---|---|---|
| `/legal` | **N** | `listLegalDocuments()` memory | `legal/page.tsx:12` |
| `/legal/[slug]` | **N** | `getLegalDocument(slug)` memory | `legal/[slug]/page.tsx:12,26` |

Production still MISS — **global loading only**.

**Verdict:** **MAKE STATIC** / **MAKE EDGE CACHE**. Confidence **96%** after loading fix.

---

### 2.8 Terms / Privacy aliases

| Route | File:line | Behaviour |
|---|---|---|
| `/terms` | `terms/page.tsx:3–4` | `redirect("/legal/terms-and-conditions")` |
| `/privacy` | `privacy/page.tsx:3–4` | `redirect("/legal/privacy-policy")` |
| `/privacy-policy` | `privacy-policy/page.tsx:3–4` | same |

Runtime `redirect()` = dynamic hop. Config already has some permanent legal redirects (`next.config.ts`).  

**Verdict:** Prefer **MAKE EDGE CACHE** via **permanent config redirects** (behaviour-equivalent). Canonical `/legal/*` → **MAKE STATIC**. Confidence **94%**.

---

## 3. Final verdict board (every public page)

| Page | KEEP DYNAMIC | MAKE ISR | MAKE STATIC | MAKE PPR | MAKE EDGE CACHE | Confidence |
|---|---|---|---|---|---|---:|
| Homepage `/` | **YES** (today + guest gate) | Later (authed only) | No (guest never sees) | Optional feed | No until policy change | **92%** |
| Search landing | Until split | **YES** (empty) | Shell possible | Results stream | After ISR | **85%** |
| Listing `[slug]` | Until force-dynamic removed | **YES** (goal) | Unlikely (inventory churn) | **YES** | After ISR HIT | **80%** |
| `/categories` | Only via loading poison | Already 3600 | **YES** | N/A | **YES** | **95%** |
| `/category/[...]` | Until public reader | **YES** | Partial | **YES** | After ISR | **78%** |
| `/user/[username]` | **YES** (viewer) | Shell only | No | **YES** | Shell only | **88%** |
| `/store/[slug]` | Until public reader | **YES** | Unlikely | **YES** | After ISR | **82%** |
| `/help` | Until `q` + loading | Optional | **YES** | N/A | **YES** | **90%** |
| `/help/[slug]` | Alias redirects only | Optional | **YES** | N/A | **YES** | **93%** |
| `/legal` + `/legal/[slug]` | Only via loading | Optional | **YES** | N/A | **YES** | **96%** |
| `/terms` `/privacy*` | Runtime redirect today | N/A | Via config redirect | N/A | **YES** (config) | **94%** |

---

## 4. Migration plan (NO implementation this phase)

### Phase A — Lowest risk (unlock static pages that are already cookie-free)

**Changes (plan only):**
1. Remove / replace `headers()` usage in `app/loading.tsx` without changing guest splash vs skeleton behaviour (e.g. client pathname, dual static fallbacks, or middleware-only header not read via `headers()` in RSC).
2. Confirm `ROVEXO_SSR_TRACE` stays off in production.
3. Optionally convert `/terms` `/privacy` `/privacy-policy` to `next.config` permanent redirects (parity with existing legal redirects).

**Expected gains (from Phase 4 HIT baselines):**

| Metric | Before (MISS document) | After (Edge HIT on legal/categories/help) |
|---|---:|---:|
| HTML wait | **~3000 ms** | **~20–60 ms** (favicon/sitemap HIT class) |
| Delta | — | **~2940–2980 ms** on those URLs |
| Lighthouse Mobile (those URLs) | Dominated by TTFB | Large score jump on Help/Legal/Categories |
| Mobile UX | 3 s blank/wait | Near-instant first byte |

**Risk:** Low if splash-vs-skeleton behaviour preserved. Does **not** by itself fix Listing/Search/Home (still cookie/`force-dynamic`).

---

### Phase B — Medium risk (public catalog without cookie client)

**Changes (plan only):**
1. Public published listing/category/store reader that does **not** call `cookies()`.
2. Remove `export const dynamic = "force-dynamic"` from listing **after** reader + `revalidate`/tags.
3. Search empty landing: static/ISR trending without cookie client; keep query results dynamic or client.
4. Homepage: isolate `visualPreview` draft; public feed reader for authed SSR (guest policy unchanged unless Owner changes startup law).

**Expected gains:**
- Listing/Search/Category/Store HTML eligible for **ISR** → first request MISS, subsequent **HIT** within TTL.
- TTFB on warm HIT: **~20–60 ms** vs **~3000 ms**.
- LCP/FCP improve after TTFB; SEO crawl of PDP/category improves.

**Risk:** RLS/visibility parity (draft/paused/sold/holiday/forbidden slug). Must match today’s buyer-visible set exactly.

---

### Phase C — Advanced

| Technique | Where | Gain |
|---|---|---|
| Streaming Suspense | Listing similar, category grid, search results | Faster first paint; TTFB may still wait on shell |
| Partial Prerender (PPR) | Listing, store, user shell | Static shell + dynamic holes (follow, own-profile) |
| Segment Cache / client router cache | Soft navigations | Instant back/forward; not first document TTFB |
| Tag revalidation on publish/sold | Listing/category ISR | Freshness without force-dynamic |

**Expected gains:** Mobile INP/perceived speed; document TTFB already fixed by A/B for public pages. Platform `iad1` residual remains for pages that **must** stay dynamic (account/wallet/orders/login).

---

## 5. Risk analysis (behaviour unchanged = pass)

| Domain | Phase A | Phase B | Phase C |
|---|---|---|---|
| SEO | **Help/Legal/Categories indexable faster** | Listing/category ISR helps | PPR must keep crawlable HTML |
| Authentication | Must not break splash/login skeleton | No auth rewrite; public reader only | User PPR must keep own-profile correct |
| Buyer | No change | Listing visibility parity critical | Stream must not flash wrong price/stock |
| Seller | No change | Holiday/own listings on `/user` stay dynamic hole | Same |
| Offers / Checkout / Wallet / Messages / Notifications | **Out of scope** (already MUST DYNAMIC) | Do not touch | Do not touch |
| Search | Landing only in B | Query path stays dynamic/client | Stream results |
| Categories | A unlocks index | B unlocks `/category/[...]` | — |
| Listings | A no | B core | C polish |

---

## 6. Dependency → classification cheat sheet

| Dependency | SAFE STATIC | SAFE ISR | SAFE EDGE | SAFE PPR | MUST DYNAMIC |
|---|---|---|---|---|---|
| Root `loading.tsx` `headers()` | Blocks all until fixed | Blocks | Blocks | Blocks | **Today: forces** |
| `createClient`→`cookies()` public reads | No | After public reader | After | Shell+stream | Session pages |
| `force-dynamic` listing | No | After remove | After | After | Today |
| `searchParams` | No (that URL) | Split routes | Split | Dynamic hole | Query URLs |
| `getAuthContext` on `/user` | No | No full page | No | Hole | **Yes** |
| In-memory legal/help/categories | **Yes** | Yes | Yes | N/A | Only via loading |
| Middleware guest `/`→login | N/A | Authed only | N/A | N/A | Guest never gets `/` |

---

## 7. Final statement

1. **Cookie-free pages already exist in source** (`/categories`, `/legal`, `/help/[slug]`) but **cannot Edge-cache today** because root `app/loading.tsx` calls `headers()` — proven by production `private, no-store` + MISS on those URLs.

2. **Marketplace public HTML** (listing, category browse, search landing, store) is **UNNECESSARY DYNAMIC** primarily due to **`createClient`→`cookies()`** for anonymous-readable data, plus listing **`force-dynamic`**.

3. **Homepage is not a guest-public page** under current middleware — cache work there does not help guest TTFB; guests hit `/login` (also dynamic, **MUST REMAIN DYNAMIC** for session gate).

4. **Largest TTFB win with lowest risk = Phase A** (loading isolation) on Legal / Help / Categories → expect **~3 s → ~20–60 ms** on those documents when HIT (Phase 4 edge baseline).

**NO IMPLEMENTATION · NO COMMITS · NO PUSH · NO DEPLOY.**

**Await explicit Owner approval before Phase 8.**
