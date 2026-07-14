# Settings module v1.0 — Freeze

| Field | Value |
|-------|-------|
| Module | Settings |
| Version | v1.0 |
| STATUS | **FROZEN** |
| Canonical status | `CANONICAL_FROZEN_v1.0` |
| Freeze constant | `SETTINGS_STATUS` / `SETTINGS_CANONICAL_FROZEN = true` |
| Spec | `docs/modules/settings/SETTINGS_SPECIFICATION.md` |
| Freeze module | `lib/settings/freeze.ts` |
| Guard test | `tests/settings-freeze.test.ts` |
| Freeze date | **2026-07-14** |

## Approved reference

Authoritative live preview (develop):

- https://rovexo-git-develop-rovexo.vercel.app/account/settings

Current Settings hub UI and inventory are approved exactly as deployed. **No pixel may change under Settings v1.0.**

## Frozen implementation surfaces

| Layer | Path / component |
|-------|------------------|
| Route | `/account/settings` |
| Hub | `SettingsV1` |
| Menu | `SettingsMenuSections` + `lib/account-center/settings-menu.ts` |
| Icons | `SettingsMenuIconGlyph` |
| Danger | `DeleteAccountFlow` + Sign Out row |
| Shell | `AccountCanonicalShell` (`showHeaderTitle`, intro frozen) |
| Styles | `styles/rovexo/account-settings-canonical.css` |
| DOM | `data-settings-canonical="v1.0"` |

## Approved inventory (exact)

**ACCOUNT** · Profile · Addresses · Payment Methods · Notifications  

**SECURITY** · Privacy & Security · Connected Accounts · Devices & Sessions · Blocked Users  

**MARKETPLACE** · Business Verification · Seller Performance · Promotion Tools · Wallet  

**PREFERENCES** · Preferences · Language & Currency · Accessibility  

**LEGAL** · Terms & Policies · About ROVEXO  

**DANGER ZONE** · Sign Out · Delete Account  

## Rules for future development

### Allowed under Settings v1.0

- Bug fixes that restore the approved structure without changing layout, spacing, typography, icons, colours, cards, buttons, header, navigation, or inventory
- Crash / load fixes that preserve visual and functional parity

### Prohibited under Settings v1.0

- Redesign, simplify, rebuild, or restyle the Settings hub
- Add / remove / reorder menu rows or sections
- Spacing, padding, margin, typography, icon, colour, card, or button changes
- Navigation, scroll, animation, or localization behaviour changes on this hub
- Touching Home, Browse, Sell, Inbox, My Account, Wallet, Orders, Language engine, APIs, DB, or routing as part of Settings v1.0 work

### Required for new Settings work

- Ship as **Settings v1.1**, **v1.2**, or **v2.0** with an explicit version bump
- Never mutate frozen Settings v1.0 (`CANONICAL_FROZEN_v1.0`) in place

## Versioning

| Version | Status |
|---------|--------|
| Settings v1.0 | `CANONICAL_FROZEN_v1.0` — current approved production |
| Settings v1.1+ | Future work only |
