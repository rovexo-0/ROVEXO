# Homepage Final UI Lock — v6.0

**Status:** Localhost only — NO commit, NO push, NO deploy  
**URL:** http://127.0.0.1:3033/  
**Version marker:** `data-homepage-version="v6.0"`

## Summary of changes

### Header (final)
- Removed Settings / location-target icon completely
- Messages + Notifications use **Lucide React** (`MessageCircle`, `Bell`) — 20px, stroke 1.75px, outline
- Default icon color `#64748B`, hover/active ROVEXO purple
- Spacing: Messages→Notifications **20px**, Notifications→Avatar **24px**
- Avatar unchanged (`HeaderProfileLink`)

### Category rail
- `Vehicles` and `Property` excluded from `ROVEXO_HOMEPAGE_CATEGORIES` (data filter, not CSS hide)

### Section titles
- All section titles removed from featured carousel and marketplace feed
- **SHOP** remains the only visible homepage title (seller showcase)

### Bring your item
- Height **72px**, radius **24px**, padding **24px**
- CTA button **52px** height, vertically centered

### Listing card (160×300)
- Border `1px #E5E7EB`, shadow `0 2px 8px rgba(0,0,0,.04)`
- Image **160px** height, `object-fit: cover`, top corners rounded
- Price **24px/700**, line-height **28px**, letter-spacing **-0.3px**, purple
- Title **18px/600**, line-height **24px**, 2-line clamp
- Footer: rating left (`#FFC107`, `—` when unavailable), views right (`#94A3B8`)
- Favorite **44px** at top/right **12px**
- Featured badge **28px** height, **16px** padding, radius **999px**
- Seller, buyer protection, photo count, condition badges hidden on homepage

## Files modified

| File | Change |
|------|--------|
| `components/header/RovexoHeaderV2.tsx` | Lucide icons; removed settings link |
| `components/header/HeaderV2IconLink.tsx` | `className` prop for spacing |
| `styles/rovexo/header-v2.css` | Icon sizing, colors, spacing |
| `styles/homepage-v4.css` | v6 card, BYI, footer, badge locks |
| `components/ui/ListingCard.tsx` | Rating `—` when unrated |
| `components/ui/ListingCard.module.css` | Views color `#94a3b8` |
| `components/homepage-v4/HomepageV4.tsx` | `v6.0` version marker |
| `tests/*` | Updated assertions |
| `scripts/listing-card-visual-verify.mjs` | v6 dimensions |
| `scripts/homepage-v6-visual-cert.mjs` | **New** multi-viewport screenshots |

## Validation

| Check | Result |
|-------|--------|
| `npm run build` | PASS |
| Unit tests (homepage suite) | 25/25 PASS |
| Listing card visual audit | 20/20 PASS |
| Hydration E2E (homepage) | PASS |
| ESLint (header files) | PASS |

## Screenshots

| Viewport | File |
|----------|------|
| Desktop | `reports/module-1/homepage-v6/homepage-desktop.png` |
| Tablet | `reports/module-1/homepage-v6/homepage-tablet.png` |
| Android | `reports/module-1/homepage-v6/homepage-android.png` |
| iPhone | `reports/module-1/homepage-v6/homepage-iphone.png` |
| Card closeup | `reports/module-1/homepage-v6/listing-card-closeup.png` |

## Checklist

- [x] Header: Messages, Notifications, Avatar only
- [x] Location/settings icon removed
- [x] Vehicles + Property removed from category data
- [x] No section titles except SHOP
- [x] Smaller price (24px)
- [x] Footer aligned (rating left, views right)
- [x] Skeleton only during initial load
- [x] Zero hydration errors
- [x] No commit / push / deploy
