# Homepage V3.0 — Files Modified

## New canonical stack (`components/homepage-v3/`)

| File | Purpose |
|------|---------|
| `HomepageV3.tsx` | Main orchestrator — all sections in spec order |
| `HomepageV3Header.tsx` | Sticky header (logo + messages/notifications/account) |
| `HomepageV3Search.tsx` | Search section below header |
| `HomepageV3CategoryRail.tsx` | Text category chips |
| `HomepageV3BringYourItem.tsx` | Import listings CTA |
| `HomepageV3Showcase.tsx` | Featured sellers + horizontal listing rails |
| `HomepageV3ListingRail.tsx` | Reusable rail (Featured / Recommended / Newest / Boosted) |
| `HomepageV3Feed.tsx` | Infinite marketplace grid |
| `HomepageV3Skeleton.tsx` | Card-matched loading skeletons |
| `HomepageV3Wordmark.tsx` | ROVEXO wordmark SVG |
| `constants.ts` | `HP3_LISTING_CARD_PROPS`, `HP3_VIEW_ALL` |
| `index.ts` | Public exports |

## New data + styles

| File | Purpose |
|------|---------|
| `lib/homepage/v3-data.ts` | `resolveHomepageV3Sections()` — merges API + demo fallback |
| `styles/homepage-v3.css` | Complete V3 visual layer (`hp3-*` design system) |
| `scripts/homepage-v3-screenshots.mjs` | Before/after screenshot capture |

## Route wiring

| File | Change |
|------|--------|
| `app/page.tsx` | Imports `homepage-v3.css`; renders `HomepageV3Header` + `HomepageV3`; fetches all section data via `resolveHomepageV3Sections` |

## Deprecated (no longer on `/` route)

| File | Change |
|------|--------|
| `components/home/RovexoHomePage.tsx` | Re-exports `HomepageV3` for import stability only |
| `components/home/HomepageHeader.tsx` | Retained for reference; not used on `/` |
| `styles/rovexo-homepage.css` | Not imported on `/` |

## Engineering registry

| File | Change |
|------|--------|
| `lib/homepage-engineering-director/registry.ts` | `PREMIUM_HOME_STACK` → V3; source paths updated |
| `lib/homepage-engineering-director/scanner.ts` | Component scan targets V3 stack |
| `lib/enterprise-marketplace-completion-engine/homepage-completion.ts` | Search pass condition uses `HomepageV3Search` |

## Tests updated (12 files)

- `tests/home-enterprise-migration.test.ts`
- `tests/home-listing-grid-lock.test.ts`
- `tests/single-source-of-truth.test.ts`
- `tests/home-hydration.test.ts`
- `tests/header.test.ts`
- `tests/homepage-feed-ranking.test.ts`
- `tests/homepage-launch-recovery.test.ts`
- `tests/homepage-engineering-director.test.ts`
- `tests/homepage-icon-system.test.ts`
- `tests/enterprise-ui-system.test.ts`
- `tests/buyer-dashboard.test.ts`
- `tests/hero-banner-premium.test.ts`

## Unchanged (backend / business logic)

- Supabase, auth, listings APIs, search, categories, orders, checkout
- Stripe, Shippo, wallet, messages, notifications, analytics, permissions, SEO
- `components/ui/ListingCard.tsx` — single canonical card (buyer protection off by default)
- `app/api/homepage/feed/route.ts` — infinite feed API
- `BetaAppShell` + `BottomNavigation`
