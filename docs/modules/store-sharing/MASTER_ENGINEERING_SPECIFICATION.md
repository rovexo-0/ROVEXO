# Store Sharing — Master Engineering Specification

**STATUS: FROZEN**  
**SSOT:** `lib/store-sharing/store-share-v1.ts`  
**Store Hero OG freeze:** `lib/store-sharing/store-hero-share-card-freeze-v1.ts`

## What this is

One canonical way to share a seller’s entire public store.

Canonical identity: `/@username`  
Implementation: rewrite → existing `/user/[username]` → `ViewProfilePage`  
Default tab: Listings

## Reused systems

- Public profile: `ViewProfilePage` + `getPublicSellerProfile`
- Follow: `components/follow/FollowButton`
- Listings: `ListingCard` + `getEligibleListings`
- Toast: `useToast`
- Analytics: `lib/analytics/marketplace-events.ts`
- OG: existing `/api/seo/og` (`kind=store`) via `StoreHeroShareCard` (`lib/store-sharing/store-hero-share-card-v1.ts`)
- QR: existing qrserver helper pattern
- Auth: existing `/login?next=` Follow flow

## Forbidden

- Second store page
- Second listing card
- AI-generated copy or images
- Fake ratings / followers / listings
- Sharing an individual listing as the store destination
- Visit Store (`/store/[slug]`) redesign

## Canonical share URL

Always `https://www.rovexo.co.uk/@username` from `PRODUCTION_ORIGIN`.

Never derived from `getAppUrl()`, `window.location.origin`, localhost, LAN IP, or the current development host.

External crawler preview (WhatsApp / Facebook / Twitter) uses the same SSOT:

- `og:title` = `{username}'s Store on ROVEXO`
- `og:description` = `Discover {listingCount} items from {username} on ROVEXO.`
- `og:url` / canonical = `https://www.rovexo.co.uk/@username`
- `og:image` = `https://www.rovexo.co.uk/api/seo/og?kind=store&username=...` (PNG 1200×630, public, not SVG)
- Facebook mobile: Web Share API (`navigator.share`) with the canonical Store URL when available
- Facebook desktop: `facebook.com/sharer/sharer.php?u=` + encoded canonical Store URL
- `robots.txt` allows only `/api/seo/og` (does not open `/api/`)

## What changed

Share Store CTA on the existing profile action row, plus the Store Share sheet/card/QR and `/@username` rewrite.

Production share URL lock: every share/copy/QR/OG/canonical/analytics store URL uses the production origin SSOT. Placeholder letter icons replaced with official brand/UI icons.

Dynamic Store Share Card: live public avatar, username, verification, followers, active listings, and store bio (or canonical fallback) rendered as a PNG OG image from the existing `/api/seo/og` engine. Facebook mobile uses native share; desktop keeps sharer.php. Store Share modal visual design unchanged.

Store Hero Share Card v1.0 (SHARE / OG ONLY): `kind=store` now renders one canonical 1200×630 Store Hero preview (`StoreHeroShareCard`). Native Shop, Visit Store, Homepage, Listing Detail, and in-app `StoreShareCard` are unchanged. Title remains `{username}'s Store on ROVEXO`. Canonical public URL remains `https://www.rovexo.co.uk/@username`.

Known URL discrepancy (FROZEN — not unified): Native Android Shop Share currently emits `https://www.rovexo.co.uk/store/<handle>`. Web Store Share / OG / QR / clipboard remain `/@username`. Unifying those destinations requires an explicit Owner architecture decision.

Hard freeze: Store Hero is SHARE / OG ONLY. Seller Shop remains the native Shop. In-app `StoreShareCard` and Web `StoreVisitPageV2` stay independent. Unlock phrases: `END STORE HERO FREEZE` and `END SELLER SHOP FREEZE`.
