# Module 1 Part 1 — Visual QA Report

**Scope:** Homepage Header + Search + Category Rail rebuild (v2.0)  
**Date:** 2026-07-06  
**Server:** `http://127.0.0.1:3027` (production build, `ROVEXO_HOMEPAGE_DEMO=1`)

## Screenshots

| Set | Path |
|-----|------|
| Before (legacy) | `reports/module-1/homepage-header-rebuild/screenshots/before/` |
| After (rebuild) | `reports/module-1/homepage-header-rebuild/screenshots/after/` |

### After captures

- `header-mobile`, `header-tablet`, `header-desktop`
- `*-search`, `*-search-focus`, `*-categories` per breakpoint
- `android-header`, `iphone-header`
- `header-light`, `header-dark`

## Spec compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| Single canonical homepage header | **Pass** | `HomepageHeader.tsx` only on `/` |
| Logo: ROVEXO wordmark + accent X | **Pass** | `RovexoHomepageWordmark` SVG |
| Search centred in header row | **Pass** | Flex row: logo \| search \| actions |
| Placeholder "Search products..." | **Pass** | `HomepageSearchField` |
| Debounced search + suggestions | **Pass** | 300ms debounce; local + API suggestions |
| Clear button | **Pass** | Visible when query non-empty |
| Return key search | **Pass** | Form submit → `/search?q=` |
| No camera icon | **Pass** | Not present |
| Messages / Notifications / Account | **Pass** | Right cluster, 44px targets |
| Solid surface (no blur/glass) | **Pass** | `homepage-header.css` |
| Scroll shadow only when scrolled | **Pass** | `.homepage-header--scrolled` |
| Safe area respected | **Pass** | `env(safe-area-inset-top)` |
| Header heights 64–76px band | **Pass** | 64px mobile → 76px xl row min-heights |
| Category rail: text chips only | **Pass** | No icons/circles |
| Category momentum scroll, no snap | **Pass** | `scroll-snap-type: none` |
| Category rail below search in chrome | **Pass** | Inside `HomepageHeader` |
| BYI below categories in page body | **Pass** | `RovexoHomePage` order preserved |
| Sticky header | **Pass** | `position: sticky` |
| Dark theme | **Pass** | Token-based surfaces |

## Remaining visual gaps (honest)

| Gap | Severity | Detail |
|-----|----------|--------|
| Wordmark uses system font stack in SVG | Low | Approved brand font lock not embedded in SVG `<text>` |
| Category selected state on `/` | Low | No active category on homepage (by design); accent style ships but unused on `/` |
| Search suggestions panel z-index vs sticky chrome | Low | May overlap feed on very small viewports — verify on device |
| Legacy `HeaderSearchBar` still exists | Info | Used on non-homepage routes only; not duplicated on `/` |

## Build & test

- `npm run build` — **PASS**
- Homepage header test suite (51 tests across 10 files) — **PASS**

## Approval

**Status:** Awaiting user visual approval. No commit, push, or deploy performed.
