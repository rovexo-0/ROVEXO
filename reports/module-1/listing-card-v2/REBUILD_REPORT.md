# Listing Card v2.0 — Full Rebuild Report

**Marker:** `data-rovexo-lc="v2"`  
**Base URL:** `http://localhost:3033`  
**Status:** PASS

## Structure

```
Card (r2Root)
├── Product Image (r2Pix)
│   ├── Featured Ribbon (r2Feat)
│   └── Favourite Button (r2Mark) — outside link tap target
├── Content (r2Block)
│   ├── Price (r2Cost)
│   ├── Stack (r2Stack, gap 8px)
│   │   ├── Title (r2Head)
│   │   └── Subtitle (r2Sub, optional)
└── Footer (r2Base)
    ├── Rating (r2Rank)
    └── Views (r2Glance)
```

## Computed CSS (desktop)

| Check | Result |
|-------|--------|
| Card 160×300 | PASS |
| Favourite no shadow | PASS |
| Favourite 40×40 | PASS |
| Price 18px / mb 4px | PASS |
| Title height 44px | PASS |
| Content stack gap 8px | PASS |
| Footer 24px space-between | PASS |

## Screenshots

- `card-desktop.png` / `card-mobile.png`
- `homepage-desktop.png` / `homepage-mobile.png`

## Reference overlay

Compare against: `reports/module-1/listing-card-v1/listing-card-v1-closeup.png`

## Removed permanently

Seller, buyer protection, location row, condition badge, photo counter, meta rows, dividers, footer labels, legacy wrappers, inherited homepage class hooks.

## Files changed (only)

- `components/ui/ListingCard.tsx`
- `components/ui/ListingCard.module.css`
