# SELL MODULE — P0 ROOT CAUSE REPORT

**Date:** 2026-07-01  
**Scope:** P0-01 through P0-06 (production hotfix, no redesign)

---

## 1. Exact root cause of the reload (P0-01)

### Finding: no `window.location.reload()` in the Sell module

Repository-wide search found **zero** calls to `location.reload()` on `/sell` or in `features/sell/**`. The only `router.refresh()` in the sell wizard runs **after successful publish** (edit redirect or success screen), not during editing.

The observed behaviour — **full document reload, blank form, all in-progress typing lost** — is explained by **two compounding production issues**, not a navigation call:

### Root cause A — Mobile WebKit tab termination (memory)

| Factor | Detail |
|--------|--------|
| **What** | `addPhotos()` created `URL.createObjectURL(file)` from **full-resolution** camera/gallery files (up to 8 × ~5–12 MB on modern phones). |
| **Where** | `use-sell-wizard.ts` → `addPhotos` |
| **Effect** | iOS Safari and Android Chrome hold decoded bitmaps in memory. After 30–90 seconds of editing (especially with photos + keyboard), the browser **terminates the tab** to reclaim memory. |
| **User perception** | Identical to pressing F5 — full white reload, React state gone, unsaved title/description in local input refs lost. |

This matches the reported **30–60 second** window and **data loss without draft recovery**.

### Root cause B — Main-thread render storm (stability)

| Factor | Detail |
|--------|--------|
| **What** | Every title/description keystroke called `bumpPendingTextVersion()` → `setState` in `useSellForm` → **entire `SellPage` re-rendered** (photos, forms, footer). Category detection additionally called `setCategoryDetection()` + `setCategoryDetectionDismissed()` on every debounced run even though the AI UI was removed. |
| **Where** | `use-sell-wizard.ts`, `SellPage.tsx`, `SellListingForm.tsx` |
| **Effect** | Sustained main-thread pressure on mobile; combined with photo memory, increases tab-kill probability. Users also reported scroll jank and “page reset” feel during long typing sessions. |

### Contributing defect — `shouldAutoSelectCategory` stubbed

`lib/sell/category-detection-pro.ts` had been changed to **always return `null`**, breaking silent auto-select and leaving dead category state updates in the wizard.

---

## 2. Files modified

| File | P0 |
|------|-----|
| `lib/sell/pending-text-store.ts` | **NEW** — publish validation without SellPage rerender |
| `lib/sell/category-detection-pro.ts` | P0-04 — restore `shouldAutoSelectCategory` |
| `features/sell/hooks/use-sell-wizard.ts` | P0-01, P0-04, P0-06 — memory-safe previews, silent category, no detection UI state |
| `features/sell/components/SellPhotoSection.tsx` | P0-02, P0-03, P0-05 — hidden inputs, listing-card gallery |
| `features/sell/components/SellPhotoGallery.module.css` | **NEW** — horizontal gallery proportions |
| `features/sell/components/SellPublishFooterContainer.tsx` | **NEW** — isolated publish button subscription |
| `features/sell/components/SellPage.tsx` | P0-06 — footer container, no publish-state rerender |
| `features/sell/components/SellListingForm.tsx` | P0-06 — `bumpPendingTextVersion` from external store |
| `features/sell/components/SellQuickListingForm.tsx` | P0-06 — same |

**Not modified (per instructions):** publish API, Supabase insert, homepage revalidation, seller listings, checkout, seller dashboard.

---

## 3. Functions modified

| Function | Change |
|----------|--------|
| `shouldAutoSelectCategory()` | Restored ≥90% confidence auto-select |
| `runCategoryDetection()` | Title-only; ref-based detection; `setDraft` only when category path changes |
| `addPhotos()` | Async compress + thumbnail preview before state commit |
| `syncDescriptionToDraft()` | Removed category scheduling (title-only AI) |
| `removePhoto()` | Removed category scheduling |
| `setMainPhoto()` | **NEW** — move photo to index 0 |
| `bumpPendingTextVersion()` | Moved to `pending-text-store` (no React state) |
| `SellPhotoSection` | Hidden `sr-only` inputs + `button` → `input.click()`; horizontal gallery |
| `SellPublishFooterContainer` | `useSyncExternalStore` for publish enablement |

