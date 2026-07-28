# ROVEXO My Account v1.0 — Permanent Master Page Lock + SSOT Contract

**STATUS:** PERMANENTLY LOCKED · APPROVED  
**Owner approval:** Permanent Master Page Lock = APPROVED  
**SSOT:** `lib/design-system/my-account-v1.ts` (`MY_ACCOUNT_V1_MASTER_PAGE_LOCK`)  
**Tokens:** `lib/design-system/profile-master-tokens.ts`

## What changed

- Owner Permanent Master Page Lock + Permanent SSOT Contract recorded as APPROVED.
- Profile is the only master; no page may invent or override design tokens.
- Inheritance chain, One Change Rule, Side-by-Side Rule, Visual QA Rule, Production Gate formalised in SSOT.

## Why

Owner permanent contract for My Account v1.0: one design system, Profile SSOT, content-only differences.

## What was not changed

- Runtime Profile token values (already extracted).
- Auth, payments, shipping, database, API contracts.
- Commit / push / deploy (blocked until Owner Side-by-Side QA pass).

## Impact

| Area | Impact |
|------|--------|
| Performance | None |
| Responsive | Locked to Profile / Full Width |
| Security | None |
| Database | None |

## Golden rule

ONLY CONTENT MAY DIFFER. DESIGN NEVER DOES.

## Official Side-by-Side QA (Owner)

- http://localhost:3010/account  
- http://localhost:3010/account/settings  
- http://localhost:3010/account/profile  
- http://localhost:3010/account/addresses  
- http://localhost:3010/account/privacy  
- http://localhost:3010/account/security  
