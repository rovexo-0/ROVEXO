# Module 1 Part 2 — Regression Report

**Date:** 2026-07-06

## Automated checks

| Suite | Result |
|-------|--------|
| `npm run build` | Pass |
| `tests/home-listing-grid-lock.test.ts` | Pass (9) |
| `tests/module-2-surfaces.test.ts` | Pass (5) |
| `tests/final-platform-spec.test.ts` | Pass |
| `tests/homepage-feed-ranking.test.ts` | Pass |
| `tests/homepage-engineering-director.test.ts` | Pass |

## Behaviour preserved

| Area | Result |
|------|--------|
| `/api/homepage/feed` pagination | Unchanged |
| Showcase data from `fetchShowcaseSellerSections` | Unchanged |
| Promotion impression tracking | Unchanged |
| Watchlist favourite on cards | Unchanged |
| `HOMEPAGE_LISTING_CARD_PROPS` spread | Unchanged |

## Visual / structural changes

| Change | Impact |
|--------|--------|
| ListingCard price before title | All surfaces using default layout |
| `showBuyerProtection` default `false` | Cards no longer show protection unless explicitly enabled |
| Showcase BEM → `rx-showcase-v2` | E2E/cert scripts using old class names need update |
| Grid columns 2/3/4/5 by breakpoint | Desktop shows more columns than before |

## Not run

- Full Playwright e2e suite
- Physical device QA

## Rollback

Revert `ListingCard.module.css`, `RovexoShowcaseSection.tsx`, grid-lock CSS, and `rovexo-homepage.css` token block.
