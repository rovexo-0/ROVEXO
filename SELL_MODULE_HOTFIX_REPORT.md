# Sell Module — Critical Hotfix Report

**Date:** 2026-06-26  
**Type:** Production hotfix (repair only — no redesign, no business logic changes)

---

## Issue #1 — Marketplace footer / bottom navigation on `/sell`

### Root cause
Footer suppression relied only on `isAuthenticatedAppRoute()`. Sell flow routes needed an explicit guard. `BetaAppShell` could still render bottom navigation when `showBottomNav` was true on nested sell paths, and marketplace chrome had no sell-specific shell class for defensive CSS.

### Fix
- Added `lib/navigation/sell-flow-routes.ts` with `isSellFlowRoute()`
- `ConditionalSiteFooter` returns `null` for sell flow routes (explicit check before authenticated routes)
- `BetaAppShell` reads pathname and **forces** `bottomNavVisible = false` on sell flow routes; adds `sell-flow-shell` class
- `styles/rovexo/sell.css` — defensive rule hides `.home-v1-bottom-nav` inside `.sell-flow-shell`

### Files
- `lib/navigation/sell-flow-routes.ts` (new)
- `components/layout/ConditionalSiteFooter.tsx`
- `components/beta/BetaAppShell.tsx`
- `styles/rovexo/sell.css`
- `tests/sell-flow-routes.test.ts` (new)

---

## Issue #2 — Add Photos upload regression

### Root cause
Duplicate upload UI (separate button row + second gallery) caused confusion. Hidden file inputs used `clip: rect(0,0,0,0)` and lived outside the upload card container; some mobile browsers are unreliable with clipped inputs when opened via programmatic `click()`.

### Fix
- Consolidated into **one** upload card with inputs inside `position: relative` container
- `openGalleryPicker` / `openCameraPicker` reset `input.value` before `click()` (required for re-selecting same file)
- Updated hidden input CSS to `clip-path: inset(50%)` + `opacity: 0` (not `display: none`)
- Removed `aria-hidden` from file inputs

### Files
- `features/sell/components/SellPhotoSection.tsx`
- `features/sell/components/SellPhotoGallery.module.css`

---

## Issue #3 — Duplicate gallery

### Root cause
When `draft.photos.length === 0`, a separate upload button row rendered **above** the always-on 8-slot gallery — two visual photo areas.

### Fix
Single `rx-upload` card contains:
1. Header row (Add Photos + Take Photo)
2. Embedded horizontal 8-slot gallery `[1]…[8]`

No second gallery row. No duplicate thumbnails.

### Files
- `features/sell/components/SellPhotoSection.tsx`
- `features/sell/components/SellPhotoGallery.module.css`
- `features/sell/components/SellPage.tsx` (removed unused `quickMode` prop)

---

## Issue #4 — Thumbnail layout

### Root cause
Thumbnails were correct size (176×152) but lived outside the upload card visual hierarchy.

### Fix
Thumbnails remain 176×152, 18px radius, `object-fit: cover`, listing-card shadow — now inside the unified upload card with `-webkit-overflow-scrolling: touch` for smooth horizontal scroll.

### Files
- `features/sell/components/SellPhotoGallery.module.css`

---

## Issue #5 — iOS Safari form reset (~35–40s)

### Root cause
Draft was persisted to `localStorage` only on explicit **Save draft** tap. Backgrounding, Safari tab suspension, or memory-pressure reload cleared in-memory React state with no autosave — user lost all entered text.

Photos were never in localStorage (by design — blob URLs cannot be serialized).

### Fix
- Added `lib/sell/persist-sell-draft.ts` — `persistSellDraftSnapshot()`
- `use-sell-wizard.ts`:
  - Debounced autosave (1.5s) on draft changes
  - `visibilitychange` + `pagehide` → persist before background
  - `pageshow` with `event.persisted` → restore text fields from localStorage (BFCache resume)
- Preserves in-memory photos on BFCache restore when still valid

### Files
- `lib/sell/persist-sell-draft.ts` (new)
- `features/sell/hooks/use-sell-wizard.ts`
- `tests/sell-hydration.test.ts` (lifecycle guard)

### Remaining limitation
If Safari **fully kills** the tab (not BFCache), photo previews are lost because photos are not stored in localStorage (unchanged by design — no upload API / schema changes). Text fields restore from autosaved draft.

---

## Issue #6 — Form stability

### Status
No changes required beyond Issue #5 autosave. Existing architecture preserved:
- Local title/description state in field components
- `useSyncExternalStore` for publish footer
- Category detection via refs (no blocking UI state)

---

## Validation results

| Gate | Result |
|------|--------|
| TypeScript | PASS |
| ESLint | PASS (0 errors) |
| Vitest CI | PASS (338/338) |
| Production build | PASS (285 routes) |
| Playwright Chromium | PASS (3/3) |
| Playwright Firefox | PASS (3/3) |
| Playwright WebKit | PASS (3/3) |

---

## Production readiness

**Ready for production** with manual iPhone device smoke recommended for photo picker + background/resume confirmation.
