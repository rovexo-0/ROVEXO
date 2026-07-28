# ROVEXO Master Full Width Contract v1.0

**STATUS: PERMANENTLY LOCKED**

## Equation

```
PROFILE = MASTER DESIGN SYSTEM
+ 100% FULL WIDTH
+ ALL MENU PAGES
+ ALL SUBMENU PAGES
= FINAL IMPLEMENTATION
```

## Scope

Entire Profile / Settings tree (not limited to Addresses, Settings, or Ideas): Profile, Settings, Addresses, ROVEXO Ideas, Help, Legal, Wallet, Balance, Followers, Favourites, Promote, Holiday Mode, Notifications, Language, Security, Privacy, Payments, Seller / Business / Shipping settings, every menu / submenu / child / modal / sheet / form / CTA.

## Tokens

| Token | Value |
|-------|-------|
| Header | 64px |
| Primary button | 56px |
| Radius | 16px |
| Width | 100% only |
| Primary CTA | 100% |
| L/R padding | 24px |
| Top / section spacing | 24px |
| Input height | 56px |
| Touch target | ≥ 44px |

## Forbidden

70% · 80% · 85% · 90% · 95% · centered layouts · mini cards · floating containers · secondary layouts · secondary design systems.

## SSOT

- `lib/master-engine/master-full-width-contract-v1.ts`
- `lib/master-engine/full-width-engine.ts`
- `styles/rovexo/full-width-engine-v1.css`
- Shell: `AccountCanonicalShell` (auto Profile master + `data-master-full-width`)

## What changed

- Contract SSOT + Cursor rule locked.
- Tokens aligned: header 64 · section gap 24 · input 56 · touch ≥ 44.
- Engine CSS forces 100% width + 24px pad under `[data-full-width-engine]` (wins over phone-width 16px).
- Sheets (Addresses / Settings edit) → 100% width.
- AvatarUploader / wallet empty copy → no constrained max-width.
- Every `AccountCanonicalShell` page inherits Profile master DOM automatically.

## What did not change

- Auth Login/Register frozen UI structure.
- Homepage layout (still 16px phone inset outside account engine).
- Stripe / Sendcloud / DB / escrow logic.

## Impact

| Area | Impact |
|------|--------|
| Performance | None (CSS/tokens only) |
| Responsive | Account shells 100% width · 24px L/R |
| Security | None |
| Database | None |
