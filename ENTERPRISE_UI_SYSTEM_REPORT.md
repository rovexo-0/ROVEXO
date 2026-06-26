# ROVEXO v1.0 — Enterprise UI System Report

**Date:** 2026-06-26  
**Release:** Production Enterprise Design System  
**Status:** **PASS**

---

## Design lock — implemented

| Element | Specification | Status |
|---------|---------------|--------|
| Account hub grid | `repeat(2, minmax(0, 1fr))` — two columns only | PASS |
| Hub card size | 100% width × 82px height | PASS |
| Card radius / padding / gap | 22px / 18px / 12px | PASS |
| Card layout | Horizontal — 56×56 Premium 3D icon left, title + subtitle right | PASS |
| Glass styling | Premium soft shadow, glass white background | PASS |
| Notification badge | 18×18 red, count > 0 only, animated | PASS |
| Hub sections | BUY, SELL, BUSINESS, SUPPORT (identical cards) | PASS |
| Icons | Premium 3D (`DashboardIcon3D`) — no outline/flat in hub cards | PASS |
| Bring Your Items | `/import` (alias `/import-wizard` → `/import`) | PASS |
| Publish Listing | `/sell/new` | PASS |
| Sell Item | `/sell` | PASS |
| Footer | Legal links only — no duplicated hub nav | PASS |
| Header / category rail / bottom nav | Existing enterprise components preserved | PASS |
| Scroll auto-hide | 220ms GPU transform (existing behaviour) | PASS |

---

## Key file changes

| Area | Files |
|------|-------|
| Hub card system | `styles/dashboard-v1.css`, `features/account-page/styles/account-page.css`, `styles/mobile-premium.css` |
| Hub components | `MenuCard.tsx`, `MobilePremiumCard.tsx`, `PremiumAccountDashboard.tsx` |
| Account header 3D icons | `AccountPageHeader.tsx` |
| Import routing | `app/import/page.tsx`, `app/import-wizard/page.tsx`, `lib/seller/migration/config.ts`, `lib/supabase/middleware.ts` |
| CTA alignment | `lib/mobile-ui/hubs.ts`, `lib/dashboard/sections.ts`, `lib/navigation/map.ts`, `StoreMigrationHeroBanner.tsx` |
| Icon resolver | `components/icons/DashboardIcon3D.tsx` |
| E2E infra fix | `playwright.config.ts`, `scripts/playwright-prestart.mjs` |

---

## Bring Your Items routing

| CTA | Route | Notes |
|-----|-------|-------|
| Bring Your Items | `/import` | Canonical migration wizard |
| Import wizard alias | `/import-wizard` | Redirects to `/import` |
| Legacy migration | `/seller/migration` | Preserved for bookmarks |
| Publish Listing | `/sell/new` | Single-item wizard |
| Sell Item | `/sell` | Sell hub entry |

`/import` is protected — unauthenticated users redirect to `/login`.

---

## Quality gates

| Gate | Result |
|------|--------|
| `npm run lint` | **PASS** |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** (278 routes incl. `/import`, `/import-wizard`) |
| `npm run test:ci` | **PASS** (251/251 unit tests) |
| `tests/enterprise-ui-system.test.ts` | **PASS** |
| `tests/enterprise-ui-cta-routes.test.ts` | **PASS** |
| Playwright Chromium — core suite | **PASS** (59 passed, 1 skipped) |

### Playwright coverage (Chromium)

- `e2e/master-qa.spec.ts` — public routes, protected routes, navigation, import banner
- `e2e/marketplace.spec.ts` — homepage, search, categories, health
- `e2e/responsive.spec.ts` — iPhone SE/15/15 Pro Max, iPad, Desktop
- `e2e/accessibility.spec.ts` — WCAG audits, touch targets

### Expected skips

- **Listing alias redirect** — skipped when homepage has zero published listings
- **GA4 production script** — skipped outside production measurement context

### E2E infrastructure repair

Fixed inverted `webServer` ternary in `playwright.config.ts` (managed server on port **3025** was not starting). Playwright now ignores stale `.env.local` `PLAYWRIGHT_BASE_URL` / `PLAYWRIGHT_SKIP_WEBSERVER` and always targets the fresh local build.

### Not run locally (requires extra setup)

- `e2e/sell-android.spec.ts` — requires live Supabase credentials + temp seller provisioning
- Firefox / WebKit projects — browser binaries may not be installed locally

---

## Business logic preservation

No changes to:

- API contracts
- Database schema
- Authentication / permissions
- Stripe / Supabase integrations
- Route names (only added `/import` and `/import-wizard` alias)

---

## Deploy note

Production (`rovexo.co.uk`) will reflect the new Enterprise UI and `/import` routing after the next deployment. Local E2E validates the current branch build.

---

## Final result

**Enterprise UI — Production Ready**

- Zero feature loss
- Responsive across mobile, tablet, desktop
- Consistent Premium 3D icon system in account hub
- Dynamic notification badges
- All automated local quality gates passing
