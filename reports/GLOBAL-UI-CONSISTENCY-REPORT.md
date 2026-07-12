# ROVEXO Global UI Consistency Report (v1.0)

**Date:** 12 July 2026  
**Reference:** My Account (`ac-canonical` hub + `AccountModuleShell` subpages)  
**Status:** Frozen after validation

---

## Executive summary

A platform-wide UI/UX consistency pass aligned account settings, buyer/seller dashboards, address/payment flows, and help subpages with the canonical My Account design system. Legacy standalone shells were consolidated onto `AccountModuleShell` and `CanonicalPageHeader` without changing business logic.

---

## Canonical design system (SSOT)

| Layer | Source |
|-------|--------|
| Design tokens | `styles/tokens.css`, `components/ui/tokens.ts` |
| Account hub | `styles/rovexo/account-canonical-v2.css` (`ac-canonical__*`) |
| Account modules | `styles/rovexo/account-module-v1.css` (`acm-*`) |
| Page header | `components/navigation/CanonicalPageHeader.tsx` |
| Account shell | `features/account-module/components/AccountModuleShell.tsx` |
| Hub shell | `features/account-center/components/AccountCenterPage.tsx` |
| Buttons / cards | `components/ui/Button.tsx`, `components/ui/Card.tsx`, `rx-surface-card` |
| Registry | `lib/ui-consistency/canonical-registry.ts` |

---

## Components standardized this pass

### Shells migrated to canonical

| Component / route | Before | After |
|-------------------|--------|-------|
| `AccountPageShell` (9 settings routes) | `PageBack` + `text-2xl` + no bottom nav | Wraps `AccountModuleShell` |
| `/buyer` dashboard | `AccountCenterHeader` + `HubPageMain` | `AccountModuleShell` + `CanonicalPageHeader` |
| `/seller` dashboard | `AccountCenterHeader` + `HubPageMain` | `AccountModuleShell` + `CanonicalPageHeader` |
| Address book | Standalone `BetaAppShell` + `PageBack` | `AccountModuleShell` |
| Payment methods | Standalone `BetaAppShell` + `PageBack` | `AccountModuleShell` |
| Help FAQ | `PageBack` + standalone `h1` | `CanonicalPageHeader` |
| Help policies | `PageBack` + standalone `h1` | `CanonicalPageHeader` |

### Already canonical (verified)

| Module | Shell | Header |
|--------|-------|--------|
| My Account hub | `AccountCenterPage` | `RovexoHeaderV2` (account layout) |
| Promotion Tools | `AccountModuleShell` | `CanonicalPageHeader` |
| ROVEXO Ideas | `AccountModuleShell` | `CanonicalPageHeader` |
| Wallet hub | `WalletHubV1` | `CanonicalPageHeader` |
| Messages inbox / chat | `MessagesInboxV1`, `ChatPage` | `CanonicalPageHeader` |
| View Item | `ProductDetailPage` | `CanonicalPageHeader` |
| Help Centre index | `HelpCentrePage` | `CanonicalPageHeader` |
| Orders / Checkout | `BetaPageHeader` / `CheckoutPageHeader` | Delegates to `CanonicalPageHeader` |
| Super Admin | `SuperAdminShell` / `EnterpriseAdminShell` | Enterprise header pattern |

---

## Visual rules enforced

- **Spacing:** `px-ds-4`, `gap-ds-6`, `--ds-space-*` tokens on migrated pages
- **Typography:** Module titles via `CanonicalPageHeader`; body copy `text-sm text-text-secondary`
- **Buttons:** `components/ui/Button` with `buttonVariants` (no ad-hoc heights on migrated routes)
- **Cards:** `rx-surface-card` / `Card` with `rounded-ds-lg` / 14px account section cards
- **List rows:** Hub `ac-canonical__row` (48px+ touch); settings `acm-settings__row`
- **Back navigation:** `CanonicalPageHeader` + `usePageBack` (history-aware)
- **Bottom nav:** Account-family routes use `bottomNavTab="account"`; seller dashboard uses `"sell"`

---

## Deprecated patterns (do not add)

- `ac-hub__*` legacy hub CSS (replaced by `ac-canonical__*`)
- `AccountCenterHeader` on module dashboards
- `PageBack variant="text"` as primary page title
- Standalone `text-2xl font-bold` page titles outside shells
- `BetaAppShell showBottomNav={false}` on account settings routes

---

## Tests added / updated

| Test | Purpose |
|------|---------|
| `tests/global-ui-consistency.test.ts` | Registry, shell migrations, help headers |
| `tests/canonical-page-header.test.ts` | Extended help FAQ/policies consumers |
| `e2e/account-android.spec.ts` | Updated to `ac-canonical__*` selectors + current menu |
| `e2e/buyer-dashboard.spec.ts` | Canonical header on `/buyer` |

---

## Validation

| Check | Result |
|-------|--------|
| TypeScript | Run `npx tsc --noEmit` |
| ESLint | Run `npm run lint` |
| Production build | Run `npm run build` |
| Vitest | Run `npm run test:ci` |

---

## Remaining follow-ups (non-blocking)

- Orphaned legacy files (`AccountHubProfile`, `MyAccountGrid`, `account-hub-v1.css`) can be removed in a future cleanup once all e2e/audit scripts are migrated
- Seller-internal tools using `StickyPageHeader` (migration center, marketplace connectors) are functional but not yet on `CanonicalPageHeader`
- Hub CSS still uses some literal values (`14px`, `#7c3aed`) — future pass can map fully to `--ds-*` tokens

---

**Global UI Consistency v1.0 — FROZEN**
