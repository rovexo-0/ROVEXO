# SELL PAGE — PERFORMANCE ROOT CAUSE ANALYSIS (P1)

**Date:** 2026-07-02  
**Status:** ✅ **ROOT CAUSE FIXED + HARDENED** — taxonomy moved entirely off the main thread (Web Worker)  
**Scope:** `/sell` unresponsive UI on Windows Chrome, iPhone Safari, iPhone Chrome, Android Chrome

---

## Why the PWA published fine but the browser hung (the key clue)

The freeze is **only reachable on the AI-fallback detection path** — titles that do
**not** match a high-precision rule in `title-category-rules.ts`. Rule-matching
titles ("iPhone 13", "PlayStation 5", "MacBook Air", …) short-circuit inside
`suggestCategoryFromTitle` **before** the taxonomy is ever built, so they never
hit the loop.

- The installed PWA "worked" because those listings used rule-matching titles →
  detection returned from the rule table → taxonomy never built → no hang.
  Successful publish only proves the API is fine; it says nothing about the renderer.
- The browser hung because the title used had **no rule** → AI fallback →
  `buildTaxonomyTree()` → `ensureUniqueSlug()` **infinite loop** → renderer never
  yields → Chrome kills it with `RESULT_CODE_HUNG` on the next navigation.

This is a code-path difference, not a caching or device difference. (The service
worker is network-first for HTML and never caches JS chunks, so it cannot pin an
old bundle — ruled out.)

## Structural hardening (2026-07-02): taxonomy runs in a Web Worker

Even with the loop fixed, the one-time taxonomy build + fuzzy search is pure CPU
and, on a slow phone, could still jank the UI. It is now moved **entirely off the
main thread**:

- `features/sell/workers/category-detection.worker.ts` runs
  `detectCategoryFromTitle` and index warming inside a dedicated Web Worker.
- `SellProvider` posts `{ type: "detect" }` / `{ type: "warm" }` to the worker and
  applies the result via `applyDetectionResult`. Stale keystroke responses are
  ignored by request id. The worker is terminated on unmount.
- **Graceful fallback:** if `Worker` is unavailable or fails to load, detection
  falls back to the previous idle-time main-thread path — functionality is never lost.

Result: the taxonomy tree build, keyword/synonym index construction and fuzzy
search **can no longer block the Description field, scrolling, or `beforeunload`**
on any platform. Even a hypothetical future data defect that reintroduced a slow
build would stall the worker, not the UI. `sw.js` cache bumped to `v5` so the fix
reaches installed PWAs and returning browsers cleanly.

Validated: `npm run typecheck` ✓ · `npm run build` (exit 0, worker chunk
`turbopack-worker-*.js` emitted) ✓ · 45/45 taxonomy/detection tests ✓.

---

## ROVEXO v1.0 — final AI-category architecture (2026-07-02)

Product decision implemented:

- **100% local AI** — detection is local rules + fuzzy search over the bundled
  taxonomy. There are **no cloud-AI calls** anywhere in the sell/detection path
  (verified). Nothing to remove; the worker keeps it local.
- **Runs once, on pause, in the Worker** — the title `onChange` schedules a
  debounced (`categoryDebounceMs`) run in the provider; `runCategoryDetection`
  posts to the Web Worker. A `lastDetectionInputRef` guard means the same
  title+description never re-runs detection. Typing the **Description never
  triggers detection at all** (title-driven only).
- **One suggestion + confidence** — `applyDetectionResult` produces at most one
  `SellCategorySuggestion { path, confidence, label }` (no list, no tree, no
  silent auto-select). Below `SUGGEST_CONFIDENCE_MIN` nothing is shown.
- **Accept / Change** — `ListingForm` renders `Suggested category · <label> · NN%`
  with **Accept** (applies the path, marks the choice as user-owned) and
  **Change** (opens the manual `CategoryTreePicker`). Manual selection clears the
  suggestion and stops further nagging.