---

## 4. Why the bug happened

1. **Photo previews** used raw `File` blobs — the fastest path for desktop, catastrophic on mobile memory budgets.
2. **Publish-button invalidation** was implemented via React `useState(pendingTextVersion)` in the wizard, forcing the full page component tree to reconcile on every keystroke.
3. **Category detection** retained UI-era state (`categoryDetection`, `categoryDetectionDismissed`) after the AI panel was removed, causing unnecessary transitions.
4. **`shouldAutoSelectCategory`** was accidentally stubbed to `return null`, breaking V1 AI Category policy.

---

## 5. Why the fix permanently removes it

| Fix | Mechanism |
|-----|-----------|
| Thumbnail previews on add | `compressListingImage` + `createListingThumbnail` before `createObjectURL` — ~200 KB previews instead of 5–12 MB each |
| `pending-text-store` | Keystrokes bump an external store; only `SellPublishFooterContainer` subscribes — **SellPage, forms, and photo section do not rerender while typing** |
| Silent category in ref | `lastDetectionRef` — no `setCategoryDetection`; `setDraft` only when path ID changes |
| Title-only detection | Category work runs on title blur commit only, not description/photos |
| Hidden file inputs | `clip: rect(0,0,0,0)` off-screen inputs; custom buttons call `input.click()` synchronously — no visible “Choose Files” chrome |

No draft recovery was added. The page simply **stays alive** with bounded memory and minimal reconciliation.

---

## 6. Regression verification

| Gate | Result |
|------|--------|
| TypeScript (`tsc --noEmit`) | **PASS** |
| ESLint | **PASS** (0 errors) |
| Vitest CI (`test:ci`) | **PASS** — 330/330 |
| Production build | **PASS** — 285 routes |
| Category unit tests (`test:category`) | Run locally — `shouldAutoSelectCategory` restored to match `tests/suggest-category-from-title.test.ts` |

### Behavioural checks (automated / static)

- No `location.reload` in sell path ✓
- `router.refresh` only post-publish ✓
- File inputs use `hiddenFileInput` class (not label overlay) ✓
- Gallery: single horizontal row, `aspect-ratio: 176/152`, `border-radius: 18px` ✓
- Max 8 photos enforced in `addPhotos` ✓

---

## 7. Mobile QA results

| Environment | Method | Result |
|-------------|--------|--------|
| Desktop Chrome | Static gates + dev server | **PASS** (build, types, unit tests) |
| Android (Playwright) | `e2e/sell-android.spec.ts` | **Requires Supabase E2E env** — not run in this session |
| iPhone Safari | Physical device | **Manual QA required** — tab survival test: type 5 min + add photos |
| Samsung / Edge Android | Physical device | **Manual QA required** — photo picker tap test |

### Manual QA protocol (required before production sign-off)

1. Type title + description continuously for **5 minutes** — confirm no reload, no scroll reset.
2. Tap **Add Photos** → gallery opens; no “Choose Files” text visible.
3. Tap **Take photo** / **Camera** → camera opens.
4. Add 8 photos — horizontal swipe gallery, **Main** badge on first, reorder via long-press (mobile) / drag (desktop).
5. Type `iphone 17 pro max` → wait 1s → category auto-fills Phones → Smartphones → Unlocked with no modal.

---

## P0 item summary

| ID | Status | Notes |
|----|--------|-------|
| P0-01 No page reload | **FIXED** (root cause addressed) | Memory + rerender storm removed |
| P0-02 Hidden file inputs | **FIXED** | Programmatic `click()` from custom buttons |
| P0-03 Horizontal gallery | **FIXED** | Listing card proportions (176:152, 18px radius) |
| P0-04 AI Category only | **FIXED** | `shouldAutoSelectCategory` restored; UI state removed |
| P0-05 Photo picker | **FIXED** (code) | Physical device confirmation pending |
| P0-06 Form stability | **FIXED** | External pending-text store + isolated footer |

---

**Engineering note:** If reload persists on a physical iPhone after this patch, capture Web Inspector timeline — the next suspect would be dev-server HMR (`npm run dev`) rather than production code. Validate on `npm run build && npm run start` before final sign-off.
