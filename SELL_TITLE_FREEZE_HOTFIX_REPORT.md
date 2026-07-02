# SELL TITLE FREEZE — P0 HOTFIX REPORT

**Date:** 2026-06-26  
**Status:** COMPLETE (static gates verified; manual 60s typing recommended on device)

---

## Root cause

Every keystroke in the Title field called `updateDraft({ title })`, which:

1. Updated the entire `SellListingDraft` in React state → **full Sell page re-render** (photos, category picker, AI panel, footer, validation).
2. Triggered a `useEffect` with **80ms debounce** on `[draft.title, draft.description, draft.photos]` that ran `detectCategoryFromTitle()` — synchronous rule iteration + optional AI category matching on nearly every keystroke.
3. Ran `getListingValidationErrors(draft)` on **every render** of `SellListingForm`, `SellQuickListingForm`, and `SellPage` (full-form validation while typing).
4. Recomputed `buildDeviceAiSuggestions(draft)` via `useMemo([draft])` on every keystroke.

**Combined effect:** main-thread blocking after 2–3 characters → visible freeze.

---

## Fix (no UI / architecture redesign)

### Local input isolation (800ms idle commit)

- **`ListingTitleField`** — local state while typing; commits to parent draft only after idle.
- **`ListingDescriptionField`** — same pattern for description.
- **`pendingTitleRef` / `pendingDescriptionRef`** — publish & save flush pending text synchronously before API calls.

### Debounced background work (800ms)

- **`createTitleIdleScheduler`** — title/description commit timing.
- **`createDebouncedCategoryDetection`** — AI category detection only after pause (replaces 80ms effect).
- **`DeviceAiSuggestions`** — 800ms debounced draft snapshot before heuristics run.

### Validation gating

- **`showErrors: false`** during typing — `getListingValidationErrors` skips field errors until publish attempt (`showValidation` flag).
- Title field validates itself on blur / publish only.

---

## Files modified

| File | Change |
|------|--------|
| `lib/sell/title-idle-scheduler.ts` | **NEW** — idle commit scheduler |
| `lib/sell/listing-title.ts` | **NEW** — clamp + field validation |
| `lib/sell/category-detection-scheduler.ts` | **NEW** — debounced category detection |
| `lib/sell/resolve-effective-draft.ts` | **NEW** — merge pending text for publish |
| `lib/sell/sell-background-policy.ts` | **NEW** — background work policy |
| `features/sell/components/ListingTitleField.tsx` | **NEW** — isolated title input |
| `features/sell/components/ListingDescriptionField.tsx` | **NEW** — isolated description input |
| `features/sell/hooks/use-sell-wizard.ts` | Removed 80ms category effect; idle sync + debounced detection |
| `features/sell/components/SellListingForm.tsx` | Title/description fields; gated validation |
| `features/sell/components/SellQuickListingForm.tsx` | Same |
| `features/sell/components/SellPage.tsx` | Photo-only validation while typing |
| `features/sell/components/DeviceAiSuggestions.tsx` | Debounced + memoized |
| `features/sell/types.ts` | `showErrors` option on validation |
| `tests/title-idle-scheduler.test.ts` | **NEW** — scheduler unit tests |

---

## Components optimized

- `ListingTitleField` (isolated re-render boundary)
- `ListingDescriptionField` (isolated re-render boundary)
- `DeviceAiSuggestions` (debounced)
- `useSellForm` / `use-sell-wizard` (no sync work on keystroke)
- `SellListingForm`, `SellQuickListingForm`, `SellPage` (no full validation on keystroke)

---

## Before / after (per keystroke while typing title)

| Metric | Before | After |
|--------|--------|-------|
| React tree re-renders | Entire Sell page (~15+ components) | `ListingTitleField` only |
| `detectCategoryFromTitle` calls | ~1 per keystroke (80ms debounce) | 0 until 800ms idle |
| `getListingValidationErrors` | Full form every keystroke | Skipped (`showErrors: false`) |
| `buildDeviceAiSuggestions` | Every keystroke | 0 until 800ms idle after draft commit |
| API / DB / router calls | 0 (but main thread blocked) | 0 |
| Category `setDraft` from AI | Possible every keystroke | Only after idle + debounce |

---

## Verification

| Gate | Result |
|------|--------|
| TypeScript (`tsc --noEmit`) | **PASS** |
| ESLint | **PASS** (0 errors, 8 pre-existing warnings) |
| Vitest (`test:ci`) | **PASS** — 325/325 |
| Production build | **PASS** — 285 routes |
| UI / layout / CSS changes | **NONE** |
| Navigation regressions | **NONE** expected |

### Regression check: **PASS**

---

## Global input rule (repository)

Pattern established in `lib/sell/title-idle-scheduler.ts` + `ListingTitleField`.  
**Sell flow is fixed.** Other modules (Buyer, Messages, Search, etc.) were not batch-refactored in this hotfix — adopt the same idle-commit pattern when those inputs show similar lag.

---

## Manual QA checklist (recommended)

- [ ] Type continuously in Title for 60s — no freeze
- [ ] Hold key 10s — no freeze
- [ ] Paste 5,000 chars — clamped to 80, no freeze
- [ ] Mobile / desktop / IME keyboard
- [ ] Publish still validates full form
- [ ] AI category appears after typing pause (~800ms)

---

## Success criteria

| Criterion | Status |
|-----------|--------|
| Unlimited typing / zero freeze | **FIX APPLIED** — verify manually |
| Zero server/DB/AI while typing | **PASS** (code path) |
| Zero router refresh while typing | **PASS** |
| TypeScript / ESLint / Vitest / Build | **PASS** |
| No UI redesign | **PASS** |

**HOTFIX: COMPLETE** (pending manual 60s typing confirmation on `/sell`).
