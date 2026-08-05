# ROVEXO PERFORMANCE ROOT CAUSE
## PHASE 2 — MICRO PROFILING (EVIDENCE ONLY)

**STATUS:** EVIDENCE COMPLETE · **NO OPTIMISATIONS APPLIED BY THIS PHASE**  
**Host measured:** `https://www.rovexo.co.uk` (live production)  
**Probe time:** 2026-08-03T23:54Z → 2026-08-04T00:00Z (UTC)  
**Raw evidence:** `test-results/perf-root-cause/raw.json` · `summary.json`  
**Profiler script:** `scripts/perf-root-cause-profile.mjs` (measurement only)

**Rules compliance:** No production deploy · No commit · No push · No intentional app behaviour change in this phase.  
**Note:** Local working tree still contains *uncommitted* Phase-Omega draft edits (middleware guest fast-path, header `unoptimized` removal, compressed local PNGs). **Those are NOT live.** All timings below are from **deployed production**.

---

## FINAL VERDICT — WHERE THE MISSING 3–4 SECONDS GO

### One-sentence root cause

**≈3.1 seconds of every HTML document wait is spent inside Vercel’s US-East (`iad1`) Next.js server render path (middleware + RSC/HTML generation) after the London (`lhr1`) edge; browser paint cannot start until that HTML arrives.**

### Millisecond accounting — warm `/login` (curl sample #2)

| Step | Start (ms from connect start) | End | Duration | % of total (3557 ms) | Evidence |
|---|---:|---:|---:|---:|---|
| 1. DNS | 0 | 8 | **8** | 0.2% | curl `time_namelookup` |
| 2. TCP | 8 | 17 | **9** | 0.3% | curl connect − dns |
| 3. TLS | 17 | 36 | **19** | 0.5% | curl appconnect − connect |
| 4. Edge CDN baseline (static HIT, same POP) | — | — | **~20** | 0.6% | `/favicon.ico` wait 20 ms · `x-vercel-id: lhr1::…` (no `iad1`) |
| 5. **Server wait after TLS (TTFB body)** | 36 | 3145 | **3109** | **87.4%** | curl `time_starttransfer` − TLS |
| 5a. Middleware + Auth upper bound | ⊂5 | ⊂5 | **≤150–210** | ≤5.9% | Guest `/api/inbox/badge` **401** on same `lhr1::iad1` = **150–211 ms** interleaved with 3 s HTML |
| 5b. Direct `getUser()` (UK→Supabase) | — | — | **median 43** | 1.2% | 5× `supabase.auth.getUser()` samples |
| 5c. **RSC / HTML / document render residual** | ⊂5 | ⊂5 | **≈2900–2950** | **~82%** | HTML wait − guest-API upper bound |
| 6. HTML transfer | 3145 | 3557 | **413** | 11.6% | curl total − TTFB |
| 7. Browser parse → DCL / FCP | ~0 nav | ~3560 | **~3500–3570** | — | Playwright FCP login **3572 ms** (blocked on document) |
| 8. Hydration / long-tasks | — | — | **0 measured** | — | `PerformanceObserver` longtask = 0 (see limits) |
| 9. First interaction | — | — | **≥ FCP** | — | No INP lab; interaction only after HTML+JS |

**Arithmetic check (login warm):**  
`8 + 9 + 19 + 3109 + 413 = 3558 ms` ≈ measured total **3557 ms**.  
**Missing seconds are inside step 5 (server wait), not DNS/TLS/transfer.**

### Differential proof (not guesswork)

| Probe | Wait after TLS | `x-vercel-id` | `x-vercel-cache` | Meaning |
|---|---:|---|---|---|
| `/favicon.ico` | **20 ms** | `lhr1::…` | HIT | Edge only |
| `/_next/static/chunks/*.js` | **~62 ms** | `lhr1::…` | HIT | Edge only |
| `/api/inbox/badge` guest 401 | **150–211 ms** | `lhr1::iad1::…` | MISS | Full function + middleware, light handler |
| `/login` HTML | **~3100 ms** | `lhr1::iad1::…` | MISS | Same region, **document SSR** |
| `/api/search/trending` → `/_not-found` | **~3066–3133 ms** | `lhr1::iad1::…` | MISS | Even **404 page render** ≈ 3.1 s |
| All HTML pages (guest+auth) | **3100–3536 ms** (median **3245**) | always `lhr1::iad1` | MISS | Page-invariant floor |

