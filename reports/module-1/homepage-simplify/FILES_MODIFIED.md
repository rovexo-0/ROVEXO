# Homepage Simplify — Files Modified (Header V2 + Listing Card V2)

## New

| File | Role |
|------|------|
| `components/header/RovexoHeaderV2.tsx` | Canonical 64px header with integrated search |
| `components/header/HeaderV2IconLink.tsx` | 40×40 touch, 24×24 icons, red dot badge |
| `styles/rovexo/header-v2.css` | Header V2 + search field tokens |
| `components/homepage-v4/HomepageFeaturedSeller.tsx` | Featured seller row + carousel (replaces showcase) |
| `scripts/homepage-simplify-screenshots.mjs` | Before/after capture script |

## Updated (this pass)

| File | Change |
|------|--------|
| `app/page.tsx` | `RovexoHeaderV2`, `header-v2.css`; search removed from main column |
| `app/search/page.tsx` | `RovexoHeaderV2` replaces legacy `Header` |
| `features/sell/components/SellPage.tsx` | `RovexoHeaderV2` |
| `features/account-center/components/AccountCenterPage.tsx` | `RovexoHeaderV2` |
| `components/homepage-v4/HomepageV4.tsx` | v4.2 stack; `HomepageFeaturedSeller`; no `HomepageV4Search` |
| `components/homepage-v4/HomepageV4BringYourItem.tsx` | Removed “Import listings” hint; CTA **Start** |
| `components/homepage-v4/constants.ts` | `showSeller: false`, `showStatusBadge: true` |
| `components/homepage-v4/index.ts` | Export `RovexoHeaderV2` |
| `components/ui/ListingCard.tsx` | V2 body: Price → Title → ⭐ \| 👁; badges Featured/Boost/Premium only |
| `components/ui/ListingCard.module.css` | 16px radius, flat favorite 44px, stats row |
| `styles/homepage-v4.css` | 24/16/16 spacing, category rail, BYI 52px, `rx-fs-*`, card V2 lock |
| `lib/homepage-engineering-director/registry.ts` | Header V2 stack |
| `lib/homepage-engineering-director/scanner.ts` | Search-in-header validation |
| `tests/*.test.ts` | Header V2 + card V2 assertions (7 suites, 40 tests) |

## Deprecated on production routes (retained in repo)

- `components/homepage-v4/HomepageV4Header.tsx`
- `components/homepage-v4/HomepageV4Showcase.tsx`
- `components/homepage-v4/HomepageV4Search.tsx` (search lives in header)
