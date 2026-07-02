# Sell Module — Final Engineering Report

**ROVEXO V1.0 · Sell Module · Production Freeze**  
**Date:** 2026-06-26  
**Engineer:** Principal Release Engineering pass

---

## Executive summary

The Sell module has been brought to the canonical ROVEXO V1.0 production freeze state. All visible section headings were removed while preserving placeholders, ARIA, validation, and business logic. The photo area now uses a fixed 8-slot horizontal gallery matching homepage listing card geometry. Form field order matches the master spec. Marketplace footer is fully excluded from the sell flow. AI category detection runs silently in the background using title and description with debounce, without overwriting manual category selection.

No database schema, API contracts, authentication, or publish pipeline logic was changed.

---

## Specification compliance

### Layout order — PASS

| # | Section | Component |
|---|---------|-----------|
| 1 | Photos | `SellPhotoSection` |
| 2 | Title | `ListingTitleField` |
| 3 | Description | `ListingDescriptionField` |
| 4 | Category | Category picker button + `CategoryTreePicker` |
| 5 | Condition | `sell-condition-chip` buttons |
| 6 | Price | `SellPriceInput` |
| 7 | Quantity | `SellQuantitySelector` |
| 8 | Delivery | `SellDeliverySection` |
| 9 | Optional details | `SellMoreDetailsCard` |
| 10 | Publish | `SellPublishFooterContainer` |

### Removed headings — PASS

No visible `<h2>` / label headings for Photos, Quick Listing, Title, Description, Category, Condition, Price, Available Quantity, Delivery, or More Details. Screen-reader labels (`aria-label`, `aria-labelledby` on sections) retained.

### Footer removal — PASS

- `HelpPageFooter` removed from `SellPage`
- `/sell` added to `AUTHENTICATED_APP_PREFIXES` so `ConditionalSiteFooter` does not render on sell routes

### Native file input — PASS

File inputs use `hiddenFileInput` (clip-based visually hidden, not `display:none` on required UI). Gallery and camera open only via programmatic `input.click()` on buttons.

### Photo gallery — PASS

- Always renders exactly **8 slots** numbered 1–8
- Horizontal scroll, snap-aligned
- Thumbnail: **176×152px**, **18px** radius, `object-fit: cover`
- Actions: preview, remove, set as main, drag (desktop), long-press reorder (mobile)
- Max 8 photos enforced in wizard

### AI category — PASS

- Input: `pendingTitleRef` + `pendingDescriptionRef`
- `detectCategoryFromTitle(title, description)` in `runCategoryDetection`
- Debounced via `createDebouncedCategoryDetection` (1000ms)
- `userOverrodeCategoryRef` blocks auto-overwrite after manual pick
- No blocking UI component

### Form stability — PASS

- Title/description use local component state; parent draft sync on blur / publish flush
- `bumpPendingTextVersion` + `useSyncExternalStore` decouple publish footer from full-page rerender
- Category detection schedules on pending text change without remounting form

### SSR / hydration — PASS

- `useState(() => createEmptyDraft())` — no `loadSellDraft()` during render
- `loadSellDraft()` in `useEffect` after mount
- `crypto.randomUUID()` for upload session only after mount
- Script-free `ThemeProvider` (no `next-themes` inline script)
- Playwright hydration suite: 9/9 across Chromium, Firefox, WebKit

---

## Changes in this freeze pass

### 1. `SellPhotoSection.tsx`

**Before:** Empty state showed only upload buttons; gallery appeared after first photo.  
**After:** Always renders 8-slot horizontal gallery. Empty slots are numbered add targets. Upload row (Add Photos / Take Photo) shown only when zero photos exist.

### 2. `SellPhotoGallery.module.css`

Added explicit `height: 152px`, slot numbering styles, disabled state for slots when full.

### 3. `SellListingFields.tsx`

**Before:** Advanced mode placed brand/colour/size before condition; accept offers before delivery; optional details only in quick mode.  
**After:** Canonical order for both modes. Optional details (`SellMoreDetailsCard`) always after delivery.

### 4. Footer / routing

`SellPage.tsx` — removed `HelpPageFooter`.  
`authenticated-routes.ts` — `/sell` prefix.

### 5. Accessibility polish

`SellPriceInput` — `aria-label="Price"`.  
`SellMoreDetailsCard` — expand button `aria-label="Optional details"`.

---

## Validation results

```
npm run typecheck     → PASS
npm run lint          → PASS (0 errors, 7 pre-existing warnings outside sell)
npm run test:ci       → PASS (62 files, 336 tests)
npm run build         → PASS (285 routes)
playwright chromium   → PASS (3/3 sell-hydration)
playwright firefox    → PASS (3/3 sell-hydration)
playwright webkit     → PASS (3/3 sell-hydration)
```

---

## Production readiness

| Area | Status |
|------|--------|
| Type safety | Ready |
| Lint | Ready |
| Build | Ready |
| Unit tests | Ready |
| Hydration E2E | Ready |
| Mobile device smoke | Manual recommended |
| Publish pipeline | Unchanged — prior freeze verified |

---

## Remaining limitations

1. **Real-device certification** — Camera, gallery, keyboard, and background/resume behavior on physical iPhone/Android should be smoke-tested before major marketing launch. Automated tests do not cover authenticated sell form interaction end-to-end in this pass.
2. **`sell-android.spec.ts`** — Not executed; requires authenticated session fixture.
3. **ESLint warnings** — 7 pre-existing warnings in unrelated files (home, e2e helpers).

---

## Related documentation

- `SELL_MODULE_FREEZE_SNAPSHOT.md` — locked surfaces and file list
- `FREEZE_CERTIFICATE.md` — formal pass/fail certificate
- `SELL_SSR_HYDRATION_REPORT.md` — prior hydration root-cause analysis
- `SELL_P0_ROOT_CAUSE_REPORT.md` — mobile stability root causes
