# Buyer Dashboard — Master Engineering Specification v1.0

**Single Source of Truth** for the official ROVEXO Buyer Dashboard.

## Mission

Build the only buyer dashboard implementation. Production-ready, mobile-first, pixel-perfect, aligned with `RovexoHomePage`.

## Critical rules

| Rule | Detail |
|------|--------|
| Do not modify | `RovexoHomePage`, homepage CSS |
| No duplicates | No `BuyerDashboardV2`, `BuyerDashboardNew`, temp UI |
| Icons | `RovexoIcon` only — no Lucide, no inline SVG |
| Navigation | Reuse existing bottom nav — never duplicate |

## Official locations

| Layer | Path |
|-------|------|
| Page | `app/buyer/page.tsx` |
| Component | `components/buyer/BuyerDashboard.tsx` |
| Hooks | `hooks/buyer/` |
| Services | `lib/buyer/` |
| Types | `types/buyer/` |
| Styles | `styles/rovexo-buyer-dashboard.css` |

## Component hierarchy

```
BuyerDashboard
├── BuyerHeader
├── BuyerHero
│   └── BuyerProfileCard
├── BuyerQuickActions
├── BuyerStatistics
├── BuyerOrders
├── BuyerOrderHistory
├── BuyerSavedListings      → RovexoListingCard
├── BuyerRecentlyViewed     → RovexoListingCard
├── BuyerProtection
├── BuyerPayments
├── BuyerAddresses
├── BuyerMessages
├── BuyerNotifications
├── BuyerReviews
├── BuyerSecurity
├── BuyerSettings
├── BuyerSupport
└── BuyerLogout

Shared states: BuyerSkeleton · BuyerEmptyState · BuyerErrorState · BuyerTrustCard
```

## Design tokens

Reference device: **390 × 844 px**, max width **480 px**, centered on desktop.

| Token | Value |
|-------|-------|
| Page padding | 16 / 16 / 16 / 110 px (+ safe areas) |
| Section gap | 24 px |
| Card gap | 16 px |
| Card radius | 24 px |
| Card shadow | soft premium |
| Header height | 64 px |
| Hero height | 180 px min, radius 28 px |
| Quick action card | 104 px, 2-col grid |
| Stat cards | 110 px, 2×2 grid |
| Active order card | 220 px |
| Primary button | 48 px, radius 16 px |

Typography: H1 28 · H2 22 · Section 16 · Body 15 · Caption 13.

## Data architecture

```
Component → useBuyerDashboard() → fetchBuyerDashboard() → fetchBuyerDashboardRepository() → domain libs → Supabase
```

Never query Supabase from UI components.

## Component states

Every section implements: Loading (skeleton), Empty, Error, Success.

## Responsive breakpoints

390 · 430 · 768 · 1024 · 1280 · 1440

## Performance

- Server fetch in `app/buyer/page.tsx`
- `Suspense` + `BuyerSkeleton` for initial load
- Secondary sections lazy-loaded via `next/dynamic`
- Client components only where interaction requires

## Accessibility

Keyboard navigation, ARIA labels, focus states, contrast AA, semantic landmarks.

## Security

Route protected via middleware (`/buyer` in `PROTECTED_PREFIXES`).

## Future-ready (not implemented)

Theme engine, aurora background, wallet, AI assistant, push notifications, ROVEXO rank, live orders — architecture only.

## Acceptance criteria

- [x] Official route `/buyer` renders `BuyerDashboard`
- [x] All spec component files exist under `components/buyer/`
- [x] Repository layer aggregates buyer data
- [x] Reuses homepage listing cards and design language
- [x] `RovexoHomePage` unchanged
- [x] TypeScript, ESLint, build pass
- [x] Vitest contract tests
- [x] Playwright E2E coverage
- [x] Owner freeze approval (2026-06-26)

## Definition of done

Validation PASS + Freeze Certificate **APPROVED** + git commit after approval.

## Freeze policy

After approval: bug fixes, performance, accessibility, minor polish only. No structural changes without owner approval.
