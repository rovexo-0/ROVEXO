# QA Report — Homepage Simplify (Header V2 + Listing Card V2)

**Date:** 2026-07-06  
**Preview:** http://127.0.0.1:3032  
**Build:** `npm run build` — PASS  
**Tests:** 7 homepage suites / 40 tests — PASS  
**Screenshots:** `reports/module-1/homepage-simplify/screenshots/{before,after}/`

---

## Spec checklist

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | Header 64px, 16px padding, logo left, search flex:1, actions right | PASS | `rx-h2__inner` height 64px; order Messages → Notifications → Settings → Account |
| 2 | Icons 24px, touch 40px, gap 12px, no decorative circles/shadows | PASS | `HeaderV2IconLink`, flat favorite on cards |
| 3 | Red badge only when unread | PASS | `badge > 0` gate |
| 4 | Same header on Homepage, Search, Sell, My Account | PASS | Wired on all four routes |
| 5 | Search 48px height, 24px radius, 16px left pad, 20px icon, placeholder | PASS | `header-v2.css` + `HomepageSearchField` |
| 6 | Category rail: 40px height, 32px chips, 16px radius, 8px gap | PASS | `.rx4-cats` tokens |
| 7 | No duplicate categories | PASS | Single `ROVEXO_CATEGORIES` map |
| 8 | Bring Your Item 52px, CTA **Start**, official gradient, no Import copy | PASS | Hint line removed |
| 9 | Featured seller: seller row + horizontal carousel (new component) | PASS | `HomepageFeaturedSeller` / `rx-fs-*` |
| 10 | ListingCard V2: 160px carousel width, 160×160 image, 16px radius | PASS | Carousel slide lock |
| 11 | Card info: Price → Title → Rating \| Views | PASS | `statsRow` when `showSeller: false` |
| 12 | No @seller, Buyer Protection, username on homepage cards | PASS | CSS + props |
| 13 | Favorite 44px top-right; badges Featured/Boost/Premium only if present | PASS | `resolveStatusBadge` narrowed |
| 14 | Marketplace: no skeleton when products exist | PASS | `resolveSeedItems()` unchanged |
| 15 | Spacing rhythm 24 / 16 / 16 | PASS | `--rx4-section-gap`, `--rx4-card-gap`, padding 16px |
| 16 | Lazy images, virtual feed, no CLS | PASS | `loading="lazy"`, grid sentinel, fixed aspect-ratio media |
| 17 | Dark + Light | PASS | Screenshots `v42-mobile-dark`, `v42-mobile-light` |
| 18 | Chrome, Safari (WebKit), Android, iPhone, Tablet, Desktop | PASS | Playwright matrix in screenshot script |

---

## Manual follow-up (recommended)

- Verify `/search` results grid still uses `ListingCard` with seller row where appropriate (`showSeller: true` default on non-homepage surfaces).
- Spot-check Sell flow with keyboard + screen reader (header + form focus order).

---

## Not performed (per instructions)

- git commit
- git push
- deploy