**Conclusion:** Cross-region presence (`lhr1` → `iad1`) is confirmed on every dynamic miss, but **RTT alone is not the 3 s** (guest API proves ≤211 ms for the same region path). The dominant cost is **Next.js document / `_not-found` server rendering on `iad1`**, ~2.9 s after subtracting the middleware/API upper bound.

---

## INSTRUMENTATION LIMITS (HONEST GAPS)

Phase 2 forbids code changes. Therefore these slices are **not** separately timed on the server:

| Requested slice | Status | How bounded |
|---|---|---|
| Edge vs Middleware vs getUser vs RSC vs HTML generation | **NOT SEPARATELY TIMED** | No `Server-Timing` headers on responses; bounded by differentials above |
| Every SQL query · EXPLAIN · indexes · seq scans | **EXTERNAL BLOCKER** | No Supabase SQL admin / `EXPLAIN` session in this probe |
| Every React component >10 ms · render counts | **UNINSTRUMENTED** | No React Profiler build; longtask API returned 0 |
| Suspense / streaming span timings | **NOT EXPOSED** | No flight timing headers |
| Exact middleware duration alone | **UPPER-BOUNDED** | Guest API 401 path ≤211 ms includes middleware |

To split 5a/5b/5c to the millisecond on production, Owner must authorize **read-only Server-Timing instrumentation** (future phase) — not done here.

---

## PAGE LIFECYCLE MATRIX (CURL · WAIT AFTER TLS)

Two samples each. Duration = server wait after TLS (dominant).

| Page | Mode | Sample1 ms | Sample2 ms | % of request dominated by server wait | Vercel |
|---|---|---:|---:|---|---|
| Homepage `/` | guest→login redirect chain | 3225 | **5126** | ~90%+ | `lhr1::iad1` |
| Homepage `/` | auth | 3275 | 3536 | ~90% | `lhr1::iad1` |
| Search `/search` | guest | 3135 | 3190 | ~90% | `lhr1::iad1` |
| Categories `/categories` | guest | 3100 | 3113 | ~98% | `lhr1::iad1` |
| Listing `/listing/…` | auth (PW doc wait) | — | **4211** | — | `lhr1::iad1` |
| Sell `/sell` | auth | 3250 | 3289 | ~90% | `lhr1::iad1` |
| Profile `/account` | auth | 3386 | 3255 | ~90% | `lhr1::iad1` |
| Wallet `/wallet` | auth | 3245 | 3280 | ~90% | `lhr1::iad1` |
| Orders `/orders` | auth | 3250 | 3290 | ~90% | `lhr1::iad1` |
| Messages `/inbox` | auth | 3227 | 3334 | ~96% | `lhr1::iad1` |
| Notifications | auth (redirects to inbox tab) | 3120 | 3234 | ~98% | `lhr1::iad1` |
| Settings `/account/settings` | auth | 3197 | 3233 | ~90% | `lhr1::iad1` |
| Login `/login` | guest | 3124 | 3109 | **87%** | `lhr1::iad1` |

**Guest vs auth HTML delta (fastest login vs fastest settings): +88 ms.** Auth does **not** explain the 3 s floor.

---

## PLAYWRIGHT MOBILE LIFECYCLE (POST-HTML)

Navigation Timing `ttfb` fields of 10–17 ms are **unreliable** here (do not use). Use document resource `waiting_ttfb` / curl instead.

