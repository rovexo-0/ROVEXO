# ROVEXO V1.0 — PRE-AUDIT P0 Final Report

**Stage:** PRE-AUDIT P0 (Zero Tolerance Validation)  
**Date:** 26 June 2026  
**Certification:** **NOT Production Ready** — P0 E2E core suite passes on Chromium; authenticated flows, full accessibility, localization, and Lighthouse remain open.

---

## Executive Summary

This pass focused on **validate → repair → retest** for the public-route P0 Playwright suite, static analysis, production build, and a **critical homepage horizontal-overflow bug** caused by mis-positioned screen-reader-only listing-card buttons inside infinite carousels.

| Gate | Result |
|------|--------|
| TypeScript (`tsc --noEmit`) | **PASS** |
| ESLint | **PASS** (0 errors, 7 warnings) |
| Vitest CI | **PASS** (321/321, 58 files) |
| Production build | **PASS** (285 routes) |
| Playwright P0 core (Chromium) | **PASS** (73/73) |
| Playwright accessibility (Chromium) | **FAIL** (6/12 — color contrast, aria-hidden-focus, touch targets) |
| Lighthouse ≥95 | **NOT RUN** |
| Full Playwright (all browsers/specs) | **PARTIAL** — Firefox/WebKit not installed locally |

---

## Files Changed (This Session)

| File | Reason | Change |
|------|--------|--------|
| `e2e/marketplace.spec.ts` | QA | Category selectors → `home-v1-categories-heading`, `/search?category=` hrefs |
| `e2e/responsive.spec.ts` | QA | Stable homepage landmark; header selector; behavioral horizontal-scroll check |
| `e2e/master-qa.spec.ts` | QA | Listing alias uses validated slug + `listingPageStatus` |
| `e2e/helpers/listing-slug.ts` | QA | Resolve only slugs that return HTTP 200; seed retry loop |
| `components/home/RovexoListingCard.module.css` | BUG | `position: relative` on card; anchor `srOnly` button — fixes 6600px document scrollWidth |
| `styles/rovexo-homepage.css` | PERFORMANCE/QA | Overflow containment on homepage carousels and shell |
| `styles/rovexo/white-v1-global.css` | QA | `overflow-x: hidden` on `html`, `body`, `.rx-page` |

---

## Issues Fixed

1. **Stale E2E selectors** — Homepage categories use `home-v1-categories-heading` and search-category URLs, not `/category/vehicles`.
2. **Stale responsive hero assertion** — Replaced removed “move your entire store” copy with `Categories` heading from `waitForHomepageUi`.
3. **Listing alias false positives** — Slug resolver now validates `/listing/:slug` returns 200 before use; seeds with retry when catalog empty.
4. **Homepage horizontal overflow (P0 blocker)** — `RovexoListingCard` `srOnly` buttons used `position: absolute` without a positioned parent, placing them at the end of infinite carousel tracks (~6604px `scrollWidth`). Fixed with `position: relative` on `.card` and anchored `srOnly` positioning.
5. **Responsive header timeout** — Tests now target `data-header-version="home-v1"` (actual homepage header).
6. **Carousel/page overflow hardening** — `overflow-x` containment on homepage rails, main, and global shell.

---

## Validation Evidence

### Static analysis (26 Jun 2026)

```
npx tsc --noEmit          → exit 0
npm run lint              → 0 errors, 7 warnings
npm run test:ci           → 321 passed (58 files)
npm run build             → 285 routes, exit 0
```

### Playwright P0 core — Chromium

```
npx playwright test \
  e2e/navigation-audit.spec.ts \
  e2e/master-qa.spec.ts \
  e2e/marketplace.spec.ts \
  e2e/responsive.spec.ts \
  --project=chromium

→ 73 passed (38.7s)
```

**Coverage includes:** public routes, protected-route auth redirects, bottom nav, header chrome, import CTA, footer legal links, `/item/:slug` → `/listing/:slug`, marketplace health, 5 responsive viewports, console-error smoke.

### Playwright accessibility — Chromium

```
npx playwright test e2e/accessibility.spec.ts --project=chromium

→ 6 failed (color-contrast serious on Home/Search/Categories/Login/Register;
   aria-hidden-focus on Home; touch-target size on header actions)
```

### Horizontal overflow diagnostic (post-fix)

```
scrollWidth: 375, clientWidth: 375, canScroll: false  @ 375px viewport
```

---

## Module PASS / FAIL Matrix

