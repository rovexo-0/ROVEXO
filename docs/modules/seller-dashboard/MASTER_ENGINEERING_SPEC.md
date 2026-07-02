# Seller Dashboard — Master Engineering Specification v1.0

**Single Source of Truth** for the official ROVEXO Seller Dashboard.

## Mission

The only seller dashboard implementation on the platform. Production-ready, mobile-first, aligned with `RovexoHomePage` and frozen `BuyerDashboard`.

## Critical rules

| Rule | Detail |
|------|--------|
| Official route | `/seller` only |
| No duplicates | No `SellerDashboardV2`, legacy hub pages, or temp UI |
| Do not copy | Buyer Dashboard layout — seller-specific sections only |
| Icons | `RovexoIcon` only |
| Bottom nav | Reuse `BetaAppShell` with `bottomNavTab="sell"` |

## Official locations

| Layer | Path |
|-------|------|
| Page | `app/seller/page.tsx` |
| Layout / loading / error | `app/seller/layout.tsx`, `loading.tsx`, `error.tsx` |
| Legacy redirect | `app/seller/dashboard/page.tsx` → `/seller` |
| Component | `components/seller/SellerDashboard.tsx` |
| Hooks | `hooks/seller/` |
| Services | `lib/seller/repository.ts`, `lib/seller/queries.ts` |
| Types | `types/seller/dashboard.ts` |
| Styles | `styles/rovexo-seller-dashboard.css` |

## Component hierarchy

`SellerHeroCard`, `SellerStatsGrid`, `SellerPerformanceCard`, `SellerOrdersCard`, `SellerListingsCard`, `SellerDraftsCard`, `SellerMessagesCard`, `SellerReviewsCard`, `SellerPayoutCard`, `SellerBalanceCard`, `SellerShippingCard`, `SellerAnalyticsCard`, `SellerPromotionCard`, `SellerStoreCard`, `SellerVerificationCard`, `SellerSubscriptionCard`, `SellerNotificationCard`, `SellerQuickActions`, `SellerRecentActivity`, `SellerSupportCard`, `SellerSettingsShortcut`, `SellerFooterActions`

Shared: `SellerSection`, `SellerSkeleton`, `SellerEmptyState`, `SellerErrorState`

## Data architecture

```
Component → useSellerDashboard() → fetchSellerDashboardPage() → fetchSellerDashboardRepository() → domain libs
```

## Security

- Middleware: `/seller` protected (auth required)
- Page: `profile.isSeller` or redirect `/account`

## Future-ready (not implemented)

Wallet engine, AI, Promote Engine, Theme Engine, Glass Icons, Seasonal Themes — hooks only.

## Freeze policy

No git commit until Validation PASS + Freeze Approved.
