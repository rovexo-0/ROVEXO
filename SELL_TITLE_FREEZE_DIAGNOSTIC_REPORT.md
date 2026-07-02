# SELL TITLE FREEZE — DIAGNOSTIC REPORT (P0)

**Date:** 2026-06-26  
**Scope:** `/sell` Create Listing — Title field pipeline

---

## Observed symptoms

| Platform | Behaviour |
|----------|-----------|
| Desktop | ~5 title characters → entire UI frozen, browser unresponsive |
| iPhone | Several seconds typing → page reloads, draft lost |

Mobile reload is consistent with **main-thread blocking long enough for iOS WebKit to kill the tab** (watchdog), not navigation code.

---

## Title keystroke pipeline (before fix)

```
onChange (Title <input>)
  ├─ clampListingTitle()                    ~0.01ms
  ├─ setLocalTitle()                        ~1ms (ListingTitleField only)
  ├─ pendingTitleRef.current = next         ~0ms
  └─ idleScheduler.touch()                  ~0ms
        └─ [after 800ms idle]
              onIdleCommit → syncTitleAfterIdle
                ├─ setDraft({ title })      *** FULL SELL PAGE RE-RENDER ***
                └─ scheduleCategoryDetection()
                      └─ [after 800ms]
                            runCategoryDetection()
                              └─ detectCategoryFromTitle()  *** SYNC MAIN THREAD ***
                                    ├─ matchTitleRules() (~42 rules)
                                    ├─ detectAiCategory() → searchCategories()
                                    │     └─ buildIndexMaps() + keyword scan
                                    └─ matchCategoriesFromLabels()
                                          setCategoryDetection() → re-render
                                          setDraft(categoryPath?) → re-render
```

### Callbacks exceeding budget (measured / inferred)

| Callback | Trigger | Est. time | Budget exceeded |
|----------|---------|-----------|-----------------|
| `syncTitleAfterIdle` → `setDraft` | 800ms idle between keys | 16–50ms+ (full tree) | **16ms, 32ms** |
| `getListingValidationErrors` | Every parent re-render | 1–5ms | 8ms (cumulative) |
| `detectCategoryFromTitle` | After idle + 800ms debounce | **50–500ms+** | **50ms, 100ms** |
| `detectAiCategory` → `searchCategories` | Title ≥3 chars, no rule hit | **100ms–several seconds** (first taxonomy index build) | **100ms+** |
| `useEffect([draft.photos])` → category on mount | Page load | Same as above | **100ms+** |
| `DeviceAiSuggestions` useMemo | Every draft change | 1–3ms | 8ms (cumulative) |

**Primary freeze culprit:** `syncTitleAfterIdle` → `setDraft({ title })` during typing pauses, followed by synchronous `detectCategoryFromTitle` on the main thread.

**Why it felt like “character 5”:** With ~800ms idle debounce, typing slowly (or mobile auto-correct pauses) commits title at 3+ characters, triggers full-page reconcile + category engine before the next keystroke lands.

**Why iPhone reloads:** Repeated main-thread blocks from taxonomy search → WebKit terminates tab → full reload → `localStorage` draft never saved (save is manual only).

---

## Title keystroke pipeline (after fix)

```
onChange (Title <input>)
  ├─ clampListingTitle()           ~0.01ms
  ├─ setLocalTitle()               ~1ms — ONLY ListingTitleField re-renders
  └─ pendingTitleRef.current       ~0ms
  (NO setDraft, NO scheduler, NO category, NO validation, NO API)

onBlur / Publish flush
  └─ syncTitleToDraft
        ├─ setDraft({ title })       once, off keystroke path
        └─ scheduleCategoryDetection (900ms debounce)
              └─ requestIdleCallback → detectCategoryFromTitle
                    └─ startTransition(setState)  non-blocking paint
```

---

## Files changed (this pass)

| File | Change |
|------|--------|
| `ListingTitleField.tsx` | **Removed idle commit on keystroke** — blur/publish only |
| `ListingDescriptionField.tsx` | Same |
| `use-sell-wizard.ts` | Category detection in `requestIdleCallback` + `startTransition`; no mount photo effect |
| `sell-background-policy.ts` | `runSellBackgroundTask()` helper |
| `category-detection-scheduler.ts` | 900ms debounce |
| `SellPhotoSection.tsx` | `memo()` — skip re-render when unrelated draft fields change |
| `SellListingForm.tsx` | `useSellPublishState` reads pending refs |

---

## Per-keystroke guarantees (post-fix)

| Action | While typing | On blur | On publish |
|--------|--------------|---------|------------|
| Local state | ✓ | ✓ | ✓ |
| Character counter | ✓ | ✓ | ✓ |
| `setDraft` | ✗ | ✓ | ✓ |
| Category AI | ✗ | ✓ (debounced) | ✓ |
| Validation | field blur only | ✓ | full |
| API / Supabase | ✗ | ✗ | ✓ |
| Parent re-render | ✗ | ✓ | ✓ |

---

## Verification

| Gate | Status |
|------|--------|
| TypeScript | Run `npx tsc --noEmit` |
| ESLint | Run `npm run lint` |
| Vitest CI | Run `npm run test:ci` |
| Manual 60s typing | **Required on `/sell`** |

---

## Regression check

- No UI / layout / CSS changes
- No navigation changes
- Draft preserved in `pendingTitleRef` during typing; flushed on blur/publish

**Status:** Fix applied — confirm with continuous 60s typing on desktop + iPhone.
