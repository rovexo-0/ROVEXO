# ROVEXO v1.0 — Homepage Enterprise Migration Audit

**Date:** 2026-06-26  
**Branch:** `main` (local, post-audit fixes uncommitted)  
**Live site checked:** https://www.rovexo.co.uk

---

## Executive Summary

| Area | Local build (`main`) | Live production |
|------|-------------------|-----------------|
| Enterprise homepage stack | **PASS** | **FAIL** — stale deployment |
| Bring Your Item banner | **PASS** | **NOT PRESENT** |
| Popular Near You (legacy) | **REMOVED** | **STILL RENDERED** |
| Popular Auctions section | **PASS** | **FAIL** — shows legacy “Auctions / coming soon” copy |

The repository on `main` already routes `/` through the approved Enterprise v1.0 homepage. Production is serving a build from before commit `e1a94f9` (enterprise design system). **Redeploy `main` to align production** — no further homepage component swaps are required beyond the alias fix in this audit.

---

## Homepage Component Actually Rendered (local production build)

```
app/page.tsx (RSC)
└─ BetaAppShell (bottomNavTab="home")
   ├─ MobileHeaderScrollProvider
   ├─ BottomNavigation (data-bottom-nav="2026")
   └─ HomePageShell
      ├─ Header (data-header-version="premium-2026")
      └─ HomeContent
         ├─ HomeHeroBanner (hero-banner-2026)
         ├─ HomeCategoryRail (home-category-premium-rail)
         ├─ StoreMigrationHeroBanner (bring-your-item-banner-2026 → /sell/new)
         ├─ ProductCarouselSection — Featured Listings
         ├─ ProductCarouselSection — Recommended For You
         ├─ AuctionsSection — Popular Auctions
         └─ ProductCarouselSection — Latest Listings
```

**Root layout:** `app/layout.tsx` loads `tokens.css`, `premium-2026.css`, `mobile-premium.css`, `locked-2026.css`, `ThemeProvider` (`data-theme`, system default).

**No `HomeSections` component exists.** Hub navigation (`lib/mobile-ui/hubs.ts`) is used on account/sell/help pages, not on `/`.

---

## Legacy Components Removed from Active Homepage Path

| Legacy component | Status on `/` |
|------------------|---------------|
| `HomePromoBanner` | Not imported — orphaned file remains |
| `HomeHero` (gradient hero) | Not imported — orphaned |
| `HomeHeroSearch` alias | **Replaced** with direct `HomeHeroBanner` import |
| `CategoryGridSection` | Not imported — orphaned |
| `PopularListingsGrid` | Not imported — orphaned |
| `HomeRecentlyViewedCarousel` | Not imported — removed from `HomeContent` in `e1a94f9` |
| `QuickFiltersRail` | Not imported — orphaned |
| `HomeTrendingSearchesSection` | Not imported — orphaned |
| `ProductSection` (grid) | Not imported — orphaned |
| **Popular Near You** carousel | Removed in `e1a94f9` |

---

## Component Status vs Approved v1.0 Design

| Component | Status | Evidence |
|-----------|--------|----------|
| **Premium Header** | **PASS** | `Header` with `data-header-version="premium-2026"`, scroll-hide 220ms |
| **Premium Bottom Navigation** | **PASS** | `BottomNavigation` via `BetaAppShell`, 3D icons, scroll-hide |
| **Category Rail** | **PASS** | `HomeCategoryRail` + `HOME_CATEGORY_RAIL` constants |
| **Bring Your Item banner** | **PASS** | `StoreMigrationHeroBanner` → `SELL_WIZARD_PATH` (`/sell/new`) |
| **Featured** | **PASS** | `ProductCarouselSection` + `fetchProducts("recommended")` |
| **Recommended** | **PASS** | `ProductCarouselSection` + `fetchProducts("trending")` |
| **Auctions** | **PASS** | `AuctionsSection` — “Popular Auctions” |
| **Latest** | **PASS** | `ProductCarouselSection` + `fetchProducts("new")` |
| **Scroll Hide Provider** | **PASS** | `MobileHeaderScrollProvider` in `BetaAppShell` |
| **Theme** | **PASS** | `ThemeProvider` — `data-theme`, system/light/dark |
| **Sell Hub / Navigation Hub** | **N/A on /** | Bottom nav Sell tab; hubs on `/account`, `/sell`, etc. |

---

## Live Production Differences (verified 2026-06-26)

Fetched https://www.rovexo.co.uk HTML:

| Marker | Live | Local `main` build |
|--------|------|-------------------|
| `data-header-version="premium-2026"` | Present | Present |
| `hero-banner-2026` | **Absent** | Present |
| `store-migration-banner-heading` / Bring Your Item | **Absent** | Present |
| `Popular Near You` section | **Present** | **Absent** (correct) |
| `Popular Auctions` heading | **Absent** | Present |
| Legacy “Live bidding is coming soon” | **Present** | **Absent** |

**Conclusion:** Production cache/deployment is behind `e1a94f9`. Codebase is correct; **deploy required**.

---

## Feature Flags / Conditionals Audited

| Flag | Homepage impact |
|------|-----------------|
| `isStoreMigrationEnabled()` | Always `true`; banner not gated in `HomeContent` |
| Super-admin `feature_visibility` | Not wired to homepage |
| `showLegacyPanel` (analytics) | Super-admin only |
| No `useLegacy` / `showLegacyHome` flags found | — |

---

## Files Changed (this audit)

| File | Change |
|------|--------|
| `components/home/HomeContent.tsx` | `HomeHeroSearch` → `HomeHeroBanner` |
| `components/home/HomeHeroSearch.tsx` | Marked `@deprecated` alias |
| `tests/home-hydration.test.ts` | Assert enterprise hero + category rail |
| `tests/home-enterprise-migration.test.ts` | **New** — migration contract + section order |

---

## Quality Gates

| Gate | Status |
|------|--------|
| `npm run lint` | **PASS** |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |
| `npm run test:ci` | **PASS** — 239/239 (43 files) |

---

## Remaining Warnings

- `npm warn Unknown env config "devdir"` — non-blocking
- Orphaned legacy files in `components/home/` still exist on disk but are **not rendered** on `/` (safe to delete in a future cleanup PR)
- Production deploy lag — **critical for user-visible fix**

---

## Manual QA Still Required

- Visual parity check after redeploy (hero, banner, carousels, scroll-hide on iOS/Android)
- Bring Your Item CTA → `/sell/new` with authenticated session
- Dark mode token contrast on homepage sections

---

*End of Homepage Enterprise Migration Audit — ROVEXO v1.0*