Net effect on the main thread while typing: **zero taxonomy work**. Detection is
debounced → posted to a worker → the result is a tiny structured-clone object.
This scales to many concurrent users because the heavy work is per-tab, off the
UI thread, and never runs per keystroke.

## Taxonomy simplification — plan (deferred, low-risk rollout)

The oversized taxonomy (~11.6k nodes) is driven by `buildProductFamily` in
`lib/taxonomy/category-tree.ts`, which expands `brands × models × variants`
combinatorially. Now that detection runs in a worker this is no longer a
*performance* risk, but it remains a *maintainability/scalability* one.

Proposed curated structure (do **after** the freeze fix is validated in
Production, to avoid detection regressions right before the audit):

1. Keep the high-precision `TITLE_CATEGORY_RULES` — they already cover the common
   cases with ≥0.9 confidence and don't need the giant tree.
2. Replace `buildProductFamily`'s combinatorial expansion with a **curated
   leaf-category list** (hundreds, not thousands) + a keyword/synonym map, so the
   fuzzy fallback resolves to a stable set of real categories.
3. Gate every reduction behind the existing detection tests
   (`suggest-category-from-title`, `category-detection-step7`) so accuracy can't
   silently regress. Add fixtures for the top ~100 real-world titles first.
4. Track node count and warm-build time in `sell-taxonomy-search.test.ts` as a
   ratchet (fail if it grows again).

---

## Confirmed call stack (typing → freeze)

Captured with a real thrown stack trace from the taxonomy builder:

```
Description onChange (local state only — fast)
Title/Description blur → syncTitleToDraft / syncDescriptionToDraft
  → scheduleCategoryDetection()               (1000 ms debounce)
    → runCategoryDetection()                  (requestIdleCallback, MAIN THREAD)
      → detectCategoryFromTitle(title, pendingDescription)
        → suggestCategoryFromTitle()          (rule miss → AI fallback)
          → detectAiCategory()
            → searchCategories()
              → getKeywordMatches() / getSynonymMatches()  (per token)
                → getSynonymIndex() / getKeywordIndex()
                  → getFlatTaxonomy() → buildTaxonomyTree()
                    → buildNode() (recursion)
                      → ensureUniqueSlug("bosch", "engine-parts-collection")
                        → while (registry.has(slug)) { slug = `${parent}-${candidate}` }
                          → CONSTANT slug, suffix never used → INFINITE LOOP
                            → main-thread hang → Chrome "Page Unresponsive"
```

Real evidence (thrown from an instrumented guard, then removed):

```
Error: [SLUG-LOOP] candidate="bosch" parentSlug="engine-parts-collection" stuck="engine-parts-collection-bosch"
 ❯ ensureUniqueSlug lib/taxonomy/category-tree.ts:1373
 ❯ buildNode          lib/taxonomy/category-tree.ts:1385
 ❯ buildNode (recursion) lib/taxonomy/category-tree.ts:1388
```

**Trigger data defect:** `CAR_PART_BRANDS` listed `"Bosch"` twice and `TOOL_BRANDS` listed `"Makita"` twice, producing two same-slug siblings under one parent. The first collision registered `engine-parts-collection-bosch`; the second re-computed the identical constant string and spun forever.

---

## Fix summary

| # | Fix | File | Result |
|---|-----|------|--------|
| 1 | `ensureUniqueSlug` now consumes `suffix` (numeric fallback) so any duplicate terminates | `lib/taxonomy/category-tree.ts` | Tree builds: **11,600 nodes in ~80 ms** |
| 2 | Removed duplicate `Bosch`/`Makita` brand entries | `lib/taxonomy/category-tree.ts` | No bogus duplicate branches |
| 3 | `getSynonymMatches` now uses a token-keyed inverted index instead of an O(index×tokens) substring scan | `lib/taxonomy/category-synonyms.ts` | `getSynonymMatches("in")`: **12,891 → 5 matches**, 22 ms → **0.02 ms** |
| 4 | Document-frequency stop-token cap (skip tokens matching > 800 categories) | `category-normalizer.ts`, `category-keywords.ts`, `category-synonyms.ts` | Warm `searchCategories`: **117 ms → 2.6 ms/call** |
| 5 | Keyword collector normalizes each phrase once (was twice) | `lib/taxonomy/category-keywords.ts` | Keyword index build: **2,410 → 1,528 ms** |
| 6 | `warmCategoryIndexes()` built once at Sell mount during idle — off the keystroke path | `category-search.ts`, `SellProvider.tsx` | One-time build never runs synchronously while typing |
| 7 | Console title rule keyed on post-expansion `"playstation"` token | `lib/sell/title-category-rules.ts` | PlayStation titles resolve via fast rule path (no AI search) |

