# Homepage V7.0 — Final UI Lock Report

**Status:** Localhost only · NO COMMIT · NO PUSH · NO DEPLOY  
**Base URL:** `http://localhost:3033`  
**Version marker:** `data-homepage-version="v7.0"`

---

## Specification compliance

| Area | Spec | Status |
|------|------|--------|
| Header height | 64px desktop / 56px mobile | PASS |
| Header padding | 32px desktop / 20px mobile | PASS |
| Header actions | MessageSquare, Bell, Avatar only | PASS |
| Location icon | Removed entirely | PASS |
| Category chips | 40px, 20px padding, 999px radius, 16px/600 | PASS |
| Vehicles / Property | Removed from data source | PASS |
| Section titles | Removed — SHOP only when showcase exists | PASS |
| BYI container | 72px height, 24px radius/padding | PASS |
| BYI button | 52px, 999px radius, 18px/700 | PASS |
| Listing card | 160×300, #FFF, #E5E7EB border, shadow | PASS |
| Product image | 160×160 cover, top radius 16px | PASS |
| **Price** | **20px / 700 / lh 24 / ls -0.2px / purple** | PASS |
| Title | 16px / 600 / lh 22 / 2-line ellipsis | PASS |
| Footer | 24px, flex space-between, rating left, views right | PASS |
| Favorite | 44px white circle, shadow, top/right 12px | PASS |
| Featured badge | 28px, 13px/700 | PASS |
| Skeleton | Only while loading | PASS |
| Row gap | 20px | PASS |

---

## Computed CSS (listing card closeup)

```
fontSize: 20px
lineHeight: 24px
marginTop: 10px
```

---

## Validation

| Check | Result |
|-------|--------|
| `npm run build` | PASS |
| `npm run lint` | PASS (0 errors, pre-existing warnings only) |
| Vitest homepage suite | 25/25 PASS |
| Playwright hydration (homepage) | 20/20 PASS |
| `listing-card-visual-verify.mjs` | 20/20 PASS |
| `homepage-hydration-audit.mjs` | PASS — 0 hydration console errors |
| iPhone SE horizontal overflow (fresh prod `:3040`) | PASS — scrollWidth 375 |

**Note:** Playwright managed port `:3025` may serve a stale `next start` process from a prior session. Fresh production (`next start -p 3040`) serves v7.0 with zero horizontal overflow at 375px.

---

## Screenshots

| Viewport | File |
|----------|------|
| Desktop 1440×900 | `homepage-desktop.png` |
| Tablet 768×1024 | `homepage-tablet.png` |
| Android 412×915 | `homepage-android.png` |
| iPhone 390×844 | `homepage-iphone.png` |
| Card closeup | `listing-card-closeup.png` |

All screenshots: `reports/module-1/homepage-v7/`

---

## Visual checklist (from screenshots)

- [x] Smaller 20px prices — image remains primary focus
- [x] Messages + Bell + Avatar in header
- [x] Location removed
- [x] Vehicles / Property removed from category rail
- [x] No marketplace section titles (carousel begins immediately)
- [x] Rating left / views right in card footer
- [x] Cards aligned in grid with 16px gap
- [x] No skeleton with loaded products

---

## Files changed (UI only)

- `components/header/RovexoHeaderV2.tsx` — MessageSquare, v2 header
- `styles/rovexo/header-v2.css` — heights, padding, icon spacing
- `styles/homepage-v4.css` — v7 card typography, chips, BYI, grid
- `components/homepage-v4/HomepageV4.tsx` — v7.0 marker
- `components/home/constants.ts` — categories filter
- Tests + audit scripts updated for v7 expectations

---

**Awaiting Product Owner approval after localhost screenshot review.**
