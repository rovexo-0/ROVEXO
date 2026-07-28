# Settings module v1.0 — Permanent Lock

| Field | Value |
|-------|-------|
| Module | Settings |
| Version | v1.0 |
| STATUS | **PERMANENT LOCK · UI/UX APPROVED · PRODUCTION READY** |
| Canonical status | `PERMANENT_LOCK_v1.0_APPROVED` |
| Freeze constant | `SETTINGS_STATUS` / `SETTINGS_CANONICAL_FROZEN = true` |
| Spec | `docs/modules/settings/SETTINGS_SPECIFICATION.md` |
| Permanent lock | `docs/modules/account/SETTINGS_V1_PERMANENT_LOCK.md` |
| Freeze module | `lib/settings/freeze.ts` |
| Guard test | `tests/settings-freeze.test.ts` |
| Lock date | **2026-07-20** |

## Master rule

PROFILE PAGE = MASTER PAGE + SETTINGS v1.0 = PROFILE DESIGN + DIFFERENT CONTENT.  
**ONLY CONTENT MAY DIFFER. DESIGN NEVER DOES.**

## Approved reference

http://localhost:3010/account/settings

## Locked implementation surfaces

| Layer | Path / component |
|-------|------------------|
| Route | `/account/settings` |
| Hub | `SettingsV1` |
| Template | `MyAccountTemplate` (inherits Profile) |
| Menu | `SettingsMenuSections` + `lib/account-center/settings-menu.ts` |
| Icons | `SettingsMenuIconGlyph` → `AccountIcon` |
| Danger | `DeleteAccountFlow` (DANGER ZONE) |
| Shell | `MyAccountTemplate` → `AccountCanonicalShell` |
| Styles | `styles/rovexo/account-settings-canonical.css` |
| DOM | `data-settings-canonical="v1.0"` · `data-settings-lock="permanent"` |

## Approved inventory (exact)

**ACCOUNT** · Personal Information · Addresses · Notifications  

**SECURITY** · Privacy · Security · Verification  

**PREFERENCES** · Currency  

**DANGER ZONE** · Delete Account  

Sign Out lives on Profile only. Language removed (English UK only).

## Freeze rules

- Never mutate Settings v1.0 inventory or design without Owner approval
- Future modules inherit Master Page / Template / Icon / Color / Typography / Components / Full Width
- Status remains `PERMANENT_LOCK_v1.0_APPROVED` until Owner advances version

| Version | Status |
|---------|--------|
| Settings v1.0 | `PERMANENT_LOCK_v1.0_APPROVED` — Owner approved production |
