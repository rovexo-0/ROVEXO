# ROVEXO My Account v1.0 — Master Page Lock

**STATUS:** PERMANENTLY LOCKED · APPROVED  
**SSOT:** `lib/design-system/my-account-v1.ts` (`MY_ACCOUNT_V1_MASTER_PAGE_LOCK`)  
**Profile lock:** `lib/design-system/profile-master-design-lock.ts`

## What changed

- Formalised Owner **Master Page Lock**: Profile Page is the single master for template, icon family, colour system, components, spacing, typography, proportions, full width, and SSOT.
- Status set to **PERMANENTLY LOCKED · APPROVED**.
- One Change Rule extended to include Icon Family.
- Prohibited list extended: alternate icon families, colour systems, headers.

## Why

Owner permanent contract: no My Account page may diverge visually or systematically from Profile.

## What was not changed

- Runtime UI tokens (still Profile / Full Width / AccountIcon / SettingsIconTone).
- Auth, payments, shipping, database, API contracts.
- Page content / business logic.

## Impact

| Area | Impact |
|------|--------|
| Performance | None |
| Responsive | None |
| Security | None |
| Database | None |

## Golden rule

ONLY CONTENT MAY BE DIFFERENT. DESIGN NEVER DOES.
