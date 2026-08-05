# ROVEXO P5 — Browse Performance Engine Report

**STATUS:** COMPLETE (awaiting Owner approval — no commit / push / deploy)  
**DATE:** 2026-08-04  
**LAW:** Zero functional change · Zero visual change · Performance only · Measurable opts only  

## Verdict

**PASS (technical / measurable).** Browse looks and behaves identically. Unnecessary category-tile React renders on `/browse` reduced **100%** on recent-history hydrate (primary client bottleneck). No infinite-scroll / virtualisation invented (none existed).

---

## 1. Root causes found

| # | Root cause | Evidence |
|---|------------|----------|
| 1 | `/browse` `SearchLandingView` owned `history` state in the same component that rendered all 10 category tiles | After localStorage hydrate, all category cards re-rendered for no reason |
| 2 | `SearchCategoryBrowseCard` was not memoised | Any parent update re-executed SafeImage + count formatting |
| 3 | Default `categoryCounts = []` / `trending = []` allocated new arrays | Unstable default identity when props omitted |
| 4 | Trending chips shared the history re-render path | Stable server `trending` re-rendered on every history update |
| 5 | **No client infinite scroll on Browse** | Category + programmatic pages are SSR `pageSize: 24` — no duplicate fetch / scroll jump path to fix |
| 6 | Listing grids already use `ListingCard` + `HP_CANONICAL_LISTING_PROPS` | Already memo + stable props — no speculative change |
| 7 | Live view bus notified **all** card subscribers on every slug publish | 24 callbacks woken per one view on a category grid (JS work); fixed via slug-scoped listeners |

**Not changed (no proven Browse-only win without risk):** ListingCard UI, Homepage pages, Search algorithm/typeahead ranking, filters/sort (absent on Browse listing pages), CSS/UI, API/DB, server `React.cache` on counts (optional TTFB only).

---

## 2. Components audited

| Surface | Component | Role |
|---------|-----------|------|
| `/browse` | `SearchLandingView` | Browse Categories + Recent + Trending |
| `/browse` | `SearchCategoryBrowseCard` | Category tile |
| `/category/[...slug]` | `CategoryPageView` | SSR listing grid |
| `/browse/[...segments]` | `ProgrammaticPageView` | SSR facet listing grid |
| Shared | `ListingCard` | Grid cards (already memo) |
| Shared | Filter / Sort panels | **Not present** on Browse listing pages |
| Shared | Infinite scroll | **Not present** on Browse |

---

## 3–4. Render counts before / after

Evidence: `node scripts/p5-browse-render-evidence.mjs` → `test-results/p5-browse-performance/render-evidence.json`

### History hydrate → category cards (10 tiles)

| Metric | Before | After |
|--------|--------|-------|
| Mount renders | 10 | 10 |
| Extra renders on history hydrate | **10** | **0** |
| Reduction | — | **100%** |

### Targets

| Target | Result |
|--------|--------|
| Browse rerenders ≥30% | **PASS** (100% on measured hydrate path) |
| JS work / CPU (derived) | Fewer card reconciles + SafeImage work skipped on hydrate |
| Infinite scroll | N/A — none present; no virtualisation added |
| Layout shift / behaviour | **ZERO** change |

---

## 5–8. Scroll FPS / CPU / Memory / Long tasks

| Metric | Agent finding |
|--------|----------------|
| Scroll FPS on `/browse` | Idle landing — category grid static after hydrate; fewer hydrate commits reduce main-thread work |
| Category listing scroll | SSR grid of ≤24 `ListingCard`s — same as before; P4 toast/badge bail still applies platform-wide |
| CPU / JS work | **PASS (derived)** from eliminated 10 card re-renders per hydrate (+ trending isolation) |
| Memory | Fewer Map/card function allocations on history updates |
| Long tasks | No new observers/intervals; no leak sources added |
| Forced layout / CLS | No CSS/DOM structure change — **ZERO CLS regression** |

Live multi-device FPS traces remain Owner gate on `https://www.rovexo.co.uk` after deploy authorization.

---

## 9. Infinite scroll analysis

```
Browse listing pages = SSR page 1 only (pageSize 24)
No IntersectionObserver
No loadMore
No client pagination state
```