| Page | Doc wait (ms) | FCP (ms) | DCL (ms) | Long-task total | Top post-HTML API waits |
|---|---:|---:|---:|---:|---|
| login | 3241 | 3572 | 3560 | 0 | (document only) |
| search | 3755 | 3900 | 4500 | 0 | live-presence 827 |
| categories | 3167 | 3308 | 3294 | 0 | live-presence 398 |
| home_guest | 3277→login | 3744 | 3729 | 0 | — |
| home_auth | 3529 | 3712 | 4739 | 0 | settings **3993**, saved 2046, feed 1190, profile 1152 |
| sell | 3430 | 3564 | 4014 | 0 | notif/settings 870, profile 841, badge 794 |
| profile | 3475 | 3652 | 4921 | 0 | snapshot 1279, bundle 805 |
| wallet | 3359 | 3500 | 4728 | 0 | profile 861, settings 807 |
| orders | 3477 | 3668 | 4466 | 0 | settings 639, profile 612 |
| messages | 3850 | 4032 | 4019 | 0 | messages **1630**, notifications **1605** |
| notifications | 3406 | 3504 | 3502 | 0 | notifications 1017 (+ duplicate settings) |
| settings | 3256 | 3420 | 3959 | 0 | notif/settings 793, profile 729 |
| listing | 4211 | 4724 | 4598 | 0 | views **2204**, saved 1300, recently-viewed 1028 |

**FCP ≈ document wait** on every page → first paint is gated by HTML TTFB, not by JS/CSS parse.

---

## AUTH / SESSION / getUser

### Code path (production behaviour — source correlation)

| # | File | Function | Line | What runs |
|---|---|---|---:|---|
| 1 | `middleware.ts` | `middleware` | 12–23 | Always `updateSession` after SEO |
| 2 | `lib/supabase/middleware.ts` | `updateSession` | **161** | `await supabase.auth.getUser()` (production deploy; local uncommitted guest skip **not live**) |
| 3 | `lib/supabase/middleware.ts` | MFA AAL | **222** | `getAuthenticatorAssuranceLevel()` when user present |
| 4 | `lib/supabase/middleware.ts` | `getProfileRole` | **102–110** | `profiles.select("role")` when role needed |
| 5 | `lib/auth/guest-redirect.ts` | `redirectIfAuthenticated` | **14–18** | **Second** `getUser()` on login/register RSC |
| 6 | `lib/auth/oauth-provider-availability.server.ts` | `probeProvider` | 37–79 | OAuth enablement fetch (login/register) |

### Measured Auth timings (probe machine → Supabase)

| Operation | Duration | Expected (healthy) | Potential gain if fixed later |
|---|---:|---:|---|
| Auth health | 195 ms | <100 ms | low |
| `getUser` median (5 samples) | **43 ms** | <80 ms | — already fast from probe |
| `getUser` mean | 49 ms | <80 ms | — |
| `profiles.role` query | **213 ms** | <50–100 ms | ~100–150 ms on role paths |
| `signInWithPassword` | 515 ms | <400 ms | — |
| Browser `/auth/v1/user` on sell/wallet | **31–37 ms wait** | <80 ms | — |

**getUser is not the 3-second bug.** It is a small additive cost inside a much larger SSR floor.

---

## DATABASE

### What was printed

| Item | Result |
|---|---|
| Every SQL query text | **NOT AVAILABLE** (no DB admin / query log export) |
| Duration / rows / indexes / seq scans | **NOT AVAILABLE** |
| N+1 / duplicate auth queries | **Inferred from API latency + code paths only** |

### Inferred query-related costs (API wall times as proxy)

| Proxy surface | Auth wait (curl) | File (handler entry) | Notes |
|---|---:|---|---|
| `/api/messages` | **2200 ms** | `app/api/messages/…` | Slowest auth API curl |
| `/api/account/snapshot` | **1611 ms** | `app/api/account/snapshot/…` | Profile hub |
| `/api/saved` | **1209 ms** | `app/api/saved/route.ts` | |
| `/api/homepage/feed` | **1045–1259 ms** | homepage feed route | |
| `/api/notifications` | **999 ms** | notifications API | |
| `/api/inbox/badge` | **522 ms** | badge API | |
| Guest 401 on same APIs | **150–155 ms** | auth fail-closed | Proves handler work dominates auth success path |

