# Homepage V4 — Visual QA Report

**Date:** 2026-07-06  
**Preview:** `http://127.0.0.1:3030` (`ROVEXO_HOMEPAGE_DEMO=1`)  
**Screenshots:** `reports/module-1/homepage-v4/screenshots/`

## Product Owner section compliance

| # | Section | Status |
|---|---------|--------|
| 01 | Header | PASS — `rx4-topbar`, `data-header-version="rovexo-v4"` |
| 02 | Search | PASS — pill search below header |
| 03 | Category Rail | PASS — text links with dot separators |
| 04 | Bring Your Item | PASS — accent strip CTA |
| 05 | Featured Sellers | PASS — **one** seller row + **one** carousel |
| 06 | Featured Listings | PASS — single horizontal carousel |
| 07 | Marketplace Feed | PASS — infinite grid, deduped IDs |
| 08 | Bottom Navigation | PASS — `BetaAppShell` (unchanged) |

## Explicitly absent (per spec)

| Section | Status |
|---------|--------|
| Recommended | REMOVED |
| Newest | REMOVED |
| Boosted | REMOVED |
| Trending / Popular / Latest | REMOVED |

## Visual differentiation from V3

| Trait | V3 | V4 |
|-------|----|----|
| CSS prefix | `hp3-*` | `rx4-*` |
| Wordmark | Split ROV**X**O SVG | Gradient full wordmark |
| Categories | Rounded chips | Text links + dots |
| Header | 64px + shadow on scroll | 56px glass blur topbar |
| Cards | 300×190×110, shadow | 264×168×96, flat border |
| Section titles | Bold 17px | Uppercase 11px labels |
| Showcase | Multi-seller stack | Single seller band |

## Listing card

- One `ListingCard` component everywhere
- `showBuyerProtection: false` on homepage
- CSS hides protection elements in `.rx4`

## Responsive

Mobile, tablet, desktop, Android, iPhone captures in `screenshots/after/`.

**Awaiting Product Owner visual approval. No commit.**