| Module | Public routes | Auth flows | E2E | Notes |
|--------|---------------|------------|-----|-------|
| Homepage / Browse | **PASS** | N/A | **PASS** | Overflow bug fixed |
| Search | **PASS** | N/A | **PASS** | Axe contrast FAIL |
| Categories | **PASS** | N/A | **PASS** | Axe contrast FAIL |
| Listing / Product | **PASS** | N/A | **PASS** | Alias redirect validated |
| Cart / Checkout | Redirect auth | **NOT TESTED** | **PARTIAL** | Protected-route shell only |
| Orders / Resolution | Redirect auth | **NOT TESTED** | **PARTIAL** | |
| Messages / Notifications | Redirect auth | **NOT TESTED** | **PARTIAL** | |
| Account Center | **PASS** (hub) | **NOT TESTED** | **PARTIAL** | Tile SSOT frozen |
| Buyer hub | Redirect auth | **NOT TESTED** | **PARTIAL** | |
| Seller hub | Redirect auth | **NOT TESTED** | **PARTIAL** | |
| Sell / Publish | Redirect auth | **NOT TESTED** | **PARTIAL** | `sell-android` not in P0 batch |
| BYI / Import | Redirect auth | **NOT TESTED** | **PARTIAL** | Canonical `/import` |
| Business | **PASS** | **NOT TESTED** | **PARTIAL** | |
| Auth (login/register) | **PASS** | N/A | **PARTIAL** | Axe contrast FAIL |
| Trust / Help / Legal | **PASS** | N/A | **PASS** | |
| Admin / Super-admin | Redirect auth | **NOT TESTED** | **PARTIAL** | Out of consumer P0 scope |

---

## PRE-AUDIT Backlog Status (P0 Items)

| ID | Task | Status |
|----|------|--------|
| PA-01 | Full navigation audit (authenticated) | **OPEN** |
| PA-02 | Global button audit | **OPEN** |
| PA-04 | BYI end-to-end (auth + publish) | **OPEN** |
| PA-05 | en-GB string sweep + `t()` | **OPEN** |
| PA-08 | Playwright `master-qa.spec.ts` | **CLOSED** (Chromium 100%) |
| PA-13 | Responsive matrix | **PARTIAL** — P0 viewports PASS; 320px matrix + touch targets open |
| PA-14 | Console error cleanup | **PARTIAL** — homepage smoke PASS; full journey not verified |

---

## Remaining Blockers (Production Freeze)

1. **Accessibility** — WCAG AA color contrast on core pages; `aria-hidden-focus` on homepage carousel; header touch targets &lt; 44px.
2. **Authenticated E2E** — Checkout, sell publish, BYI import, buyer/seller dashboards (`buyer-dashboard.spec.ts`, `sell-android.spec.ts`, etc.).
3. **Localization** — en-GB hardcoded string sweep; ro-RO native completion (PA-05, PA-06).
4. **Lighthouse** — Not run; target ≥95 on Performance, Accessibility, Best Practices, SEO.
5. **Full browser matrix** — Firefox/WebKit projects skip when browsers not installed (`scripts/playwright-projects.mjs`).
6. **Back button / button audit** — PA-01, PA-02, PA-03 not executed at scale.
7. **Playwright build staleness** — `ensureProductionBuild()` skips rebuild when `.next/BUILD_ID` exists; CSS/component fixes require manual `npm run build` before E2E.

---

## Recommendations (Next P0 Sprint)

1. Fix axe **color-contrast** on consumer text tokens (likely muted greys on white).
2. Fix homepage **aria-hidden-focus** on carousel duplicate sets.
3. Enlarge header icon hit areas to ≥44×44px without visual redesign.
4. Run authenticated Playwright flows with seeded Supabase roles.
5. Add CI step: `npm run build && npx playwright test … --project=chromium` on every merge.
6. Run Lighthouse on `/`, `/sell`, `/account` and file PERF tickets.

---

## Certification Statement

**ROVEXO V1.0 is NOT certified Production Ready.**

The **P0 public-route Chromium suite passes** and a **ship-blocking homepage overflow defect is repaired**. Frozen architecture, white theme, account-center SSOT, and canonical BYI/sell routes remain intact. Production Freeze requires closure of authenticated flows, accessibility blockers, localization P0, and Lighthouse targets per `FEATURE_FREEZE_REPORT.md`.

---

*Report generated as part of PRE-AUDIT P0 — validate, repair, verify, certify. No architecture or UI redesign performed.*
