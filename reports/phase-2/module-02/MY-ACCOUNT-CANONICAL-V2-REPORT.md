# Module 02 — My Account Canonical v2.0

**Status:** Preview deployed — awaiting approval  
**Date:** 2026-07-11  
**Homepage:** Untouched (UI locked)

## Preview URL

https://rovexo-1t2yvpqpe-rovexo.vercel.app

## Verification

| Check | Status |
|-------|--------|
| ESLint | PASS |
| TypeScript | PASS |
| Build | PASS |

## Implemented components

| Component | Purpose |
|-----------|---------|
| `AccountCanonicalProfile` | Compact profile: avatar, name, verified, member since, rating |
| `AccountStatsStrip` | 4-stat row: Listings, Saved, Orders, Wallet |
| `AccountMenuSections` | Sectioned menu (Manage, Account, Community, Support) |
| `AccountFollowersPage` | Canonical followers entry (tabs ready) |
| `AccountCenterHome` | Hub shell v2.0 |
| `AccountCenterPage` | Homepage-aligned header + hub |

## Header

- `RovexoHeaderV2` `layout="account"` — wordmark + Messages + Notifications
- No account avatar, no search on account hub

## Menu sections

**MANAGE:** My Listings, Orders, Saved Items, Messages, Reviews, Wallet  
**ACCOUNT:** Verification, Personal Information, Addresses, Payment Methods, Settings  
**COMMUNITY:** 💡 Ideas  
**SUPPORT:** Help Centre, Contact Support  
**SYSTEM:** Sign Out (centered red, no card)

## Removed from hub menu

Dashboard, Analytics, Selling expandable, Cart, Bring Your Item, Business/Buyer/Seller dashboards, decorative cards

## Files modified

- `lib/account-center/canonical-menu.ts`
- `lib/account-center/snapshot.ts` (new)
- `features/account-center/components/*` (profile, stats, menu, page, home, followers)
- `components/header/RovexoHeaderV2.tsx` (account layout)
- `app/account/page.tsx`
- `app/account/followers/page.tsx` (new)
- `styles/rovexo/account-canonical-v2.css` (new)
- `tests/account-canonical-v2.test.ts` (new)
- Updated: account-cart-hub, unified-account-architecture, bring-your-item-release, rovexo-ideas tests

## Confirmations

- **Performance:** Server snapshot fetched in parallel; no blocking client waterfalls on hub
- **Responsive:** Mobile-first, centered `max-width: 640px` / `720px` desktop container
- **Accessibility:** 44px touch targets, ARIA labels on profile/stats/menu, semantic headings

## Next step

STOP — await approval before Module 03 (Inbox / Transaction Hub).
