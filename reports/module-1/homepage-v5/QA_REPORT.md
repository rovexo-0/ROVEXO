# QA Report — Homepage V5 Critical Fix Pass

**Date:** 2026-07-06  
**Preview:** http://127.0.0.1:3033  
**Version:** `data-homepage-version="v5.0"`

---

## Critical tasks (10/10)

| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1 | Remove hydration error (`HomepageSearchField`) | **PASS** | `useSyncExternalStore` mount gate; suggestions/spinner/clear deferred until hydrated; stable `inputId`; no `Date.now`/`Math.random`/`window` in render |
| 2 | Header V2 canonical (64px, 16px pad, search 48px, action order) | **PASS** | `RovexoHeaderV2` + `header-v2.css` |
| 3 | Listing card footer: ⭐ Rating \| 👁 Views; no seller/Buyer Protection | **PASS** | `formatCardRating` → `—` when empty; views → `0`; `statsRow` 24px |
| 4 | NEW badge on image top-left (not footer) | **PASS** | `sections.includes("new")` → `status_new` badge |
| 5 | Marketplace: skeleton only while fetch pending | **PASS** | `showInitialSkeleton = loading && items.length === 0`; server seed renders cards immediately |
| 6 | Featured seller: compact row + 16px carousel gap | **PASS** | `rx-fs` gap 8px; `--rx4-card-gap: 16px` |
| 7 | Card 160×160, radius 16px, price/title/footer/favorite 44px | **PASS** | `homepage-v4.css` lock + `ListingCard.module.css` |
| 8 | Search hydration-safe, 48px/24px radius, placeholder | **PASS** | `HomepageSearchField` + `header-v2.css` |
| 9 | Category rail: 32px chips, equal min-width, smooth scroll | **PASS** | `.rx4-cats__chip` min-width 72px |
| 10 | Performance: lazy images, memo cards, no CLS | **PASS** | `memo(ListingCard)`, `loading="lazy"`, aspect-ratio lock |

---

## Validation

| Check | Result |
|-------|--------|
| `npm run build` | PASS |
| Homepage unit tests | PASS |
| `e2e/sell-hydration.spec.ts` (homepage) | PASS |
| Chrome / Safari / Android / iPhone / Tablet / Desktop screenshots | PASS |

---

## Not performed

- commit
- push
- deploy
