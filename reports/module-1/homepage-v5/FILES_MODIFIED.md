# Homepage V5 — Files Modified

| File | Change |
|------|--------|
| `components/home/HomepageSearchField.tsx` | Hydration-safe via `useSyncExternalStore`; stable `inputId`; 20px search icon |
| `components/ui/ListingCard.tsx` | Footer rating `—`/views `0`; NEW image badge; stats footer outside body stack |
| `components/ui/ListingCard.module.css` | Footer height 24px |
| `components/homepage-v4/HomepageV4.tsx` | `data-homepage-version="v5.0"` |
| `components/homepage-v4/HomepageV4Feed.tsx` | Skeleton only when `loading && items.length === 0`; server seed sync |
| `styles/homepage-v4.css` | Category chip equal width; featured seller compact; footer lock |
| `tests/home-hydration.test.ts` | V5 hydration assertions |
| `tests/home-listing-grid-lock.test.ts` | Footer + NEW badge assertions |
| `tests/enterprise-ui-system.test.ts` | Search icon size |
| `scripts/homepage-v5-screenshots.mjs` | Before/after capture |
