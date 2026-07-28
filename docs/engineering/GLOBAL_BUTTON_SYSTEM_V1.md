# ROVEXO Global Button System v1.0

**STATUS:** REVIEW (Absolute Authority — awaiting Owner visual approval)  
**SSOT component:** `components/ui/PrimaryButton.tsx`  
**SSOT CSS:** `styles/rovexo/primary-button-v1.css`  
**SSOT tokens:** `lib/design-system/primary-button-v1.ts`

## Spec

| Token | Value |
|-------|--------|
| Height | **20px** |
| Width | **100%** |
| Radius | **20px** |
| Font | **12px / 600** |
| Padding inline | **24px** |
| Theme | ROVEXO purple gradient |
| Shadow | Profile / Settings inheritance |

**Forbidden heights:** 40 · 44 · 48 · 56 · 64

## Wiring

- `CanonicalButton` / `CanonicalButtonLink` with `variant="primary"` → `PrimaryButton` / `PrimaryButtonLink`
- My Account / Full Width / Profile master primary tokens aligned to 20/20
- Balance Withdraw + Payment Methods Add Card use `PrimaryButton` directly

## Exceptions (intentional)

- **Auth Login / Register** Sign In: frozen `components/auth/PrimaryButton` (Auth freeze)
- **PremiumButton** Visit Store / Follow: separate locked pair family (not form CTAs)

## Gates

Scoped Typecheck / ESLint / Build / Vitest: PASS when last run.  
Playwright / Lighthouse / Production Absolute Authority: NOT claimed until executed.  
No commit / push / deploy / freeze until Owner approval.
