# Module 2 v2.0 — Architecture Report

Generated: 2026-07-06T03:24:23.662Z

## Single Source of Truth

| Domain | Canonical |
|--------|-----------|
| Listing cards | `components/ui/ListingCard.tsx` |
| Business badge | `components/ui/BusinessBadge.tsx` |
| Category rail | `components/home/RovexoCategoryRail.tsx` |
| Showcase | `components/home/RovexoShowcaseSection.tsx` |
| Promotion pricing | `lib/promotions/marketplace-pricing.ts` + `/super-admin/pricing` |
| Brand | `components/brand/RovexoLogo.tsx`, `npm run generate:brand` |
| Themes | `styles/tokens.css` (purple #9333ea) |
| Super Admin nav | `lib/super-admin/nav.ts` (Module 2 menu) |
| Sell photos | `SELL_PHOTO_MAX = 8` (UI + API schema) |

## Duplicates retired from primary navigation

Enterprise Command OS, OMEGA, 31-module registry removed from `SUPER_ADMIN_PRIMARY_NAV`. Legacy routes remain for bookmark compatibility.

## Alias preserved

`HomeCategoryRail` → re-exports `RovexoCategoryRail` for enterprise engine compatibility.
