# Store Sharing — Master Engineering Specification

**STATUS: REVIEW**  
**SSOT:** `lib/store-sharing/store-share-v1.ts`

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
- OG: existing `/api/seo/og` (`kind=store`)
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