---

## Executive summary

The Sell page freeze is **not a browser-specific layout bug**. It is caused by **synchronous main-thread work** triggered from the sell form pipeline, primarily:

| Priority | Root cause | File:line | Evidence |
|----------|-----------|-----------|----------|
| **P0** | `buildTaxonomyTree()` / `getFlatTaxonomy()` infinite loop or hang | `lib/taxonomy/category-tree.ts:1365-1375` | Vitest: no completion in 400s+; static analysis: `ensureUniqueSlug` infinite loop |
| **P0** | `getSynonymMatches()` full-index scan per search token | `lib/taxonomy/category-synonyms.ts:106-112` | Code review; fires inside `searchCategories` per token |
| **P1** | Category detection runs `detectCategoryFromTitle()` on blur with **live description text** | `SellProvider.tsx:164-175` | Profiler event `categoryDetect/run`; triggers AI path for non-rule titles |
| **P2** | Unmemoized `SellContext` — every `setDraft` re-renders 6 consumers | `SellProvider.tsx:629-656` | React Profiler: PhotoUploader + ListingForm commit together |
| **P3** | Price/quantity fields call `updateDraft` on every keystroke | `ListingForm.tsx:299-301, 347-349` | Profiler: draft revision increments during unrelated field focus |
| **Fixed** | Autosave called `flushPendingText()` → `setDraft` mid-typing | ~~`persist-sell-draft.ts:16`~~ | Removed in `2715c64` — contributing factor, not sole cause |

---

## Reproduction (all platforms)

1. Open `/sell?sellProfile=1`
2. Add at least one photo (optional but increases autosave cost)
3. Enter title ≥5 chars, tab to Description
4. Type 50–200 characters rapidly in Description
5. **Within 1–3 seconds of title blur**, category detection debounce fires
6. Main thread blocks → typing stops → Chrome shows "Page Unresponsive"

---

## Evidence

### 1. Benchmark: `getFlatTaxonomy()` blocks indefinitely

Commands run locally:

```bash
npx vitest run tests/sell-taxonomy-build.test.ts --testTimeout=120000
npx vitest run tests/sell-taxonomy-search.test.ts --testTimeout=60000
npx vitest run tests/sell-title-rules-only.test.ts --testTimeout=30000
node scripts/analyze-taxonomy-slugs.mjs
```

| Test | Result | Interpretation |
|------|--------|----------------|
| `sell-title-rules-only` (Apple Magic Mouse, rules path) | **PASS in 1.25s** | Title-rule listings skip taxonomy search |
| `sell-taxonomy-build` (`getFlatTaxonomy` only) | **No completion in 400s+** | `buildTaxonomyTree()` blocks main thread indefinitely |
| `sell-taxonomy-search` (`searchCategories`) | **No completion in 400s+** | First AI category search never returns |
| `analyze-taxonomy-slugs.mjs` | **Throws INFINITE LOOP** | `ensureUniqueSlug` defect confirmed |

Static analysis output:

```
COMPOSITE parent=caravans child=motorhomes: INFINITE LOOP: candidate=motorhomes
  parentSlug=caravans stuck on caravans-motorhomes
```

This matches the slug collision bug in `ensureUniqueSlug` when `${parentSlug}-${candidate}` is already registered and the loop cannot advance `suffix`:

```1365:1375:lib/taxonomy/category-tree.ts
  function ensureUniqueSlug(candidate: string, parentSlug: string | null): string {
    let slug = candidate;
    let suffix = 1;

    while (registry.has(slug)) {
      slug = parentSlug ? `${parentSlug}-${candidate}` : `${candidate}-${suffix}`;
      suffix += 1;
    }

    registry.add(slug);
    return slug;
  }
```

When `parentSlug` is set, `suffix` is incremented but **never used** — if `parentSlug-candidate` is already in the registry, the loop never terminates.

### 2. Secondary: `getSynonymMatches()` catastrophic scan (after tree builds)

```102:115:lib/taxonomy/category-synonyms.ts
export function getSynonymMatches(term: string): SynonymEntry[] {
  const normalized = normalizeSynonymPhrase(term);
  const results = new Map<string, SynonymEntry>();

  for (const [key, entries] of getSynonymIndex().entries()) {
    if (key.includes(normalized) || normalized.includes(key)) {
      for (const entry of entries) {
        results.set(`${entry.categoryId}:${entry.phrase}:${entry.source}`, entry);
      }
    }
  }

  return Array.from(results.values());
}
```

**Complexity:** `O(S × T)` where `S` = synonym index keys and `T` = query tokens. Tokens like `in`, `a`, `for` match most keys via `key.includes(normalized)`.

**Note:** This path is unreachable today while `getFlatTaxonomy()` hangs, but would add multi-second scans once the tree build is fixed without also fixing synonym lookup.

### 3. Trigger path during Description typing

Category detection is scheduled on **text blur**, not on each keystroke:

```207:218:features/sell/context/SellProvider.tsx
const syncDescriptionToDraft = useCallback(
  (description: string) => {
    // ...
    scheduleCategoryDetection();
  },
  [scheduleCategoryDetection],
);
```

But when the user tabs from **Title → Description**:

1. `syncTitleToDraft` runs on title blur → `scheduleCategoryDetection()`
2. After `categoryDebounceMs` (1000ms), `runCategoryDetection` executes
3. It reads `pendingDescriptionRef.current` — **the live in-progress description** the user is already typing
4. `detectCategoryFromTitle(title, description)` runs with the full pending description
5. Main thread blocks → page unresponsive **while user is still in Description**

This explains why the bug appears tied to Description typing on every platform.

### 4. React render cascade (secondary)

`SellProvider` returns a **new context object every render**:

```629:656:features/sell/context/SellProvider.tsx
return {
  view,
  draft,
  // ... 20+ fields
};
```

Six components subscribe via `useSell()`:

- `SellPageInner`, `PhotoValidationError`, `PhotoUploader`, `ListingForm`, `OptionalCard`, `StickyPublishButton`

Any `setDraft` from price, quantity, photos, category auto-select, or blur sync re-renders **the entire sell tree** including `PhotoUploader` (8-slot gallery).

### 5. What is NOT the root cause

| Ruled out | Reason |
|-----------|--------|
| `scrollIntoView` | Removed earlier; issue persists cross-platform |
| Controlled vs uncontrolled textarea | Same pipeline; issue is CPU-bound not reconciliation |
| `bumpPendingTextVersion` alone | `readCanPublish`/`isListingValid` completes in <1ms per call in isolation |
| Browser-specific CSS | Reproduced on Windows Chrome desktop |

---

## Profiler instrumentation (added)

Enable on device:

```js
localStorage.setItem('rovexo:sell-profile', '1')
// reload /sell
```

Or: `/sell?sellProfile=1`

### Chrome DevTools steps

1. **Performance** panel → Record
2. Type in Description for 10 seconds
3. Stop recording
4. Look for **long yellow tasks** >50ms on Main thread
5. Bottom-up → search `getSynonymMatches`, `searchCategories`, `detectCategoryFromTitle`

### React Profiler

`SellProfilerRoot` wraps the sell page with `<Profiler id="SellPage">`.

In console:

```js
__ROVEXO_SELL_PROFILER__.dump()
```

### Event types logged