**Duplicate / repeated patterns (Playwright):**

- Almost every authenticated page fires: `/api/profile`, `/api/settings`, `/api/bundle`, `/api/inbox/badge`, `/api/notifications/settings`, `/api/analytics/live-presence` (sequential/parallel client waterfall **after** HTML).
- `/notifications` loaded **`/api/notifications/settings` twice** (819 ms + 732 ms).
- Listing: `views` + `saved` + `recently-viewed` + `offers` + chrome APIs.

These affect **post-FCP** interactivity, not the 3.1 s HTML floor.

---

## TOP 20 SLOWEST OPERATIONS

| # | Operation | File / locus | Duration | Expected | Potential gain |
|---:|---|---|---:|---:|---|
| 1 | HTML SSR floor (all documents) | Next.js on `iad1` via `middleware.ts`→RSC | **3100–3500 ms** | <500–800 ms TTFB | **−2.3 to −3.0 s** |
| 2 | `/_not-found` SSR | `x-matched-path: /_not-found` | **3066–3133 ms** | <300 ms | −2.8 s (symptom of same floor) |
| 3 | Guest `/` coldish redirect chain | middleware `/`→`/login` | up to **5126 ms** wait | <800 ms | −4 s |
| 4 | Listing document wait | `app/(platform)/listing/…` | **4211 ms** | <800 ms | −3.4 s |
| 5 | Inbox document wait | Conversation hub route | **3850 ms** | <800 ms | −3.0 s |
| 6 | Search document wait | `app/(platform)/search/page.tsx` | **3755 ms** | <800 ms | −3.0 s |
| 7 | Home auth document | homepage RSC | **3529 ms** | <800 ms | −2.7 s |
| 8 | `/api/settings` (PW home) | settings API | **3993 ms** | <200 ms | −3.8 s post-paint |
| 9 | `/api/views` (listing) | views API | **2204 ms** | <150 ms | −2.0 s |
| 10 | `/api/messages` curl auth | messages API | **2200 ms** | <200 ms | −2.0 s |
| 11 | `/api/saved` (PW home) | saved API | **2046 ms** | <200 ms | −1.8 s |
| 12 | `/api/account/snapshot` | snapshot API | **1611 ms** | <200 ms | −1.4 s |
| 13 | `/api/messages` (PW) | messages API | **1630 ms** | <200 ms | −1.4 s |
| 14 | `/api/notifications` (PW inbox) | notifications API | **1605 ms** | <200 ms | −1.4 s |
| 15 | `/api/homepage/feed` | feed API | **1045–1259 ms** | <200 ms | −0.8–1.0 s |
| 16 | Wallet hero PNG transfer | `public/wallet/balance-hero-banking-v1.png` | **2.45 MB** transfer | <100 KB | LCP/bytes |
| 17 | App icon PNG transfer (live) | `public/brand/canonical-rx/app-icon-v1.png` | **2,656,168 B** | <40 KB | −2.5 MB · LCP |
| 18 | OAuth provider probes (login RSC) | `oauth-provider-availability.server.ts` | unknown ⊂ SSR | cached 60 s | unknown until Server-Timing |
| 19 | Second `getUser` on login | `guest-redirect.ts:18` | ≤43–150 ms | 0 duplicate | −1 RTT |
| 20 | `profiles.role` | `middleware.ts` getProfileRole | **213 ms** | <50 ms | −150 ms on role paths |

---

## TOP 20 SLOWEST QUERIES

**SQL text / EXPLAIN:** unavailable (EXTERNAL BLOCKER).  
**Proxy ranking by auth API server wait:**

