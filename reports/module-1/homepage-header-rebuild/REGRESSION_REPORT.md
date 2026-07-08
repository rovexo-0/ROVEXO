# Module 1 Part 1 — Regression Report

**Date:** 2026-07-06

## Automated verification

| Check | Result |
|-------|--------|
| `npm run build` | Pass |
| `tests/header.test.ts` | Pass (6) |
| `tests/home-enterprise-migration.test.ts` | Pass |
| `tests/home-hydration.test.ts` | Pass |
| `tests/homepage-icon-system.test.ts` | Pass |
| `tests/enterprise-ui-system.test.ts` | Pass |
| `tests/homepage-engineering-director.test.ts` | Pass (9) |
| `tests/hero-banner-premium.test.ts` | Pass |
| `tests/buyer-dashboard.test.ts` | Pass |
| `tests/category-premium-library.test.ts` | Pass |
| `tests/mobile-header-scroll.test.ts` | Pass |

## Behavioural regressions checked

| Area | Risk | Result |
|------|------|--------|
| Non-homepage `Header` | Medium | Still renders on `/search`, account, etc.; homepage variant removed |
| Mobile header hide-on-scroll | Medium | `HomepageHeader` registers with scroll context — unchanged behaviour |
| Bottom navigation search tab | Low | Still opens `SearchOverlay` (separate from header field) |
| Category rail duplication | High | **None** — single rail in `HomepageHeader` only |
| Search overlay duplication on homepage | Low | Homepage uses inline field; overlay not opened on focus |
| E2E selector `data-header-version="rovexo-v1"` | Low | Preserved on `HomepageHeader` for stable-ui helpers |
| Engineering director certification | Medium | Scanner updated; 100% pass restored |

## Not run (manual QA recommended)

- Full Playwright e2e suite across Chrome, Safari, Firefox, Edge
- Landscape orientation on phone/tablet
- Physical device safe-area notch validation

## Backend / logic

No changes to Supabase, auth, checkout, orders, Stripe, Shippo, or messaging backends.

## Rollback

Revert `app/page.tsx` to `Header variant="homepage"` and restore category rail in `RovexoHomePage.tsx` if approval withheld.
