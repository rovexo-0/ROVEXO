# ROVEXO Settings — Module Specification

**STATUS:**  
**CANONICAL_FROZEN_v1.0**

| Field | Value |
|-------|-------|
| Module | Settings |
| Version | v1.0 |
| Freeze | `SETTINGS_STATUS` = `CANONICAL_FROZEN_v1.0` (`lib/settings/freeze.ts`) |
| Freeze doc | `docs/modules/settings/SETTINGS_FREEZE.md` |
| Route | `/account/settings` |
| Freeze date | 2026-07-14 |

## Current implementation approved

Settings hub v1.0 is approved exactly as shipped on develop at freeze time.  
Future changes must ship as **Settings v1.1+** only. **No pixel of Settings v1.0 may change.**

## Route

| Route | Purpose |
|-------|---------|
| `/account/settings` | Canonical Settings hub (frozen) |

## Header

- `AccountCanonicalShell` with **`showHeaderTitle`**
- Title: **Settings**
- Back: `/account`
- Intro: **Manage your account and preferences**

## Frozen sections (order)

1. **ACCOUNT** — Profile · Addresses · Payment Methods · Notifications  
2. **SECURITY** — Privacy & Security · Connected Accounts · Devices & Sessions · Blocked Users  
3. **MARKETPLACE** — Business Verification · Seller Performance · Promotion Tools · Wallet  
4. **PREFERENCES** — Preferences · Language & Currency · Accessibility  
5. **LEGAL** — Terms & Policies · About ROVEXO  
6. **DANGER ZONE** — Sign Out · Delete Account  

## Menu SSOT

| Role | Path |
|------|------|
| Section / row inventory | `lib/account-center/settings-menu.ts` → `buildSettingsMenuSections` |
| Hub render | `features/account-module/components/SettingsV1.tsx` |
| Sections render | `features/account-module/components/SettingsMenuSections.tsx` |
| Danger delete | `features/account-module/components/DeleteAccountFlow.tsx` |
| Icons | `features/account-module/components/SettingsMenuIcon.tsx` |
| Styles | `styles/rovexo/account-settings-canonical.css` |
| Freeze markers | `lib/settings/freeze.ts` |
| Freeze test | `tests/settings-freeze.test.ts` |
| Canonical inventory test | `tests/settings-canonical-v1.test.ts` |

## DOM

- `data-settings-canonical="v1.0"` on the Settings hub nav

## Explicit non-goals under v1.0 freeze

- Visual redesign of any kind
- Inventory expansion or reduction
- Spacing / typography / colour / icon / card / button changes
- Component migrations or refactors
- API, database, routing, or localization engine changes for this module
