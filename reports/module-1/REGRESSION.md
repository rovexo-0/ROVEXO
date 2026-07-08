# Module 1 — Regression Report

**Date:** 2026-07-06

## Automated validation

| Suite | Result |
|-------|--------|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass (0 errors, 4 warnings — pre-existing + scripts) |
| `pnpm build` | Pass |
| Vitest: homepage-icon-system, category-premium-library, home-listing-grid-lock, ux-architecture | 19 / 19 pass |
| Playwright: marketplace, navigation-audit, home-ui-shot (Chromium) | 22 / 22 pass |

## Functional regression check

| Area | Status | Notes |
|------|--------|-------|
| Homepage loads | Pass | Categories + listings render |
| Category links | Pass | Capsules link to search/category routes |
| Search | Pass | Results page loads |
| Dark mode toggle | Pass | `data-theme="dark"` applies on homepage |
| Bottom navigation | Pass | All 5 tabs navigate correctly |
| Auth routes | Pass | Login/register load |

## Known pre-existing issues (not introduced by Module 1)

- Business dashboard server error for business users
- Checkout shipping quotes unavailable in local env
- Help/Trust mobile hub icon debt
- Physical Android My Account certification pending
- Homepage blank card shells at infinite-scroll tail (demo data)

## New issues introduced by Module 1

**None detected** in automated suite or screenshot review.

## Full Playwright matrix

Full 2148-test matrix not re-run in Module 1. Prior session: Chromium + Android 717/717 pass; Firefox/WebKit homepage flakes remain.

## Recommendation

Module 1 changes are **regression-safe** for homepage, search overlay, and listing card preset. Proceed to user review; run full Playwright before deploy.
