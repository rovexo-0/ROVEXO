# Module 1 — Architecture Report

**Version:** 1.0 (Architecture Freeze baseline)  
**Date:** 2026-07-06  
**Status:** Module 1 foundation applied — awaiting approval before Module 2

## Single Source of Truth Map

| Domain | Canonical implementation | Deprecated / parallel |
|--------|-------------------------|------------------------|
| Design tokens | `styles/tokens.css` + `app/globals.css` | Legacy `premium*` aliases in `tokens.ts` |
| Buttons | `components/ui/Button.tsx` | `PremiumButton.tsx` |
| Listing cards | `components/ui/ListingCard.tsx` | Domain cards (checkout, orders, messages) remain separate by design |
| Homepage categories | `RovexoCategoryRail` + `RovexoCategoryCard` | `HomeCategoryRail` alias, `archive/homepages/*` |
| Homepage listings | `RovexoAllListings` + `HOMEPAGE_LISTING_CARD_PROPS` | — |
| Icons | `RovexoIcon` + `lib/icons/icons.ts` | `DashboardIcon3D` / `Fluency3DIcon` (mobile hubs — cleanup queued) |
| Theme / appearance | `ThemeProvider` + `lib/settings/theme.ts` | — |
| Search overlay actions | `SearchInputActions` (voice only) | Camera action removed Module 1 |
| Skeleton loaders | `components/ui/Skeleton.tsx` | Page-specific compositions retained |

## Module 1 Architecture Changes

### Homepage category rail
- **Before:** Premium 3D PNG/WebP icons per category (`<picture>` in `RovexoCategoryCard`)
- **After:** Text-only premium capsules (`.home-v1-category-capsule`) — horizontal scroll preserved, infinite carousel hook unchanged
- **Behaviour preserved:** Links, slugs, hrefs, marquee scroll, touch-action `pan-y`

### ListingCard homepage preset
- **Before:** Seller and views hidden on homepage
- **After:** `showSeller`, `showRating`, `showViews` enabled — aligns with Module 1 listing standard (Image, Price, Title, Seller, Rating, Views, Favourite, Boost/Premium badges)

### Search simplification
- **Before:** Voice + camera buttons in search overlay (camera disabled “coming soon”)
- **After:** Voice hook only; camera UI removed entirely

## Restrictions honoured

- No database schema changes
- No auth, payment, wallet, order lifecycle, Shippo, Stripe, or Supabase policy changes
- No API contract changes

## Remaining architectural debt (not Module 1 scope)

1. `DashboardIcon3D` still powers Help/Trust/Plans mobile hub cards
2. `archive/`, `ROVEXO/`, `recovered-homepage/` mirror trees on disk
3. `HeaderCategoryBar.tsx` unused on homepage
4. Multiple skeleton compositions (acceptable until unified loader API is defined)

## Files changed (Module 1)

- `components/home/RovexoCategoryCard.tsx`
- `components/home/constants.ts`
- `styles/rovexo-homepage.css`
- `features/search/components/SearchInputActions.tsx`
- `tests/homepage-icon-system.test.ts`
- `tests/category-premium-library.test.ts`
- `scripts/module1-screenshots.mjs`
- `scripts/module1-audit.mjs`