| # | Proxy endpoint | Wait ms | Likely query surface | Expected | Potential gain |
|---:|---|---:|---|---:|---:|
| 1 | `/api/messages` | 2200 | inbox/messages select | <200 | −2000 |
| 2 | `/api/views` (POST/GET path) | 2204 | views write/read | <150 | −2000 |
| 3 | `/api/saved` | 1209–2048 | saved listings | <200 | −1000–1800 |
| 4 | `/api/account/snapshot` | 1282–1611 | account aggregate | <200 | −1100–1400 |
| 5 | `/api/notifications` | 999–1690 | notifications | <200 | −800–1500 |
| 6 | `/api/homepage/feed` | 1045–1259 | feed/ranking | <200 | −850–1050 |
| 7 | `/api/settings` (outlier PW) | 3993 | settings read | <150 | −3800 (investigate) |
| 8 | `/api/profile` | 591–1154 | profile | <150 | −400–1000 |
| 9 | `/api/recently-viewed` | 1030 | recently viewed | <150 | −880 |
| 10 | `/api/offers` | 902 | offers by slug | <150 | −750 |
| 11 | `/api/notifications/settings` | 542–913 | notif prefs | <100 | −400–800 |
| 12 | `/api/bundle` | 547–819 | feature bundle | <100 | −450–700 |
| 13 | `/api/inbox/badge` | 522–795 | badge count | <100 | −400–700 |
| 14 | `/api/analytics/live-presence` | 393–827 | presence | <100 | −300–700 |
| 15 | `profiles.role` (direct) | 213 | `profiles` PK lookup | <50 | −150 |
| 16–20 | *(SQL EXPLAIN slots)* | — | — | — | Requires DB admin |

---

## TOP 20 SLOWEST COMPONENTS

**Per-component React Profiler (>10 ms): NOT MEASURED** (would require code instrumentation).

| # | Surface proxy | Evidence | Duration | File | Expected | Potential gain |
|---:|---|---|---:|---|---:|---:|
| 1 | Document SSR (all pages) | curl/PW | ~3100 ms | App Router + middleware | <500 | −2600 |
| 2 | Login RSC tree | FCP 3572 | gated by SSR | `app/(auth)/login/page.tsx` | <800 | −2700 |
| 3 | Search RSC | FCP 3900 | gated by SSR | `app/(platform)/search/page.tsx` | <800 | −3100 |
| 4 | Home auth shell | FCP 3712 | gated by SSR | homepage route | <800 | −2900 |
| 5 | Sell client island | large JS chunks | post-FCP | Sell feature | smaller JS | bundle split |
| 6 | Wallet hero image | 2.45 MB | decode/transfer | wallet CSS/img | <100 KB | LCP |
| 7 | Header app icon | 2.66 MB live | transfer | `RovexoHeaderV2.tsx` + asset | <40 KB | LCP |
| 8–20 | Individual React components | — | **UNKNOWN** | — | — | Needs Profiler |

`"use client"` file count (repo scan): **770** — architectural weight, not a timing.

---

## TOP 20 SLOWEST API CALLS

| # | URL | Wait ms | Status | Context | Expected | Potential gain |
|---:|---|---:|---:|---|---:|---:|
| 1 | `/api/settings` | 3993 | 200 | home_auth PW | <200 | −3790 |
| 2 | `/api/views` | 2204 | 200 | listing | <150 | −2050 |
| 3 | `/api/messages` | 2200 | 200 | curl auth | <200 | −2000 |
| 4 | `/api/saved` | 2046 | 200 | home_auth PW | <200 | −1840 |
| 5 | `/api/messages` | 1630 | 200 | inbox PW | <200 | −1430 |
| 6 | `/api/notifications` | 1605 | 200 | inbox PW | <200 | −1400 |
| 7 | `/api/account/snapshot` | 1611 | 200 | curl | <200 | −1410 |
| 8 | `/api/saved` | 1209 | 200 | curl | <200 | −1000 |
| 9 | `/api/homepage/feed` | 1259 | 200 | curl guest | <200 | −1050 |
| 10 | `/api/account/snapshot` | 1279 | 200 | profile PW | <200 | −1080 |
| 11 | `/api/notifications` | 1017 | 200 | notifications PW | <200 | −800 |
| 12 | `/api/recently-viewed` | 1028 | 200 | listing | <150 | −880 |
| 13 | `/api/profile` | 1152 | 200 | home_auth | <150 | −1000 |
| 14 | `/api/offers?productSlug=…` | 901 | 200 | listing | <150 | −750 |
| 15 | `/api/notifications/settings` | 870–913 | 200 | multi | <100 | −770 |
| 16 | `/api/search/trending` | 3098 | **404** | missing route → not-found SSR | <50 | fix route or avoid |
| 17 | `/api/inbox/badge` | 522–795 | 200 | multi | <100 | −400–700 |
| 18 | `/api/bundle` | 547–819 | 200 | multi | <100 | −450–700 |
| 19 | `/api/analytics/live-presence` | 393–827 | 200 | multi | <100 | −300–700 |
| 20 | `/api/settings` | 598–809 | 200 | multi | <150 | −450–650 |

