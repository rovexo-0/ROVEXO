# ROVEXO Settings — Module Specification

**STATUS:**  
**PERMANENT_LOCK_v1.0_APPROVED** · UI/UX APPROVED · PRODUCTION READY

| Field | Value |
|-------|-------|
| Module | Settings |
| Version | v1.0 |
| Freeze | `SETTINGS_STATUS` = `PERMANENT_LOCK_v1.0_APPROVED` (`lib/settings/freeze.ts`) |
| SSOT | `lib/settings/settings-v1.ts` |
| Freeze doc | `docs/modules/settings/SETTINGS_FREEZE.md` |
| Permanent lock | `docs/modules/account/SETTINGS_V1_PERMANENT_LOCK.md` |
| Route | `/account/settings` |
| Lock date | 2026-07-20 |

## Master rule

PROFILE PAGE = MASTER PAGE + SETTINGS v1.0 = PROFILE DESIGN + DIFFERENT CONTENT.  
ONLY CONTENT MAY DIFFER. DESIGN NEVER DOES.

## Route

| Route | Purpose |
|-------|---------|
| `/account/settings` | Canonical Settings hub (permanent lock) |

## Header

- `MyAccountTemplate` → `AccountCanonicalShell` with **`showHeaderTitle`**
- Title: **Settings**
- Back: `/account`
- Inherits Profile header / Full Width / typography 100%

## Inventory (locked)

See `SETTINGS_MENU_ROW_TITLES` / `buildSettingsMenuSections` / `SETTINGS_V1_INVENTORY`.

## Forbidden

Separate design system, icons, colours, components, padding, spacing, proportions, or animations vs Profile.

## Official review

http://localhost:3010/account/settings
