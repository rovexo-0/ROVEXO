# Homepage UI Lock v1.0 — Preview Report

**Status:** Preview deployed — awaiting final approval  
**Scope:** UI only — no backend, API, route, or business logic changes  
**Date:** 2026-07-11

## Preview URL

https://rovexo-j6fmrjubj-rovexo.vercel.app

**Inspect:** https://vercel.com/rovexo/rovexo

## Build & Lint

| Check | Status |
|-------|--------|
| `npm run lint` | Pass (0 errors, 0 warnings) |
| `npm run build` | Pass |

## Spec coverage

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Official ROVEXO wordmark (ROVE/O black, X `#7C3AED`) | Done |
| 2 | Header: Logo + Messages + Notifications only | Done |
| 3 | Search below header, ~13% slimmer (40px) | Done |
| 4–7 | Image search camera + gallery + similarity | Done (client-side, existing `/api/homepage/feed`) |
| 8 | Image Search results page with canonical cards | Done |
| 9–10 | Homepage listing card + price/incl/shield | Done (unchanged approved design) |
| 11 | Category pills | Done (unchanged) |
| 12–14 | Bottom nav height + icon/label alignment | Done |
| 15–16 | Responsive + performance | Preserved |

## Key files

- `components/brand/RovexoWordmark.tsx`
- `components/home/ImageSearchCamera.tsx`
- `components/home/HomepageSearchField.tsx`
- `features/search/components/ImageSearchView.tsx`
- `lib/image-search/*`
- `styles/rovexo/image-search.css`
- `styles/rovexo/bottom-nav-premium.css`

## QA checklist

- [ ] Wordmark: ROVE/O black, X purple
- [ ] No header account avatar on homepage
- [ ] Camera opens instantly (fullscreen native preview)
- [ ] Gallery button bottom-right in camera UI
- [ ] Searching… → Image Search results with listing cards
- [ ] Bottom nav labels fully visible above Home Indicator
- [ ] Sell FAB unchanged

## Next step

STOP — await final Homepage approval before Module 02 (My Account).