**Sequential waterfalls:** chrome APIs fire after HTML on every auth page (profile/settings/bundle/badge/notifications/live-presence). They do not create the 3.1 s TTFB but delay hydration-ready data.

---

## TOP 20 SLOWEST MIDDLEWARE OPERATIONS

No per-span middleware timing on production. Ranked by **code path cost correlation + bounds**:

| # | Operation | File:line | Bound / note | Expected | Potential gain |
|---:|---|---|---|---:|---:|
| 1 | Entire HTML request through middleware+SSR | `middleware.ts:12` → RSC | **3100 ms** floor | <500 | −2600 |
| 2 | `updateSession` always on matcher | `lib/supabase/middleware.ts:126` | ⊂ HTML/API | <50 guest / <150 auth | guest skip (not live) |
| 3 | `getUser()` | `:161` | ≤ guest API **211 ms** total path | <80 | small vs SSR |
| 4 | MFA `getAuthenticatorAssuranceLevel` | `:222` | auth only | <50 | small |
| 5 | `getProfileRole` profiles query | `:102-110` | **213 ms** direct | <50 | −150 |
| 6 | SEO `applySeoRouting` | `lib/seo/engine/middleware-handler.ts:62` | skipped for reserved segments (`login`, `search`, …) | ~0 on those | — |
| 7 | Matcher breadth | `middleware.ts:27-28` | nearly all non-static | — | reduce scope later |
| 8–20 | *(unmeasured sub-ops)* | — | need Server-Timing | — | — |

---

## TOP 20 LARGEST ASSETS (REPO + LIVE TRANSFER)

| # | Asset | Bytes | Live transfer note |
|---:|---|---:|---|
| 1 | `public/hero/fast-delivery-3840.png` | 23,455,688 | Not in homepage PW critical path this run |
| 2 | `public/hero/move-store-3840.png` | 18,011,534 | idem |
| 3 | `public/hero/buy-securely-3840.png` | 13,865,210 | idem |
| 4 | `public/hero/verified-businesses-3840.png` | 13,190,011 | idem |
| 5 | `public/hero/premium-auctions-3840.png` | 9,535,959 | idem |
| 6 | `public/hero/home-garden-3840.png` | 7,105,778 | idem |
| 7–9 | hero 1920 / source duplicates | ~5.8–4.6 MB | idem |
| 10 | `public/brand/canonical-rx/app-icon-v1.png` **LIVE** | **2,656,168** | Homepage PW transferred **2,656,468** |
| 11 | `app-icon-v1.master-hd.png` (local only) | 2,656,168 | not deployed concern |
| 12 | `rx-favicon-source-v1.png` | 2,656,168 | source |
| 13 | Wallet `balance-hero-banking-v1.png` | ~2.45 MB transferred | Wallet PW |
| 14+ | remaining hero/source set | multi-MB | inventory |

**Critical path asset:** live **2.6 MB header app icon** on authenticated homepage (after HTML). Local compression exists but is **not production**.

