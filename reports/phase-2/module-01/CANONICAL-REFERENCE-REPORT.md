# ROVEXO Homepage — Canonical Reference Implementation Report

**Date:** 11 July 2026  
**Version:** `phase-2-canonical-ref`  
**Scope:** Homepage UI alignment to official canonical reference (Preview only)  
**Production:** Untouched (`https://www.rovexo.co.uk`)

---

## Preview Deployment

| Item | Value |
|------|-------|
| **Preview URL** | https://rovexo-ajw6mhj52-rovexo.vercel.app |
| **Homepage URL** | https://rovexo-ajw6mhj52-rovexo.vercel.app/ |
| **Deployment ID** | `dpl_GhS5fYYutjvw1MzgwM6YorLQx5BR` |
| **Screenshot** | `reports/phase-2/module-01/homepage-canonical-ref-screenshot.png` |
| **QR Code** | `reports/phase-2/module-01/homepage-preview-qr.png` |

---

## Objective

Reproduce the attached canonical homepage reference 1:1 for layout proportions: header, search, category chips, listing cards, bottom navigation. Remove any platform fee banner below the feed. No backend/API/database changes.

---

## Changes Implemented

### Header & Search
- Homepage-scoped header proportions: 52px shell, 16px horizontal padding, compact action icons
- Search bar: 44px height, light grey pill background, almost full width between logo and actions
- Placeholder: **Search for items or members**
- Camera icon on the right (`homepage-search__camera`) → `/search?visual=1`
- Search magnifier icon left, reference typography (14px / 500 weight)

### Category Chips
- Unchanged purple filled chips (Phones, Computers, etc.)
- Tighter section gap (12px) for reference rhythm

### Listing Card (canonical)
- Image-first ~78% card height (`grid-template-rows: 7.8fr auto`)
- Compact white info: Title → Condition → Price → Platform Fee + ⭐ Rating
- Purple price, purple Platform Fee, gold star rating
- No badges, no Buyer Protection copy
- Card radius 16px, row gap 16px, column gap 10px

### Bottom Navigation
- **Home · Browse · Sell · Inbox · Profile**
- Sell: purple centre FAB (unchanged mechanics)
- Inbox routes to `/messages` with messages icon
- Profile routes to `/account`
- Homepage passes `HP_CANONICAL_BOTTOM_NAV` to override visual-config menu labels

### Removed
- Platform fee banner: no component renders on homepage; CSS guard hides `[data-hp-platform-fee-banner]` if ever injected
- Homepage ends at listing grid (no footer strip)

### Unchanged
- Backend, database, business logic, auth, payments, shipping, APIs
- 2-column equal grid
- Header messages + notifications + profile actions

---

## Files Modified

| File | Change |
|------|--------|
| `app/page.tsx` | Pass `HP_CANONICAL_BOTTOM_NAV` to `BetaAppShell` |
| `lib/homepage/canonical-nav.ts` | **New** — canonical bottom nav SSOT |
| `components/beta/BetaAppShell.tsx` | `menuItems` override prop |
| `components/home/HomepageSearchField.tsx` | Placeholder + camera button |
| `components/ui/BottomNavigation.tsx` | Browse/Inbox/Profile labels, `/messages` route |
| `styles/homepage-canonical.css` | Header, search, feed spacing, banner guard |
| `styles/rovexo/homepage-header.css` | Camera button base styles |
| `components/homepage/canonical/CanonicalHomepage.tsx` | Version `phase-2-canonical-ref` |
| `components/homepage/canonical/CanonicalHomepage.module.css` | Row gap 16px |
| `lib/platform-visual/defaults.ts` | Default nav labels aligned |
| `tests/home-listing-grid-lock.test.ts` | Canonical nav + search tests |
| `tests/navigation-audit.test.ts` | `/messages` bottom nav route |

---

## Verification

| Step | Result |
|------|--------|
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run test:ci` | **2456 tests passed** |
| `npm run build` | Pass |
| `npx vercel --yes` | Preview deployed |

---

## Status

**STOP.** Homepage canonical reference deployed to Preview — awaiting owner approval.

**Module 02 (My Account):** Blocked until Homepage approved.
