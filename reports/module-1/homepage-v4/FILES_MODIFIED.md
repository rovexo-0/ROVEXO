# Homepage V4 — Files Modified

## New canonical stack (`components/homepage-v4/`)

| File | Purpose |
|------|---------|
| `HomepageV4.tsx` | Orchestrator — 8 Product Owner sections only |
| `HomepageV4Header.tsx` | Sticky topbar (logo + actions) |
| `HomepageV4Search.tsx` | Search |
| `HomepageV4CategoryRail.tsx` | Category text-link rail |
| `HomepageV4BringYourItem.tsx` | Import CTA |
| `HomepageV4Showcase.tsx` | One seller row + one carousel |
| `HomepageV4Featured.tsx` | Featured listings carousel |
| `HomepageV4Feed.tsx` | Infinite marketplace grid |
| `HomepageV4Skeleton.tsx` | Loading skeletons |
| `HomepageV4Wordmark.tsx` | Gradient wordmark |
| `constants.ts` | `HP4_LISTING_CARD_PROPS` |
| `index.ts` | Exports |

## Data + styles

| File | Purpose |
|------|---------|
| `lib/homepage/v4-data.ts` | `resolveHomepageV4Sections()` — dedupes showcase / featured / feed |
| `styles/homepage-v4.css` | Complete V4 visual layer (`rx4-*`) |
| `scripts/homepage-v4-screenshots.mjs` | Before/after captures |

## Route

| File | Change |
|------|--------|
| `app/page.tsx` | `homepage-v4.css`, `HomepageV4`, fetches featured + feed + showcase only |

## Removed from homepage (per spec)

- Recommended, Newest, Boosted, Trending, Popular, Latest rails
- V3 multi-rail layout (`HomepageV3*` no longer on `/`)

## Unchanged

All backend, APIs, auth, checkout, wallet, Stripe, Shippo, SEO, bottom nav.
