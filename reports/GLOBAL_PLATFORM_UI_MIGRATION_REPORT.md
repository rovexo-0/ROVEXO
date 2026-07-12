# ROVEXO Global Platform UI Migration Report

**Version:** v1.0  
**Status:** FROZEN (post-validation)  
**Visual reference (locked):** Homepage (`app/page.tsx`), My Account hub (`features/account-center/components/AccountCenterHome.tsx`)

## Objective

Platform-wide visual standardization so every route shares one design language — typography, spacing, headers, cards, buttons, safe-area, and scroll behaviour — without changing business logic, routing, APIs, or permissions.

## Shells standardized

| Shell | Purpose |
|-------|---------|
| `CanonicalPageHeader` | Back + centred title + optional right action (My Account module reference) |
| `CanonicalPageShell` | `CanonicalPageHeader` + scroll body (640px max, ds spacing) |
| `DiscoveryPageShell` | `RovexoHeaderV2` + `HubPageMain` (browse/search discovery) |
| `AccountModuleShell` | Account subpages (unchanged reference) |
| `RovexoHeaderV2` | Homepage/search discovery chrome |

## Pages migrated (this pass)

### Discovery & browse
- `/categories` → `DiscoveryPageShell`
- `/category/*`, `/brand/*`, `/browse/*`, `/collections/*`, `/discover/*`, `/trends/*`, `/l/*` → `RovexoHeaderV2` (legacy `Header` removed)
- Seller store (`ProStorePage`) → `RovexoHeaderV2`
- Auctions (`AuctionsPage`, `AuctionsComingSoonPage`) → `RovexoHeaderV2`

### Account-adjacent hubs
- `/legal`, `/legal/*` → `CanonicalPageShell`
- `/support` → `CanonicalPageShell`
- `/plans` → `CanonicalPageShell`
- `/business/directory` → `CanonicalPageShell`
- `/wholesale` → `CanonicalPageShell`
- `/trust` → `CanonicalPageHeader`
- `/resolution`, `/resolution/*` → `CanonicalPageHeader`
- `/notifications/settings` → `CanonicalPageHeader`

### Seller & business tools
- `/seller/compliance` → `CanonicalPageHeader`
- `/seller/tax` → `CanonicalPageHeader`
- `/seller/marketplace-connectors` → `CanonicalPageHeader` (removed `StickyPageHeader`)
- Bring Your Item / migration center → `CanonicalPageHeader`
- Seller review case detail → `CanonicalPageHeader`
- `/business/inventory` → `CanonicalPageHeader`
- Analytics (`AnalyticsHeader`) → `CanonicalPageHeader` with filter action

### Prior session (retained)
- Cart, notifications inbox, wallet sub-pages
- Buyer/seller dashboards → `AccountModuleShell`
- Help Centre subpages, address book, payment methods
- Account settings wrappers

## Legacy UI removed

- `import Header from "@/components/Header"` — **0 remaining** in app/features
- `PageBack variant="text"` as primary page title on: Legal, Business Directory, Seller Review Case
- `StickyPageHeader` on Marketplace Connectors and Migration Center
- Inline `rx-page-header` clone on Notification Settings
- Standalone `text-2xl/3xl font-bold` h1 page titles where `CanonicalPageHeader` now owns the title
- `wallet-hub__header` bespoke blocks (wallet routes, prior pass)

## Components standardized

- `components/layout/CanonicalPageShell.tsx`
- `components/layout/DiscoveryPageShell.tsx`
- `components/navigation/CanonicalPageHeader.tsx` (SSOT)
- `components/beta/BetaPageHeader.tsx` (deprecated wrapper — still routes to canonical)
- `lib/ui-consistency/canonical-registry.ts` (expanded module registry)
- `tests/global-ui-consistency.test.ts` (discovery + shell assertions)

## Locked (not modified)

- Homepage
- My Account hub (`AccountCenterHome`, `ac-canonical__*`)

## Remaining follow-ups (non-blocking)

| Area | Notes |
|------|-------|
| Engine hubs | `*EngineHub.tsx` use `BetaPageHeader` (already wraps canonical) — optional direct import cleanup |
| `OrdersListPage` / `OrderDetailPageShell` | `BetaPageHeader` wrapper — visual OK, optional consolidate to `CanonicalPageShell` |
| Orphan components | `SavedPage`, `NotificationsPage`, `MessagesListPage`, `WalletOverview`, legacy `SellerListingsPage` — verify no active routes |
| Legacy CSS | `account-hub-v1.css`, `account-center.css` — remove when zero references |
| Super Admin / Admin | Intentionally use `SuperAdminShell` / `EnterpriseAdminShell` — not consumer `CanonicalPageHeader` |
| Auth pages | Dedicated auth shells (login/register) — by design |
| E2E | Full Playwright suite may need flake fixes unrelated to header migration |

## Validation

Run before deploy:

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run test:ci
npm run test:e2e
```

## Design system freeze

After successful validation, treat as frozen:

- Page header: `CanonicalPageHeader` only (no new inline `rx-page-header` clones)
- Discovery: `RovexoHeaderV2` / `DiscoveryPageShell` only
- Account subpages: `AccountModuleShell` only
- Spacing: `--ds-space-*` tokens, 640px module max-width, safe-area padding on scroll bodies

---

*Generated as part of P0 platform-wide canonical UI migration.*
