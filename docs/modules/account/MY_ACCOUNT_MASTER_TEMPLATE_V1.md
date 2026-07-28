# ROVEXO My Account Master Template v1.0

**STATUS:** APPROVED · PERMANENT LOCK · PRODUCTION READY  
**SSOT:** `lib/design-system/my-account-v1.ts`  
**Component:** `features/account-canonical/MyAccountTemplate.tsx`

## What changed

- Introduced `MyAccountTemplate` as the single inheritance wrapper for My Account pages.
- Migrated Account Details, Settings, Addresses, Security, Verification, Privacy, Currency, Notifications (and related loading/error shells) to inherit the template.
- Extended Master Design SSOT with RULE #22–#28 (Master Template Engine, Inheritance Lock, One Change Rule, Design Lock, Master Component Lock, Production Gate, Future Proof Lock).

## Why

Owner permanent lock: no My Account page may use a private design system. Profile tokens propagate via one template.

## What was not changed

- Auth, Stripe, Sendcloud, Wallet/Escrow logic, database/schema, API contracts.
- Non–My Account surfaces that correctly use `AccountCanonicalShell` (Orders, Inbox, Wallet hubs, etc.).
- Visual token values (still Profile / Full Width Engine SSOT).

## Impact

| Area | Impact |
|------|--------|
| Performance | Neutral — thin wrapper around existing shell |
| Responsive | Unchanged — Full Width / Responsive engines unchanged |
| Security | None |
| Database | None |

## Inheritance (required)

Settings · Account Details · Addresses · Security · Verification · Privacy · Currency · Notifications · future My Account subpages

## Official review routes

- http://localhost:3010/account
- http://localhost:3010/account/profile
- http://localhost:3010/account/settings
- http://localhost:3010/account/addresses
- http://localhost:3010/account/settings (Security / Privacy / Currency / Notifications / Verification via menu)
