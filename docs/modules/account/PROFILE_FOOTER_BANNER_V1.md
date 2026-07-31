# Profile Footer Banner v1.0

**STATUS: LOCKED (CODE FREEZE RC1)** · awaiting Owner visual → CERTIFIED

## What
Premium ROVEXO mascot footer banner on Profile (`/account`), directly under Sign Out.

## Why
Replace empty Profile bottom with Owner-approved marketplace artwork (Buy • Sell • Grow).

## What was not changed
Auth · Wallet · Menu inventory · Sign Out behaviour · Homepage · Settings · DB/API.

## Implementation
- Component: `components/profile/ProfileFooterBanner.tsx`
- Asset: `public/images/profile/profile-footer-banner.png` (transparent PNG, &lt;500KB)
- Wired in: `features/account-center/components/AccountCenterHome.tsx` (Profile hub — there is no `Profile.tsx`)
- CSS: `.profile-footer-banner` in `styles/rovexo/account-canonical-v2.css`
- Imagery: `SafeImage` → `next/image` (image-safety canonical lock)

## Layout (RC1 FULL WIDTH)
Sign Out → `margin-top: 24px` → Banner → `margin-bottom: 32px`  
Banner: `width: 100%` of Profile content · `height: auto` · **no max-height** · no side gaps · transparent container (no card/border/shadow/padding)

## Impact
- Performance: lazy + async decode · ~236KB PNG  
- Responsive: aspect preserved · centered · no overflow  
- Security: static public asset only · pointer-events none  
- Database: none