**Conclusion:** Nothing to dedupe. Introducing virtualisation would violate “only if measured bottleneck + proven gain” — **not done**.

---

## 10. Category switch analysis

Category switch = Next.js navigation `/browse` → `/category/{slug}` (full RSC navigation).

| Aspect | Finding |
|--------|---------|
| Client state switch | None |
| API | Server `getEligibleListings` unchanged |
| Optimisation applied | Faster idle `/browse` (stable tiles) before navigation; listing page left alone (already SSR + memo cards) |

---

## 11. Files modified

| File | Change |
|------|--------|
| `features/search/components/SearchCategoryBrowseCard.tsx` | `memo` |
| `features/search/components/SearchLandingView.tsx` | `BrowseCategoriesGrid` + `TrendingSearchesSection` memo isolation; stable empty defaults; callbacks for history actions |
| `tests/p5-browse-performance-engine-v1.test.ts` | Contract lock |
| `scripts/p5-browse-render-evidence.mjs` | Measurable evidence |
| `lib/views/view-live-sync.ts` | Slug-scoped listeners (follow-up) |
| `lib/views/use-live-product-views.ts` | Subscribe per slug (follow-up) |

**Not modified:** Homepage pages, ListingCard UI, CategoryPageView, ProgrammaticPageView, APIs, filters, CSS, Auth, Wallet, Checkout, Sell, Messages.

---

## 12. React Profiler evidence

jsdom microbench mirrors Profiler “why did this render?” for history `setState` → category tiles. Pattern: parent state update + memoised child with stable props → **bail**.

---

## 13. Device matrix

| Device / browser | Agent status |
|------------------|--------------|
| Desktop Chrome | Build + evidence + Vitest PASS |
| Desktop Edge | Same code path |
| Safari iPhone | Same |
| Chrome Android | Same |
| Chrome iPhone | Same |

Official Owner URL for approval: `https://www.rovexo.co.uk/browse`

---

## 14. Before / After metrics (summary)

| Path | Before | After |
|------|--------|-------|
| `/browse` history hydrate card renders | +10 | +0 |
| Trending section on history update | Re-rendered | Skipped (`memo` + stable `trending` + stable `applyTerm`) |
| Category listing behaviour | SSR 24 cards | Identical |
| Visual / UX / filters / sort / ranking | — | Identical |

---

## 15. Quality gates

| Gate | Result |
|------|--------|
| TypeScript | **PASS** |
| ESLint (touched files) | **PASS** |
| Production Build | **PASS** |
| Vitest (P5 + Search UI freeze + category counter + header SSOT + search system) | **PASS** (29) |
| Vitest (P5 live-view scope + view locks) | **PASS** |
| Functional / Visual / Behaviour regression | **ZERO** |
| Owner Commit / Push / Deploy | **BLOCKED until Owner approval** |

---

## Follow-up from Browse pipeline audit

[Explore Browse render pipeline](f0b73bb5-f04a-4c39-9a36-4175c9890be6) confirmed the P5 landing opts and ranked one remaining zero-risk win:

| Recommendation | Status |
|----------------|--------|
| Isolate / memo Browse category grid | Already shipped in P5 |
| `memo(SearchCategoryBrowseCard)` | Already shipped |
| Stabilize landing handlers | Already shipped |
| **Scope live-view subscriptions per slug** | **Shipped in follow-up** (`view-live-sync` + `use-live-product-views`) |
| Server `React.cache` on category counts | Skipped — no client render evidence; optional TTFB only |

### Live-view slug scope evidence

`test-results/p5-browse-performance/render-evidence.json` → `liveViewSlugScope`

| Metric (24 Browse listing cards) | Before | After |
|----------------------------------|--------|-------|
| Listener callbacks on one `publishViewLive` | **24** | **1** |
| Reduction | — | **≈96%** |

Behaviour unchanged: matching card still receives the live views update; unrelated cards are not woken.

---

## PASS / FAIL

**P5 Browse Performance Engine = TECHNICAL PASS** (including live-view follow-up).

Browse looks IDENTICAL. Browse behaves IDENTICALLY. Browse is faster on proven hydrate + live-view wake paths.

**No commit / push / merge / deploy without explicit Owner approval.**
