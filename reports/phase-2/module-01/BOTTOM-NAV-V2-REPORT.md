# Bottom Navigation V2 — Preview Report

**Module:** Phase 2 · Module 01 (Homepage)  
**Scope:** UI refinement only — no routing, behaviour, or business logic changes  
**Status:** Preview deployed — awaiting approval  
**Date:** 2026-07-11

## Preview URL

https://rovexo-l5guv1h5n-rovexo.vercel.app

**Inspect:** https://vercel.com/rovexo/rovexo/DnsTkrf3ykSq9FqCGaBhUrP3yhWk  
**Deployment ID:** `dpl_DnsTkrf3ykSq9FqCGaBhUrP3yhWk`  
**Target:** Preview only (not production)

## What changed

| Area | Before | After (V2) |
|------|--------|------------|
| Bar height | ~84px shell | 50px bar + safe area |
| Background | Glass / shadow | White, 1px top border, no shadow/blur |
| Inactive icons | Grey / faded | Solid black `#111111` |
| Active icons | Purple | Official ROVEXO purple |
| Sell FAB | Larger | 54px circle (~10–15% smaller), white `+` |
| Icons | Mixed | Lucide family via `BottomNavV2Icon` |
| Labels | Various | Home · Browse · Sell · Inbox · Profile (10px, medium weight) |
| Touch targets | — | Min 44×44px preserved |
| Animation | — | 120ms ease, no bounce |

## Files touched

- `components/ui/BottomNavigation.tsx`
- `components/ui/BottomNavV2Icon.tsx` (new)
- `styles/rovexo/bottom-nav-premium.css`
- `components/ui/bottom-navigation.css`
- `app/globals.css`, `styles/rovexo/layout.css`
- `lib/mobile-ui/scroll-standard.ts`
- `tests/bottom-nav-v2.test.ts` (new)
- `tests/header.test.ts` (fix `readSource` → `readFileSync`)

## Verification

- `npm run typecheck` — pass
- `npm run test:ci` — pass
- `npm run build` — pass
- `npx vercel --yes` — preview ready

## QA checklist

- [ ] Bar is slim, white, 1px top border, no shadow
- [ ] Five tabs in order: Home · Browse · Sell · Inbox · Profile
- [ ] Inactive icons black; active tab purple
- [ ] Sell FAB centered, smaller purple circle with white `+`
- [ ] Safe area respected on iPhone (no Home Indicator overlap)
- [ ] Scroll hide/show still works
- [ ] All tab routes unchanged

## Next step

Await approval before Module 02 (My Account) or production promotion.
