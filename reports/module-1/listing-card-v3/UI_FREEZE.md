# Homepage Listing Card v3.0 — UI FREEZE

**Component:** `components/ui/ListingCard.tsx` + `components/ui/ListingCard.module.css`

| Status | Value |
|--------|-------|
| UI LOCK | **ACTIVE** |
| FROZEN | **YES** |
| SINGLE SOURCE OF TRUTH | **YES** |
| Version | **3.0** |
| Frozen | **2026-07-06** |

## Reference screenshots (localhost)

These PNG files are the pixel baseline. Do not claim freeze compliance without them:

| File | Role |
|------|------|
| `card-desktop.png` | Desktop close-up (1440×900 viewport) |
| `card-mobile.png` | Mobile close-up (390×844 viewport) |

Regenerate: `node scripts/listing-card-v3-screenshots.mjs`

## Frozen dimensions

| Element | Value |
|---------|-------|
| Card | 160×260px |
| Image | 160×160px |
| Content | 100px |
| Border radius | 16px |
| Border | 1px solid #E8E8E8 |
| Shadow | 0 2px 8px rgba(0,0,0,.04) |
| Favourite | 28×28px @ top 8px / right 8px |
| Heart icon | 16px |
| Price | 18px / 700 |
| Title | 16px / 600, single line |
| Stats row | 20px, icons 14px, text 13px / 600 |

## Content order

Image → Price → Title → Rating + Views (end of card)

## Permitted

Bug fixes only: image loading, click, favourite, rating, views, accessibility, performance, responsive bugs that preserve frozen pixels.

## Prohibited

Redesign, resize, new badges/ribbons, seller/location/buyer-protection rows, typography or spacing changes.

## Enforcement

- DOM: `data-rx-card-version="3.0"` `data-rx-ui-status="FROZEN"`
- Cursor rule: `.cursor/rules/listing-card-v3-freeze.mdc`
- Tests: `tests/listing-card-v3-ui-freeze.test.ts`

## Pixel tolerance

**0px** on layout, spacing, typography, and icon position. Functional fixes only.
