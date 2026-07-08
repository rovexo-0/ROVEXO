# Homepage V4.1 — Visual QA Report

**Date:** 2026-07-06  
**Version:** `data-homepage-version="v4.1"`  
**Preview:** `http://127.0.0.1:3031` (`ROVEXO_HOMEPAGE_DEMO=1`)  
**Screenshots:** `reports/module-1/homepage-v4.1/screenshots/`

## Correction pass summary

| Area | Change | Status |
|------|--------|--------|
| **Header** | 48px bar (52px desktop), 4px vertical padding, 36px action baseline, compact avatar | PASS |
| **Search** | 44px pill height, tighter focus ring | PASS |
| **Category rail** | Equal 32px chips, 14px horizontal padding, 8px gap, smooth scroll | PASS |
| **Bring Your Item** | Premium gradient, `lg` radius, 52px compact height, gradient CTA button | PASS |
| **Featured seller** | Reduced padding/gaps, 40px avatar, tighter seller row, carousel below | PASS |
| **Listing card** | 252×160×92 lock, `object-fit: cover`, price dominant, 2-line title, no protection | PASS |
| **Marketplace** | Demo listings render immediately; skeletons only when no seed data | PASS |
| **Spacing** | Uniform `--rx4-section-gap: var(--ds-space-4)` across sections | PASS |

## Marketplace feed behaviour

- **Before:** Skeleton grid flashed on demo mode before `useEffect` hydrated demo products; append-load skeletons lingered at grid bottom.
- **After:** `resolveSeedItems()` seeds state synchronously when demo or SSR items exist; skeleton shown only when `loading && items.length === 0`.

## Responsive validation

| Viewport | Capture | Notes |
|----------|---------|-------|
| Mobile 390×844 | `v41-mobile-*` | No overflow observed |
| Tablet 768×1024 | `v41-tablet-*` | 3-column feed |
| Desktop 1440×900 | `v41-desktop-*` | 4–5 column feed |
| Android Pixel 7 | `android-v41` | PASS |
| iPhone 14 WebKit | `iphone-v41` | PASS |

## Before / after

- **before/** — V4.0 screenshots (copied from `homepage-v4/screenshots/after`)
- **after/** — V4.1 correction captures

## Build & tests

- `npm run build` — PASS
- Homepage contract tests — PASS (23 tests in core suites)

**Awaiting Product Owner approval. No commit.**
