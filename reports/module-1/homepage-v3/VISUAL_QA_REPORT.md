# Homepage V3.0 — Visual QA Report

**Date:** 2026-07-06  
**Preview:** `http://127.0.0.1:3029` (production build, `ROVEXO_HOMEPAGE_DEMO=1`)  
**Screenshots:** `reports/module-1/homepage-v3/screenshots/`

## Section order (spec compliance)

| # | Section | Status | Notes |
|---|---------|--------|-------|
| 1 | Sticky Header | PASS | `.hp3-header`, `data-header-version="rovexo-v3"` |
| 2 | Search | PASS | Below header in main column (`HomepageV3Search`) |
| 3 | Category Rail | PASS | `nav[aria-label="Categories"]`, horizontal chips |
| 4 | Bring Your Item | PASS | Import CTA with `BRING_YOUR_ITEM_PATH` |
| 5 | Featured Sellers Showcase | PASS | Seller rows + horizontal listing rails |
| 6 | Featured Listings | PASS | `#hp3-featured` rail |
| 7 | Recommended Listings | PASS | `#hp3-recommended` rail |
| 8 | Newest Listings | PASS | `#hp3-newest` rail |
| 9 | Boosted Listings | PASS | `#hp3-boosted` rail |
| 10 | Marketplace Feed | PASS | Infinite grid, `aria-label="Marketplace listings"` |
| 11 | Bottom Navigation | PASS | Via `BetaAppShell` (unchanged) |

## Design principles

| Principle | Status | Evidence |
|-----------|--------|----------|
| Luxury / minimal / modern | PASS | Clean `hp3-*` tokens, no clutter |
| Marketplace-first | PASS | Listings dominate; no hero banners |
| No duplicated controls | PASS | Single search, single category rail |
| Consistent typography | PASS | Design-system tokens throughout |
| Perfect card dimensions | PASS | 300×190×110 lock in `homepage-v3.css` |
| Buyer protection hidden on cards | PASS | `HP3_LISTING_CARD_PROPS.showBuyerProtection: false` + CSS `display: none` |

## Responsive validation

| Viewport | Screenshots | Status |
|----------|-------------|--------|
| Mobile 390×844 | `v3-mobile-*` | PASS — no clipping observed |
| Tablet 768×1024 | `v3-tablet-*` | PASS — 3-column grid |
| Desktop 1440×900 | `v3-desktop-*` | PASS — 4–5 column grid |
| Android (Pixel 7) | `android-v3` | PASS |
| iPhone 14 (WebKit) | `iphone-v3` | PASS |
| Light theme | `v3-light` | PASS |
| Dark theme | `v3-dark` | PASS |

## Listing card canonical reuse

- Single `ListingCard` component used in showcase rails, section rails, and marketplace feed
- Price-before-title hierarchy maintained
- No separate card implementations in `components/homepage-v3/`

## Before / After

- **Before:** `screenshots/before/` — copied from Part 2 (V1/V2 stack)
- **After:** `screenshots/after/` — 28 captures of V3 stack

## Open items for user review

1. Visual polish of seller showcase rows at desktop width
2. Spacing between multi-section rails (currently `var(--ds-space-4)` gap)
3. Confirm BYI subtitle copy ("Import from eBay, Etsy, Vinted and more")

**Awaiting user visual approval before commit.**
