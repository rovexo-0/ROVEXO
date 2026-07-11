# Module 02 — My Account Canonical UI Lock v1.0

**Status:** Preview deployed — awaiting approval  
**Reference:** Module 02 UI Lock v1.0 spec  
**Homepage:** Untouched

## Preview URL

https://rovexo-f4wfaxwy1-rovexo.vercel.app

## Verification

| Check | Status |
|-------|--------|
| ESLint | PASS |
| TypeScript | PASS |
| Build | PASS |

## UI lock changes

- Profile: purple gradient avatar ring, bold name, member since, single-line rating
- Followers: horizontal row (icon · count · label · chevron), top-right
- Stats: 4 equal columns with outline icons, vertical separators, bolder wallet
- Menu: Lucide outline icons, MANAGE / ACCOUNT / SUPPORT sections per spec
- Verification row: Verified pill + chevron
- Ideas: hub tabs (Ideas, Newest, Popular, Following, New Idea) + search
- Sign Out: centered red, no background
- Bottom nav: icons/labels lifted 3px, tighter spacing, sell gradient + 1px lift

## Hub version

`data-ac-hub-version="v2.0-lock"`

## Files modified

- `lib/account-center/canonical-menu.ts`
- `features/account-center/components/AccountCanonicalProfile.tsx`
- `features/account-center/components/AccountStatsStrip.tsx`
- `features/account-center/components/AccountMenuSections.tsx`
- `features/account-center/components/AccountMenuLucideIcon.tsx` (new)
- `features/account-center/components/AccountMenuRow.tsx`
- `features/account-module/components/RovexoIdeasPage.tsx`
- `styles/rovexo/account-canonical-v2.css`
- `styles/rovexo/bottom-nav-premium.css`
- `tests/account-canonical-v2.test.ts`

## Next step

STOP — await approval before Module 03.