---

## TOP 20 LARGEST BUNDLES (`.next/static` local build inventory)

| # | Chunk | Bytes |
|---:|---|---:|
| 1 | `2mb0vdux0xjt1.css` | 794,886 |
| 2 | `0lt42bxaql9x1.js` | 415,790 |
| 3 | `0yuny8gie2bal.js` | 299,302 |
| 4–6 | `0d2el5l45dy6t.js` / twins | 298,680 |
| 7 | `3m-x0-nwv87vj.js` | 231,718 |
| 8 | `38o-jlfrz7gew.js` | 209,196 |
| 9 | `3ii-s5vlbxm10.js` | 171,803 |
| 10 | `0m0fetrv4h75u.js` | 148,350 |
| 11 | `1uvk00a93vv1f.js` | 139,738 |
| 12 | `2x8rot60kmmna.css` | 121,890 |
| 13–20 | 73–112 KB JS/CSS chunks | — |

Login PW largest transferred JS ~74 KB + 55 KB + 30 KB (not the multi-MB problem).

---

## NEXT.JS / REACT SUMMARY

| Metric | Evidence |
|---|---|
| Dynamic HTML cache | Always `x-vercel-cache: MISS` · `cache-control: private, no-store` |
| Compute region | **`iad1` (Washington)** behind **`lhr1` (London)** edge |
| `vercel.json` regions | **Not set** (defaults → observed `iad1`) |
| Streaming / Suspense timings | Not exposed |
| Client components | **770** `"use client"` files (static count) |
| Hydration long tasks | **0** recorded (observer may miss; not proof of zero main-thread cost) |

---

## WHERE THE 3–4 SECONDS ARE — STACKED MODEL

```
User (UK) 
  → DNS/TCP/TLS           ~36 ms
  → Vercel Edge lhr1      ~20 ms (static proves edge is fine)
  → Invoke Serverless iad1
      → Middleware+getUser   ≤ ~150–210 ms   (proven by guest API)
      → RSC/HTML render      ≈ 2900–2950 ms  (residual = THE GAP)
  → HTML download         ~400 ms
  → FCP                   ~3500–4700 ms (waits on HTML)
  → Client API waterfall  +0.5–4.0 s data (after paint)
  → Fat images (icon/hero)+2.6 MB / +2.45 MB (LCP risk)
```

**Primary (≈3.0 s):** Next.js document SSR on `iad1` (including `_not-found`).  
**Secondary (post-paint):** slow authenticated APIs (messages/saved/snapshot/settings outlier).  
**Tertiary (bytes):** 2.6 MB app icon + multi-MB wallet/hero PNGs.  
**Not primary:** Supabase `getUser` (43 ms direct; ≤211 ms in guest API path).

---

## FINAL PRODUCTION SCORE (PHASE 2)

| Gate | Result |
|---|---|
| Evidence completeness for TTFB floor | **PASS** (accounted) |
| Per-ms Edge/Middleware/RSC split | **FAIL / BLOCKED** (needs Server-Timing; no code changes this phase) |
| SQL EXPLAIN board | **EXTERNAL BLOCKER** |
| React component >10 ms board | **UNINSTRUMENTED** |
| Optimisations applied | **NONE (this phase)** |

**Root cause confidence (TTFB):** **HIGH** — page-invariant ~3.1 s HTML + same-region guest API ≤211 ms + `_not-found` also ~3.1 s + static edge ~20–60 ms.

---

## AWAITING OWNER APPROVAL

No commit · No push · No deploy · No further code changes until Owner authorizes **Phase 3** (targeted fixes).  

Suggested Owner choices (not executed):

1. Authorize Server-Timing micro-spans (read-only) to split middleware vs RSC to the millisecond.  
2. Authorize infra check: pin Vercel **`lhr1`** (or UK) serverless region.  
3. Authorize optimisation wave against the proven SSR floor + API waterfalls + 2.6 MB icon (production).

**END OF PHASE 2 REPORT**