| Event | Source |
|-------|--------|
| `render` | React Profiler + ListingForm |
| `setDraft` | SellProvider draft revision |
| `syncText` | title/description blur sync |
| `categoryDetect` | schedule / run / setDraft |
| `autosave` | 1.5s debounce timer |
| `persist` | localStorage + IndexedDB |
| `bumpPending` | publish button invalidation |
| `longTask` | any profiled sync work >16ms |

---

## Expected profiler timeline (buggy session)

```
description.onChange     × N     (local state only — fast)
categoryDetect/schedule          (title blur)
categoryDetect/run               (after 1000ms debounce)
longTask detectCategoryFromTitle (500ms–30s+)
setDraft revision++              (category auto-select)
render PhotoUploader             (full tree)
render ListingForm               (full tree)
Page Unresponsive                (Chrome)
```

---

## Measured results (Node/Vitest microbenchmarks)

| Metric | Before | After |
|--------|--------|-------|
| `getFlatTaxonomy()` (build 11,600 nodes) | **never returns** (∞ loop) | **~80 ms**, then cached |
| `searchCategories()` warm (per keystroke) | **117 ms** | **2.6 ms** |
| `getSynonymMatches("in")` | 12,891 matches / 22 ms | 5 matches / **0.02 ms** |
| Keyword index build (one-time) | 2,410 ms | 1,528 ms |
| STEP 7 release detection titles | file hung (excluded from CI) | **22/22 pass** |

The **per-keystroke path does no taxonomy work at all** — `onChange` only updates local React state; category detection is debounced 1000 ms, runs in `requestIdleCallback`, and now completes in single-digit ms because the indexes are pre-warmed once at mount.

---

## Device verification (run on each target)

These microbenchmarks prove the CPU cost is gone; confirm the end-to-end UX on hardware with the built-in profiler:

1. Open `/sell?sellProfile=1`
2. DevTools → **Performance** → Record → type 200+ chars fast → Stop
3. Confirm: no long (yellow) main-thread task > 50 ms; frame rate stays ~60 FPS
4. Console: `__ROVEXO_SELL_PROFILER__.dump()` → no `longTask` entries; `categoryDetect/run` only after you pause typing
5. Windows Chrome/Edge: no "Page Unresponsive" dialog
6. iPhone Safari / iPhone Chrome / Android Chrome: keyboard stays open, textarea never blanks, scrolling stays smooth

Because the fix is platform-agnostic JavaScript (an algorithmic loop-termination + index bug, not browser-specific CSS/DOM), behavior is identical across all four targets.

---

## Known follow-up (not a freeze issue)

The fuzzy **AI fallback** (used only when no title rule matches) can over-confidently classify very generic titles (e.g. "Metal frame with glass panel" → vehicles). This is a pre-existing detection-quality matter in the taxonomy scoring, unrelated to the freeze, and should be addressed separately (e.g. confidence dampening for low-specificity token sets). It does not affect responsiveness.

---

## Files (investigation tooling kept)

| File | Purpose |
|------|---------|
| `lib/sell/sell-profiler.ts` | Runtime event ring buffer + `__ROVEXO_SELL_PROFILER__.dump()` |
| `features/sell/components/SellProfilerRoot.tsx` | React `<Profiler>` wrapper |
| `tests/sell-taxonomy-build.test.ts` | Regression: tree build completes fast |
| `tests/sell-taxonomy-search.test.ts` | Regression: warm search < 16 ms, synonym lookup sane |
| `scripts/bench-sell-taxonomy.ts` | Standalone taxonomy benchmark |

---

## Verification checklist

- [x] `getFlatTaxonomy()` returns (no infinite loop)
- [x] Warm `searchCategories` < 16 ms/call
- [x] `getSynonymMatches` returns bounded results
- [x] STEP 7 release detection titles pass (22/22)
- [x] `npm run typecheck` clean
- [ ] On-device: no `longTask` > 50 ms while typing (per target)
- [ ] On-device: no "Page Unresponsive" (Windows Chrome/Edge)
- [ ] On-device: keyboard stays open + smooth scroll (iOS Safari/Chrome, Android Chrome)
