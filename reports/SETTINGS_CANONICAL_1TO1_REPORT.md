# Settings 1:1 Canonical Rebuild Report

**Status:** Complete  
**Date:** 2026-07-12  
**Scope:** Visual-only — all Settings child pages replicate My Account design language

## Reference (SSOT)

| Element | Source |
|---------|--------|
| Settings index | `features/account-module/components/SettingsV1.tsx` |
| Module shell | `features/account-module/components/AccountModuleShell.tsx` |
| Row primitives | `features/account-module/components/SettingsMenu.tsx` |
| Styles | `styles/rovexo/account-module-v1.css` (`acm-settings__*`) |

## Changes

### Shared primitives
- **`SettingsMenu.tsx`** — `SettingsPageBody`, `SettingsMenuSection`, `SettingsMenuCard`, `SettingsMenuRow`, `SettingsFormPanel`
- **`AccountPageShell`** — delegates to `SettingsPageBody` (removed extra padding/gap wrapper)
- **CSS** — outline icons only (removed purple tinted icon backgrounds); form input/submit tokens

### Migrated pages
| Page | File |
|------|------|
| Settings index | `SettingsV1.tsx` |
| Bank Account | `SettingsV1.tsx` (panel) |
| About | `SettingsAboutV1.tsx` |
| Promotion Tools | `PromotionToolsV1.tsx` |
| Profile view | `ProfileViewV1.tsx` (back → settings) |
| Profile edit | `ProfileEditPage.tsx` |
| Addresses | `AddressBookPage.tsx` |
| Payment Methods | `PaymentMethodsPage.tsx` |
| Privacy | `AccountPrivacyPage.tsx` |
| Security | `AccountSecurityPage.tsx` |
| Blocked Users | `AccountBlockedUsersPage.tsx` |
| Language / Currency / Timezone / Appearance | preference pages |
| Buyer preferences | `AccountBuyerPreferencesPage.tsx` |
| Seller shipping | `AccountSellerShippingPage.tsx` |
| Notifications | `NotificationSettingsPage.tsx` |
| Help Centre | `HelpCentrePage.tsx`, `HelpCentreCanonicalSection.tsx` |
| Contact Support | `app/support/page.tsx` |

### Removed patterns
- `rx-surface-card` on all settings child pages
- `CanonicalPageShell` / `BetaAppShell` on Help & Support from account flow
- `promo-v1` grid cards on Promotion Tools index
- Coloured icon backgrounds on settings rows

## Validation

```bash
npm run lint
npm run typecheck
npm run build
npm run test:ci
npm run test:e2e
```

## Locked (unchanged)
- My Account hub (`AccountCenterHome.tsx`)
- Homepage (`app/page.tsx`)
