# Module 1 Part 2 — Files Modified

## Rebuilt (visual)

| File | Change |
|------|--------|
| `components/ui/ListingCard.tsx` | Price-first hierarchy; `showBuyerProtection` default `false` |
| `components/ui/ListingCard.module.css` | Full v2 premium card styles (tokens, no blur/glass) |
| `components/home/RovexoShowcaseSection.tsx` | Rebuilt showcase seller row + rail (`rx-showcase-v2`) |
| `components/home/RovexoShowcaseRails.tsx` | `rx-showcase-v2-stack` container |
| `components/home/RovexoAllListingsGrid.tsx` | Responsive column count via CSS variable |
| `components/home/RovexoAllListings.tsx` | Wires `useMarketplaceFeedColumns()` to grid |
| `components/home/HomeListingCardSkeleton.tsx` | Price-first skeleton matching card proportions |
| `styles/rovexo/home-listing-grid-lock.css` | v2 grid lock, responsive columns, protection hidden |
| `styles/rovexo-homepage.css` | 300×190×110 tokens, showcase v2 CSS, skeleton v2 |
| `tests/home-listing-grid-lock.test.ts` | v2 enforcement (protection off, showcase, columns) |

## New

| File | Purpose |
|------|---------|
| `scripts/homepage-part2-screenshots.mjs` | Before/after screenshot capture |
| `reports/module-1/homepage-part2/` | QA artifacts |

## Unchanged (backend / data)

- Supabase, APIs, feed ranking, showcase seller builder
- `HOMEPAGE_LISTING_CARD_PROPS` (already had protection off)
- Checkout buyer protection (separate surface)
