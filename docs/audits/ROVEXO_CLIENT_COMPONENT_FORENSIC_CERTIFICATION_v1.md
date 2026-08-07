# ROVEXO CLIENT COMPONENT FORENSIC CERTIFICATION v1

**STATUS:** READ ONLY · ABSOLUTE LOCK · EVIDENCE ONLY · NO IMPLEMENTATION

| Field | Value |
|---|---|
| Generated (UTC) | 2026-08-07T21:15:39.188Z |
| Method | Static scan of every `.ts/.tsx/.js/.jsx` file containing `"use client"` (excl. `node_modules`, `.next`, `.git`, `.vercel`, `coverage`, `test-results`, `playwright-report`, `mobile`) |
| Hook / API detection | Regex token match on source text |
| Import graph | Resolve `@/` and relative imports; detect imports of other `"use client"` modules |
| Implementation | NONE |
| Commit / Push / Deploy | FORBIDDEN |

## FINAL CERTIFICATION SUMMARY

| Metric | Count |
|---|---|
| **Total Client Components** (`"use client"` files) | **782** |
| Verified Required (`REQUIRED`) | **439** |
| Probably Required (`PROBABLY REQUIRED`) | **92** |
| Probably Removable (`PROBABLY REMOVABLE`) | **121** |
| Not Verified (`NOT VERIFIED`) | **130** |
| Of removable: under `archive/` | **12** |
| Of removable: live tree (non-archive) | **109** |

Prior P0 audit cited **759** files. This certification recounts **782** files with `"use client"` under current tree (includes `archive/`, excludes `mobile/`).

### Classification rules (evidence-only)

| Class | Rule |
|---|---|
| **REQUIRED** | Strong client signal: `useState` / `useEffect` / `useLayoutEffect` / `useRef` / `useReducer` / `useContext` / `useSyncExternalStore` / form hooks / Next navigation hooks / `createContext` / browser APIs (`window.`/`document.`/observers/storage/WebSocket/etc.) / `error.tsx` |
| **PROBABLY REQUIRED** | `on*={` event handlers (RSC cannot attach host listeners) and/or matched client third-party imports and/or weak hooks only (`useMemo`/`useCallback`/`useId`/…) without strong signals |
| **PROBABLY REMOVABLE** | No strong/weak hooks, no browser tokens, no `on*={`, no matched client third-party, **and** no resolved imports of other `"use client"` modules |
| **NOT VERIFIED** | No local strong/weak/event/third-party signals but **imports** other client modules — likely a client boundary; removal not proven without child-graph + runtime proof |

---

## MODULE SUMMARY

Per-module file scan of related directories (tsx/ts). **Server Components** = files in scope without `"use client"`. **Shared** = tagged `components/ui` or `lib` paths inside that scan (may overlap).

| Module | Files scanned | Client | Server | Shared-tagged | Client % |
|---|---:|---:|---:|---:|---:|
| Homepage | 78 | 46 | 32 | 16 | 59% |
| Search | 68 | 26 | 42 | 17 | 38.2% |
| Browse | 2 | 0 | 2 | 0 | 0% |
| Listing | 4 | 2 | 2 | 1 | 50% |
| Sell | 161 | 53 | 108 | 67 | 32.9% |
| Messages | 15 | 8 | 7 | 0 | 53.3% |
| Notifications | 12 | 5 | 7 | 0 | 41.7% |
| Wallet | 84 | 35 | 49 | 24 | 41.7% |
| Orders | 48 | 12 | 36 | 24 | 25% |
| Profile | 123 | 58 | 65 | 14 | 47.2% |
| Settings | 69 | 55 | 14 | 0 | 79.7% |
| Checkout | 60 | 16 | 44 | 33 | 26.7% |
| Business | 25 | 3 | 22 | 0 | 12% |
| Admin | 29 | 12 | 17 | 0 | 41.4% |
| Super Admin | 590 | 153 | 437 | 0 | 25.9% |

### Client-file classification by detected module bucket

| Module bucket | Total `"use client"` | REQUIRED | PROBABLY REQUIRED | PROBABLY REMOVABLE | NOT VERIFIED |
|---|---:|---:|---:|---:|---:|
| Other/Shared | 210 | 109 | 23 | 32 | 46 |
| Super Admin | 153 | 108 | 10 | 21 | 14 |
| Profile | 58 | 34 | 8 | 3 | 13 |
| Sell | 58 | 35 | 13 | 6 | 4 |
| Homepage | 46 | 13 | 10 | 8 | 15 |
| Wallet | 35 | 21 | 3 | 9 | 2 |
| Auth | 32 | 17 | 1 | 5 | 9 |
| Search | 26 | 18 | 3 | 2 | 3 |
| Archive | 24 | 5 | 5 | 12 | 2 |
| Chrome/Nav | 21 | 9 | 3 | 3 | 6 |
| UI Shared | 19 | 5 | 3 | 10 | 1 |
| Lib/Hooks | 17 | 12 | 1 | 2 | 2 |
| Checkout | 16 | 8 | 5 | 2 | 1 |
| Orders | 12 | 10 | 1 | 0 | 1 |
| Admin | 12 | 9 | 0 | 3 | 0 |
| App Routes | 11 | 7 | 0 | 0 | 4 |
| Notifications | 11 | 6 | 0 | 1 | 4 |
| Messages | 8 | 6 | 2 | 0 | 0 |
| Settings | 7 | 3 | 1 | 2 | 1 |
| Business | 3 | 1 | 0 | 0 | 2 |
| Listing | 2 | 2 | 0 | 0 | 0 |
| Tests/Scripts | 1 | 1 | 0 | 0 | 0 |

---

## HOMEPAGE SPECIAL AUDIT

### Entry

- **Server page:** `app/(platform)/page.tsx` — **no** `"use client"` (Server Component)
- **Data:** `fetchHomepageFeed(1)` on server (see Phase 4 double-fetch certification)
- **Hydration boundary:** first imported client module in tree (typically `CanonicalHomepage` via `@/components/homepage/canonical`)

### Homepage import tree (depth ≤6, homepage-related imports only)

| File | Role | Bytes | Classification |
|---|---|---:|---|
| `app/(platform)/page.tsx` | SERVER | 4079 | SERVER |
| `components/homepage/canonical/index.ts` | SERVER | 184 | SERVER |
| `components/homepage/canonical/CanonicalHomepage.tsx` | CLIENT | 1770 | PROBABLY REQUIRED |
| `components/ui/ScrollContainer.tsx` | CLIENT | 1595 | PROBABLY REMOVABLE |
| `lib/homepage/v4-data.ts` | SERVER | 2968 | SERVER |
| `lib/homepage/showcase-sellers.ts` | SERVER | 4813 | SERVER |
| `lib/homepage/homepage-final-freeze-v1.ts` | SERVER | 4025 | SERVER |
| `lib/homepage/homepage-eligibility.ts` | SERVER | 10601 | SERVER |
| `lib/homepage/config.ts` | SERVER | 935 | SERVER |
| `lib/homepage/feed-resolve.ts` | SERVER | 3788 | SERVER |
| `components/home/constants.ts` | SERVER | 5315 | SERVER |
| `lib/homepage/feed-ranking.ts` | SERVER | 4081 | SERVER |
| `lib/homepage/store-rotation.ts` | SERVER | 2738 | SERVER |
| `lib/homepage/store-badges.ts` | SERVER | 1345 | SERVER |
| `components/homepage/canonical/CanonicalCategoryRail.tsx` | CLIENT | 849 | PROBABLY REQUIRED |
| `components/ui/tokens.ts` | SERVER | 3239 | SERVER |
| `components/homepage/canonical/featured-store/FeaturedStoreSection.tsx` | CLIENT | 3835 | PROBABLY REQUIRED |
| `components/homepage/canonical/featured-store/FeaturedStoreHeader.tsx` | CLIENT | 2032 | NOT VERIFIED |
| `components/ui/Avatar.tsx` | CLIENT | 2221 | REQUIRED |
| `components/ui/SafeImage.tsx` | CLIENT | 3989 | REQUIRED |
| `components/homepage/canonical/featured-store/ShowcaseViewAllCard.tsx` | CLIENT | 1123 | PROBABLY REMOVABLE |
| `lib/homepage/showcase-final-freeze-v1.ts` | SERVER | 1798 | SERVER |
| `components/ui/ListingCard.tsx` | CLIENT | 15778 | REQUIRED |
| `components/icons/RvxLineIcons.tsx` | SERVER | 10672 | SERVER |
| `features/home/hooks/use-product-watchlist.ts` | CLIENT | 2162 | REQUIRED |
| `components/promotions/PromotionAnalyticsBeacon.tsx` | CLIENT | 870 | REQUIRED |
| `components/homepage/canonical/constants.ts` | SERVER | 237 | SERVER |
| `components/homepage/canonical/CanonicalMarketplaceFeed.tsx` | CLIENT | 8655 | REQUIRED |
| `components/homepage/canonical/CanonicalFeedSkeleton.tsx` | SERVER | 296 | SERVER |
| `components/homepage/canonical/HomepageEmptyState.tsx` | CLIENT | 1437 | PROBABLY REMOVABLE |
| `components/ui/PremiumButton.tsx` | SERVER | 2751 | SERVER |
| `components/home/hooks/useMarketplaceFeedColumns.ts` | CLIENT | 823 | REQUIRED |
| `lib/homepage/canonical-responsive.ts` | SERVER | 1938 | SERVER |
| `components/home/HomePageShell.tsx` | CLIENT | 324 | PROBABLY REMOVABLE |
| `components/beta/BetaAppShell.tsx` | CLIENT | 1996 | REQUIRED |
| `components/ui/BottomNavigation.tsx` | CLIENT | 8180 | REQUIRED |
| `components/ui/BottomNavV2Icon.tsx` | CLIENT | 1532 | PROBABLY REMOVABLE |
| `components/home/MobileHeaderScrollContext.tsx` | CLIENT | 394 | NOT VERIFIED |
| `components/home/RovexoMobileHeaderScrollContext.tsx` | CLIENT | 4468 | REQUIRED |
| `features/notifications/components/RealtimeNotificationProvider.tsx` | CLIENT | 13476 | REQUIRED |
| `components/seo/JsonLdScript.tsx` | SERVER | 752 | SERVER |
| `lib/homepage/canonical-nav.ts` | SERVER | 710 | SERVER |

### Nested Client Components (largest first in tree)

| File | Bytes | Classification |
|---|---:|---|
| `components/ui/ListingCard.tsx` | 15778 | REQUIRED |
| `features/notifications/components/RealtimeNotificationProvider.tsx` | 13476 | REQUIRED |
| `components/homepage/canonical/CanonicalMarketplaceFeed.tsx` | 8655 | REQUIRED |
| `components/ui/BottomNavigation.tsx` | 8180 | REQUIRED |
| `components/home/RovexoMobileHeaderScrollContext.tsx` | 4468 | REQUIRED |
| `components/ui/SafeImage.tsx` | 3989 | REQUIRED |
| `components/homepage/canonical/featured-store/FeaturedStoreSection.tsx` | 3835 | PROBABLY REQUIRED |
| `components/ui/Avatar.tsx` | 2221 | REQUIRED |
| `features/home/hooks/use-product-watchlist.ts` | 2162 | REQUIRED |
| `components/homepage/canonical/featured-store/FeaturedStoreHeader.tsx` | 2032 | NOT VERIFIED |
| `components/beta/BetaAppShell.tsx` | 1996 | REQUIRED |
| `components/homepage/canonical/CanonicalHomepage.tsx` | 1770 | PROBABLY REQUIRED |
| `components/ui/ScrollContainer.tsx` | 1595 | PROBABLY REMOVABLE |
| `components/ui/BottomNavV2Icon.tsx` | 1532 | PROBABLY REMOVABLE |
| `components/homepage/canonical/HomepageEmptyState.tsx` | 1437 | PROBABLY REMOVABLE |
| `components/homepage/canonical/featured-store/ShowcaseViewAllCard.tsx` | 1123 | PROBABLY REMOVABLE |
| `components/promotions/PromotionAnalyticsBeacon.tsx` | 870 | REQUIRED |
| `components/homepage/canonical/CanonicalCategoryRail.tsx` | 849 | PROBABLY REQUIRED |
| `components/home/hooks/useMarketplaceFeedColumns.ts` | 823 | REQUIRED |
| `components/home/MobileHeaderScrollContext.tsx` | 394 | NOT VERIFIED |
| `components/home/HomePageShell.tsx` | 324 | PROBABLY REMOVABLE |

### Homepage hydration notes

- `CanonicalHomepage` is `"use client"` and nests `CanonicalMarketplaceFeed`, rails, showcase — **client island** below Server `HomePage`.
- Nested clients hydrate as one island subtree under the first client boundary (React Client Component composition).
- Largest homepage-bucket client files (module=Homepage), top 15 by bytes:

| File | Bytes | Class |
|---|---:|---|
| `components/home/hooks/useInfiniteCarousel.ts` | 14746 | REQUIRED |
| `components/homepage/canonical/CanonicalMarketplaceFeed.tsx` | 8655 | REQUIRED |
| `components/home/RovexoFooterNavigation.tsx` | 5649 | REQUIRED |
| `components/home/RovexoMobileHeaderScrollContext.tsx` | 4468 | REQUIRED |
| `components/homepage-v4/HomepageV4Feed.tsx` | 4375 | REQUIRED |
| `components/homepage-v3/HomepageV3Feed.tsx` | 4225 | REQUIRED |
| `components/home/RovexoAllListings.tsx` | 4124 | REQUIRED |
| `components/home/HomepageHeader.tsx` | 3976 | REQUIRED |
| `components/homepage/canonical/featured-store/FeaturedStoreSection.tsx` | 3835 | PROBABLY REQUIRED |
| `components/homepage-v3/HomepageV3Showcase.tsx` | 3668 | NOT VERIFIED |
| `components/home/stores/StoreCard.tsx` | 3619 | PROBABLY REQUIRED |
| `components/home/RovexoShowcaseSection.tsx` | 3584 | NOT VERIFIED |
| `components/homepage-v4/HomepageV4Showcase.tsx` | 3272 | NOT VERIFIED |
| `components/home/hooks/useVirtualizedFeedWindow.ts` | 3254 | REQUIRED |
| `components/homepage-v4/HomepageV4Header.tsx` | 3143 | REQUIRED |

---

## BUNDLE IMPACT

| Field | Value |
|---|---|
| Evidence | `.next/static/chunks` present |
| Total JS chunk bytes (sum) | 7666303 (~7487 KB raw) |
| Chunk files counted | 381 |
| Per-client-component attribution | **NOT VERIFIED** |
| Likely JS shipped (Homepage only) | **NOT VERIFIED** |
| Likely hydration cost | **NOT VERIFIED** |

Largest chunks (not mapped to specific Client Components):

| Chunk | KB (raw) |
|---|---:|
| `.next/static/chunks/23-ytmtt77ys2.css` | 788.3 |
| `.next/static/chunks/1ref13oy6wuup.js` | 405.3 |
| `.next/static/chunks/0q97bg7l4sodj.js` | 291.7 |
| `.next/static/chunks/1tcm_i90_ay9h.js` | 227.8 |
| `.next/static/chunks/2gpzj13ya6q7j.js` | 201.6 |
| `.next/static/chunks/3wb8sulivvkda.js` | 176.3 |
| `.next/static/chunks/3s1wuk-38ot22.js` | 167.8 |
| `.next/static/chunks/32651o4m3xh9y.js` | 144.9 |
| `.next/static/chunks/1kzmzsk02nfai.js` | 132.1 |
| `.next/static/chunks/0vzt8s0r22qw2.js` | 124.6 |
| `.next/static/chunks/1mqwaey4ntcyz.css` | 121.8 |
| `.next/static/chunks/0cz1d0mv5g_q7.js` | 110 |
| `.next/static/chunks/0a8qzi66hwxi2.css` | 82.1 |
| `.next/static/chunks/1436d-7r82e8x.js` | 80.5 |
| `.next/static/chunks/1b-31-hv91x9e.js` | 72.6 |

Largest client islands by source bytes (proxy only — not compiled weight):

| File | Source bytes | Module | Class |
|---|---:|---|---|
| `features/super-admin/enterprise-marketplace-completion-engine/EnterpriseMarketplaceCompletionAdmin.tsx` | 88391 | Super Admin | REQUIRED |
| `features/inbox/components/ConversationHub.tsx` | 80920 | Messages | REQUIRED |
| `scripts/cert-run6-zero-lag.ts` | 51478 | Tests/Scripts | REQUIRED |
| `features/sell/context/SellProvider.tsx` | 46377 | Sell | REQUIRED |
| `features/inbox/components/InboxPage.tsx` | 39819 | Messages | REQUIRED |
| `features/profile/components/ViewProfilePage.tsx` | 35968 | Other/Shared | REQUIRED |
| `features/account-module/components/RovexoIdeasPage.tsx` | 30401 | Profile | REQUIRED |
| `features/super-admin/homepage-enterprise-certification-engine/HomepageEnterpriseCertificationAdmin.tsx` | 26261 | Super Admin | REQUIRED |
| `features/super-admin/mobile-distribution-center/MobileDistributionCenterAdmin.tsx` | 25343 | Super Admin | REQUIRED |
| `features/super-admin/enterprise-compliance-center/EnterpriseComplianceCenterAdmin.tsx` | 25082 | Super Admin | REQUIRED |
| `features/store/components/StoreVisitPageV2.tsx` | 25037 | Other/Shared | REQUIRED |
| `features/super-admin/app-studio/AppStudio.tsx` | 24458 | Super Admin | REQUIRED |
| `features/super-admin/platform-visual/ThemeStudioPro.tsx` | 24166 | Super Admin | REQUIRED |
| `features/super-admin/enterprise-core/EnterpriseCore.tsx` | 23862 | Super Admin | REQUIRED |
| `features/account/components/ProfileEditPage.tsx` | 22754 | Profile | REQUIRED |
| `features/super-admin/omega-enterprise-mobile/OmegaEnterpriseMobileAdmin.tsx` | 21021 | Super Admin | REQUIRED |
| `features/super-admin/staff-profile/StaffProfileAdmin.tsx` | 19803 | Super Admin | REQUIRED |
| `components/ui/SearchBar.tsx` | 19698 | UI Shared | REQUIRED |
| `features/account/components/AccountTwoFactorPage.tsx` | 19088 | Profile | REQUIRED |
| `features/super-admin/enterprise-category-management-center/EnterpriseCategoryManagementAdmin.tsx` | 18699 | Super Admin | REQUIRED |
| `features/super-admin/experience-v3/ExperienceShell.tsx` | 18573 | Super Admin | REQUIRED |
| `features/super-admin/enterprise-e2e-validation-engine/EnterpriseE2eValidationAdmin.tsx` | 18546 | Super Admin | REQUIRED |
| `features/super-admin/omega-development-director/OmegaDevelopmentDirectorAdmin.tsx` | 18261 | Super Admin | REQUIRED |
| `features/super-admin/enterprise-autonomous-execution-engine/EnterpriseAutonomousExecutionAdmin.tsx` | 17835 | Super Admin | REQUIRED |
| `app/(platform)/super-admin/promotion-catalog/page.tsx` | 17191 | Super Admin | REQUIRED |

---

## TOP 50 VERIFIED OPTIMISATION OPPORTUNITIES

**ONLY** `PROBABLY REMOVABLE` · non-`archive/` · static evidence only · **NO implementation**.

| # | File | Module | Bytes | Regression if converted | Why probably removable |
|---|---|---|---:|---|---|
| 1 | `lib/bring-your-item/certification.ts` | Lib/Hooks | 17067 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 2 | `lib/ops/performance-audit.ts` | Lib/Hooks | 12467 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 3 | `features/seller/compliance/ComplianceDashboard.tsx` | Sell | 11776 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 4 | `features/admin/components/ProductionOperationsDashboard.tsx` | Admin | 6714 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 5 | `features/super-admin/components/premium/EnterpriseDashboardStandard.tsx` | Super Admin | 5116 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 6 | `features/super-admin/components/premium/SuperAdminPremiumDashboard.tsx` | Super Admin | 4429 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 7 | `features/wallet/components/WalletInsights.tsx` | Wallet | 3057 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 8 | `features/seller/migration/components/inline/MigrationImportProgressPanel.tsx` | Sell | 3009 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 9 | `features/super-admin/operations/AiIncidentHistorySection.tsx` | Super Admin | 2943 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 10 | `features/super-admin/operations/AiOperationsSummaryCards.tsx` | Super Admin | 2916 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 11 | `features/commerce-ui/components/ParcelTrackingCard.tsx` | Other/Shared | 2833 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 12 | `features/super-admin/operations/AiSecuritySection.tsx` | Super Admin | 2822 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 13 | `features/super-admin/operations/AiPerformanceSection.tsx` | Super Admin | 2708 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 14 | `features/help/components/HelpCategoryHubPage.tsx` | Other/Shared | 2635 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 15 | `components/ui/PrimaryButton.tsx` | UI Shared | 2530 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 16 | `components/icons/BottomNavIcon3D.tsx` | Chrome/Nav | 2362 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 17 | `features/wallet/components/WalletPayoutsPage.tsx` | Wallet | 2354 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 18 | `features/super-admin/live-analytics/components/LiveEventFeed.tsx` | Super Admin | 2349 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 19 | `features/super-admin/command-center-v2/components/CcDonutChart.tsx` | Super Admin | 2332 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 20 | `features/shipping/components/ShipmentSummary.tsx` | Other/Shared | 2313 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 21 | `src/components/canonical/CanonicalInput.tsx` | Other/Shared | 2310 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 22 | `features/wallet/components/WalletTransactionsList.tsx` | Wallet | 2264 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 23 | `features/help/components/HelpRelatedContent.tsx` | Other/Shared | 2255 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 24 | `features/wallet/components/WalletProfileChrome.tsx` | Wallet | 2149 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 25 | `src/components/canonical/CanonicalSelector.tsx` | Other/Shared | 2100 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 26 | `components/icons/PremiumNavIcon.tsx` | Other/Shared | 2082 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 27 | `features/super-admin/omega-command-center/OmegaEngineAdmin.tsx` | Super Admin | 2074 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 28 | `components/icons/HomeCategoryIcon3D.tsx` | Other/Shared | 1993 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 29 | `features/super-admin/operations/AiRecommendationsSection.tsx` | Super Admin | 1990 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 30 | `features/account-center/components/AccountSellerPerformanceCard.tsx` | Profile | 1962 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 31 | `features/admin/components/PlatformAnalyticsDashboard.tsx` | Admin | 1911 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 32 | `components/sell/PublishingOverlay.tsx` | Other/Shared | 1904 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 33 | `features/profile/components/ProfileCommandCentreButton.tsx` | Other/Shared | 1849 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 34 | `features/wallet/components/MonthlyStatementsList.tsx` | Wallet | 1840 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 35 | `features/admin/components/MonetizationAdminDashboard.tsx` | Admin | 1793 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 36 | `features/super-admin/command-center-v1/components/HealthScoresPanel.tsx` | Super Admin | 1776 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 37 | `features/super-admin/command-center-v1/components/CriticalAlertsBar.tsx` | Super Admin | 1717 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 38 | `features/shipping/components/ShippingTrackingTimeline.tsx` | Other/Shared | 1715 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 39 | `features/super-admin/components/premium/OmegaStatusBar.tsx` | Super Admin | 1700 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 40 | `features/account-module/components/SettingsMenuIcon.tsx` | Profile | 1669 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 41 | `features/super-admin/components/SuperAdminMonitoringWidgets.tsx` | Super Admin | 1648 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 42 | `components/icons/DashboardIcon3D.tsx` | Other/Shared | 1641 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 43 | `components/ui/ScrollContainer.tsx` | UI Shared | 1595 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 44 | `components/ui/BottomNavV2Icon.tsx` | Chrome/Nav | 1532 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 45 | `features/super-admin/operations/AiLiveMonitoringSection.tsx` | Super Admin | 1508 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 46 | `features/wallet/components/AnnualStatementsList.tsx` | Wallet | 1508 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 47 | `features/account-center/components/MasterMenuIcon.tsx` | Profile | 1500 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 48 | `components/ui/SkeletonFade.tsx` | UI Shared | 1451 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 49 | `components/homepage/canonical/HomepageEmptyState.tsx` | Homepage | 1437 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |
| 50 | `features/shipping/components/ShippingCard.tsx` | Other/Shared | 1412 | MEDIUM | Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion. |

---

## EVERY PROBABLY REMOVABLE (full list)

### `archive/homepages/AuctionsSection.tsx`

- **Module:** Archive
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** LOW
- **Why:** Located under archive/; static scan found no client hooks, browser APIs, on* handlers, or third-party client libs. Not part of live route tree (archive).
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `archive/homepages/BringYourItemsBanner.tsx`

- **Module:** Archive
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** LOW
- **Why:** Located under archive/; static scan found no client hooks, browser APIs, on* handlers, or third-party client libs. Not part of live route tree (archive).
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `archive/homepages/HomeContent.tsx`

- **Module:** Archive
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** LOW
- **Why:** Located under archive/; static scan found no client hooks, browser APIs, on* handlers, or third-party client libs. Not part of live route tree (archive).
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `archive/homepages/HomeSecondaryBanners.tsx`

- **Module:** Archive
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** LOW
- **Why:** Located under archive/; static scan found no client hooks, browser APIs, on* handlers, or third-party client libs. Not part of live route tree (archive).
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `archive/homepages/QuickFiltersRail.tsx`

- **Module:** Archive
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** LOW
- **Why:** Located under archive/; static scan found no client hooks, browser APIs, on* handlers, or third-party client libs. Not part of live route tree (archive).
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `archive/premium/BringYourItemCta.tsx`

- **Module:** Archive
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** LOW
- **Why:** Located under archive/; static scan found no client hooks, browser APIs, on* handlers, or third-party client libs. Not part of live route tree (archive).
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `archive/premium/BringYourItemLanding.tsx`

- **Module:** Archive
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** LOW
- **Why:** Located under archive/; static scan found no client hooks, browser APIs, on* handlers, or third-party client libs. Not part of live route tree (archive).
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `archive/premium/DealsSection.tsx`

- **Module:** Archive
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** LOW
- **Why:** Located under archive/; static scan found no client hooks, browser APIs, on* handlers, or third-party client libs. Not part of live route tree (archive).
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `archive/premium/LatestListings.tsx`

- **Module:** Archive
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** LOW
- **Why:** Located under archive/; static scan found no client hooks, browser APIs, on* handlers, or third-party client libs. Not part of live route tree (archive).
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `archive/premium/ListingGrid.tsx`

- **Module:** Archive
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** LOW
- **Why:** Located under archive/; static scan found no client hooks, browser APIs, on* handlers, or third-party client libs. Not part of live route tree (archive).
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `archive/premium/PopularListings.tsx`

- **Module:** Archive
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** LOW
- **Why:** Located under archive/; static scan found no client hooks, browser APIs, on* handlers, or third-party client libs. Not part of live route tree (archive).
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `archive/premium/TrendingListings.tsx`

- **Module:** Archive
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** LOW
- **Why:** Located under archive/; static scan found no client hooks, browser APIs, on* handlers, or third-party client libs. Not part of live route tree (archive).
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/auth/AuthBackButton.tsx`

- **Module:** Auth
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/branding/CanonicalRx3dSplashVisual.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/buyer/BuyerSection.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/buyer/BuyerTrustCard.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/empty-state/TeddyAnimation.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/header/HeaderBringYourItemCta.tsx`

- **Module:** Chrome/Nav
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/home/HomePageShell.tsx`

- **Module:** Homepage
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/home/RovexoAllListingsGrid.tsx`

- **Module:** Homepage
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/home/RovexoBringYourItemCta.tsx`

- **Module:** Homepage
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/homepage-v3/HomepageV3BringYourItem.tsx`

- **Module:** Homepage
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/homepage-v3/HomepageV3CategoryRail.tsx`

- **Module:** Homepage
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/homepage-v4/HomepageV4CategoryRail.tsx`

- **Module:** Homepage
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/homepage/canonical/featured-store/ShowcaseViewAllCard.tsx`

- **Module:** Homepage
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/homepage/canonical/HomepageEmptyState.tsx`

- **Module:** Homepage
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/icons/BottomNavIcon3D.tsx`

- **Module:** Chrome/Nav
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/icons/DashboardIcon3D.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/icons/HomeCategoryIcon3D.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/icons/PremiumNavIcon.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/listing/ListingAttributeIcon.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/listing/ListingAttributeLabel.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/listing/ListingAttributeValue.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/NotificationBell.tsx`

- **Module:** Notifications
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/sell/PublishingOverlay.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/ui/BottomNavV2Icon.tsx`

- **Module:** Chrome/Nav
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/ui/Checkbox.tsx`

- **Module:** UI Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/ui/motion.tsx`

- **Module:** UI Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/ui/Pagination.tsx`

- **Module:** UI Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/ui/PremiumEmptyStateImage.tsx`

- **Module:** UI Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/ui/PrimaryButton.tsx`

- **Module:** UI Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/ui/Radio.tsx`

- **Module:** UI Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/ui/ScrollContainer.tsx`

- **Module:** UI Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/ui/Select.tsx`

- **Module:** UI Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/ui/SkeletonFade.tsx`

- **Module:** UI Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `components/ui/Textarea.tsx`

- **Module:** UI Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/account-center/components/AccountSellerPerformanceCard.tsx`

- **Module:** Profile
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/account-center/components/MasterMenuIcon.tsx`

- **Module:** Profile
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/account-module/components/SettingsMenuIcon.tsx`

- **Module:** Profile
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/admin/components/MonetizationAdminDashboard.tsx`

- **Module:** Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/admin/components/PlatformAnalyticsDashboard.tsx`

- **Module:** Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/admin/components/ProductionOperationsDashboard.tsx`

- **Module:** Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/analytics/components/AnalyticsDoughnutChart.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/analytics/components/AnalyticsOverviewGrid.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/analytics/components/AnalyticsPromotionsSection.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/analytics/components/AnalyticsRecentActivitySection.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/auth/components/AuthSelect.tsx`

- **Module:** Auth
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/auth/components/LoginRememberRow.tsx`

- **Module:** Auth
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/auth/components/ResetPasswordChecklist.tsx`

- **Module:** Auth
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/auth/components/ResetPasswordStrengthMeter.tsx`

- **Module:** Auth
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/checkout/components/CheckoutGuardBlocked.tsx`

- **Module:** Checkout
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/commerce-ui/components/ParcelTrackingCard.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/dashboard/components/DashboardSummaryGrid.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/help/components/HelpAssistant.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/help/components/HelpCategoryHubPage.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/help/components/HelpRelatedContent.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/mobile-ui/components/MobileHubNav.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/product-detail/ProductStockStatus.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/profile/components/ProfileCommandCentreButton.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/promote/components/StoreAnalytics.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/search/components/MarketplaceNoProductsEmpty.tsx`

- **Module:** Search
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/search/components/SearchLandingClient.tsx`

- **Module:** Search
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/sell/components/FieldError.tsx`

- **Module:** Sell
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/seller/compliance/ComplianceDashboard.tsx`

- **Module:** Sell
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/seller/migration/components/inline/MigrationImportProgressPanel.tsx`

- **Module:** Sell
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/seller/migration/components/inline/MigrationValidationList.tsx`

- **Module:** Sell
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/seller/migration/components/MigrationStepIndicator.tsx`

- **Module:** Sell
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/seller/migration/components/StoreMigrationHeroBanner.tsx`

- **Module:** Sell
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/settings/components/LanguagePicker.tsx`

- **Module:** Settings
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/settings/components/SettingToggle.tsx`

- **Module:** Settings
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/shipping/components/ShipmentSummary.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/shipping/components/ShippingCard.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/shipping/components/ShippingTrackingTimeline.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/command-center-v1/components/CriticalAlertsBar.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/command-center-v1/components/HealthScoresPanel.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/command-center-v1/components/LiveStatusBadge.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/command-center-v1/components/QuickActionsGrid.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/command-center-v1/components/StatusHeader.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/command-center-v2/components/CcDonutChart.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/components/premium/EnterpriseDashboardStandard.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/components/premium/OmegaStatusBar.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/components/premium/SuperAdminBreadcrumbs.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/components/premium/SuperAdminPremiumDashboard.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/components/SuperAdminMonitoringWidgets.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/live-analytics/components/AnimatedNumber.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/live-analytics/components/LiveEventFeed.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/live-analytics/components/MiniSparkline.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/omega-command-center/OmegaEngineAdmin.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/operations/AiIncidentHistorySection.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/operations/AiLiveMonitoringSection.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/operations/AiOperationsSummaryCards.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/operations/AiPerformanceSection.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/operations/AiRecommendationsSection.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/super-admin/operations/AiSecuritySection.tsx`

- **Module:** Super Admin
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/support/components/SupportSuccessPage.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/trust/components/TrustTierBadge.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/wallet/components/AnnualStatementsList.tsx`

- **Module:** Wallet
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/wallet/components/MonthlyStatementsList.tsx`

- **Module:** Wallet
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/wallet/components/MonthSummaryGrid.tsx`

- **Module:** Wallet
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/wallet/components/PayoutStatusCard.tsx`

- **Module:** Wallet
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/wallet/components/ProfileBalanceMenuIcon.tsx`

- **Module:** Wallet
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/wallet/components/WalletInsights.tsx`

- **Module:** Wallet
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/wallet/components/WalletPayoutsPage.tsx`

- **Module:** Wallet
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/wallet/components/WalletProfileChrome.tsx`

- **Module:** Wallet
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `features/wallet/components/WalletTransactionsList.tsx`

- **Module:** Wallet
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `lib/bring-your-item/certification.ts`

- **Module:** Lib/Hooks
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `lib/checkout/checkout-session-self-heal-client-v1.ts`

- **Module:** Checkout
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `lib/ops/performance-audit.ts`

- **Module:** Lib/Hooks
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `src/components/canonical/CanonicalCheckbox.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `src/components/canonical/CanonicalInput.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

### `src/components/canonical/CanonicalSelector.tsx`

- **Module:** Other/Shared
- **Classification:** PROBABLY REMOVABLE
- **Regression risk if converted:** MEDIUM
- **Why:** Static scan found no useState/useEffect/useRef/router/context/browser APIs, no on*={ handlers, no matched client third-party imports, and no resolved imports of other "use client" modules. The "use client" directive appears unnecessary for this file in isolation. Runtime/Owner confirmation still required before conversion.
- **Hooks matched:** none
- **Browser matched:** none
- **on* handlers:** false
- **Third-party:** none
- **Client imports resolved:** none

---

## COMPLETE INVENTORY — EVERY `"use client"` FILE

| File | Module | Class | Hooks | Browser | Context | Events | Third-party | Client imports | Regression | Bytes |
|---|---|---|---|---|---|---|---|---|---|---:|
| `app/(platform)/account/error.tsx` | Profile | REQUIRED | — | — | false | true | — | 1 | HIGH | 310 |
| `app/(platform)/account/promotion-tools/error.tsx` | Profile | REQUIRED | — | — | false | true | — | 1 | HIGH | 317 |
| `app/(platform)/account/settings/error.tsx` | Profile | REQUIRED | — | — | false | true | — | 1 | HIGH | 318 |
| `app/(platform)/balance/error.tsx` | Wallet | REQUIRED | — | — | false | true | — | 1 | HIGH | 467 |
| `app/(platform)/buyer/error.tsx` | App Routes | REQUIRED | — | — | false | true | — | 1 | HIGH | 331 |
| `app/(platform)/checkout/error.tsx` | Checkout | REQUIRED | — | — | false | true | — | 0 | HIGH | 1000 |
| `app/(platform)/inbox/error.tsx` | Messages | REQUIRED | — | — | false | true | — | 1 | HIGH | 308 |
| `app/(platform)/listing/[slug]/error.tsx` | Listing | REQUIRED | — | — | false | true | — | 1 | HIGH | 310 |
| `app/(platform)/messages/error.tsx` | Messages | REQUIRED | — | — | false | true | — | 1 | HIGH | 311 |
| `app/(platform)/orders/error.tsx` | Orders | REQUIRED | — | — | false | true | — | 1 | HIGH | 309 |
| `app/(platform)/search/error.tsx` | Search | REQUIRED | — | — | false | true | — | 1 | HIGH | 309 |
| `app/(platform)/seller/error.tsx` | Sell | REQUIRED | — | — | false | true | — | 1 | HIGH | 333 |
| `app/(platform)/settings/error.tsx` | Settings | REQUIRED | — | — | false | true | — | 1 | HIGH | 311 |
| `app/(platform)/staff/calls/page.tsx` | App Routes | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 251 |
| `app/(platform)/staff/directory/page.tsx` | App Routes | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 259 |
| `app/(platform)/staff/messages/page.tsx` | App Routes | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 257 |
| `app/(platform)/staff/page.tsx` | App Routes | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 236 |
| `app/(platform)/super-admin/pricing/page.tsx` | Super Admin | REQUIRED | useState,useEffect,useCallback | — | false | true | — | 1 | HIGH | 9041 |
| `app/(platform)/super-admin/promotion-catalog/page.tsx` | Super Admin | REQUIRED | useState,useEffect,useCallback | — | false | true | — | 1 | HIGH | 17191 |
| `app/(platform)/super-admin/staff/page.tsx` | Super Admin | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 234 |
| `app/(platform)/user/[username]/error.tsx` | App Routes | REQUIRED | — | — | false | false | — | 2 | HIGH | 1341 |
| `app/(platform)/user/[username]/followers/loading.tsx` | App Routes | REQUIRED | useParams | — | false | false | — | 1 | HIGH | 390 |
| `app/(platform)/user/[username]/following/loading.tsx` | App Routes | REQUIRED | useParams | — | false | false | — | 1 | HIGH | 390 |
| `app/(platform)/user/[username]/loading.tsx` | App Routes | REQUIRED | useState,useEffect | window | false | false | — | 2 | HIGH | 3161 |
| `app/(platform)/wallet/bank-account/error.tsx` | Wallet | REQUIRED | — | — | false | true | — | 1 | HIGH | 313 |
| `app/(platform)/wallet/bank-accounts/error.tsx` | Wallet | REQUIRED | — | window | false | true | — | 0 | HIGH | 1424 |
| `app/(platform)/wallet/error.tsx` | Wallet | REQUIRED | — | — | false | true | — | 1 | HIGH | 466 |
| `app/(platform)/wallet/locked/error.tsx` | Wallet | REQUIRED | — | — | false | true | — | 1 | HIGH | 569 |
| `app/(platform)/wallet/payment-methods/error.tsx` | Wallet | REQUIRED | — | window | false | true | — | 0 | HIGH | 2288 |
| `app/(platform)/wallet/pending/error.tsx` | Wallet | REQUIRED | — | — | false | true | — | 1 | HIGH | 700 |
| `app/(platform)/wallet/processing/error.tsx` | Wallet | REQUIRED | — | — | false | true | — | 1 | HIGH | 577 |
| `app/(platform)/wallet/transactions/error.tsx` | Wallet | REQUIRED | — | — | false | true | — | 1 | HIGH | 589 |
| `app/(platform)/wallet/withdraw/error.tsx` | Wallet | REQUIRED | — | — | false | false | — | 1 | HIGH | 428 |
| `app/error.tsx` | App Routes | REQUIRED | — | — | false | true | — | 1 | HIGH | 517 |
| `app/global-error.tsx` | App Routes | REQUIRED | — | — | false | true | — | 1 | HIGH | 669 |
| `archive/homepages/AuctionsSection.tsx` | Archive | PROBABLY REMOVABLE | — | — | false | false | — | 0 | LOW | 111 |
| `archive/homepages/BringYourItemsBanner.tsx` | Archive | PROBABLY REMOVABLE | — | — | false | false | — | 0 | LOW | 2003 |
| `archive/homepages/HomeBenefitsRail.tsx` | Archive | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1160 |
| `archive/homepages/HomeCategoryRail.tsx` | Archive | REQUIRED | useMemo,useCallback,usePathname | navigator | false | true | — | 1 | HIGH | 4284 |
| `archive/homepages/HomeContent.tsx` | Archive | PROBABLY REMOVABLE | — | — | false | false | — | 0 | LOW | 4889 |
| `archive/homepages/HomePromoBanner.tsx` | Archive | REQUIRED | useState,useRef,useCallback | — | false | true | — | 2 | HIGH | 3447 |
| `archive/homepages/HomeRecentlyViewedCarousel.tsx` | Archive | REQUIRED | useState,useEffect | — | false | false | — | 0 | HIGH | 1836 |
| `archive/homepages/HomeSecondaryBanners.tsx` | Archive | PROBABLY REMOVABLE | — | — | false | false | — | 0 | LOW | 1139 |
| `archive/homepages/MobileHeaderScrollContext.tsx` | Archive | REQUIRED | useState,useLayoutEffect,useRef,useContext,useMemo,useCallback | window,document,ResizeObserver,matchMedia,EventListeners | true | false | — | 1 | HIGH | 3793 |
| `archive/homepages/PopularListingsGrid.tsx` | Archive | REQUIRED | useEffect,useRef | EventListeners | false | false | — | 1 | HIGH | 2738 |
| `archive/homepages/ProductCarouselSection.tsx` | Archive | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 3111 |
| `archive/homepages/QuickFiltersRail.tsx` | Archive | PROBABLY REMOVABLE | — | — | false | false | — | 0 | LOW | 1491 |
| `archive/premium/BenefitsSection.tsx` | Archive | PROBABLY REQUIRED | — | Animation | false | false | framer-motion | 0 | HIGH | 2280 |
| `archive/premium/BringYourItemCta.tsx` | Archive | PROBABLY REMOVABLE | — | — | false | false | — | 0 | LOW | 552 |
| `archive/premium/BringYourItemLanding.tsx` | Archive | PROBABLY REMOVABLE | — | — | false | false | — | 0 | LOW | 787 |
| `archive/premium/BusinessSection.tsx` | Archive | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 2628 |
| `archive/premium/DealsSection.tsx` | Archive | PROBABLY REMOVABLE | — | — | false | false | — | 0 | LOW | 603 |
| `archive/premium/ImportListingBanner.tsx` | Archive | PROBABLY REQUIRED | — | Animation | false | false | framer-motion | 0 | HIGH | 1858 |
| `archive/premium/LatestListings.tsx` | Archive | PROBABLY REMOVABLE | — | — | false | false | — | 0 | LOW | 534 |
| `archive/premium/ListingGrid.tsx` | Archive | PROBABLY REMOVABLE | — | — | false | false | — | 0 | LOW | 424 |
| `archive/premium/PopularListings.tsx` | Archive | PROBABLY REMOVABLE | — | — | false | false | — | 0 | LOW | 532 |
| `archive/premium/PremiumButton.tsx` | Archive | PROBABLY REQUIRED | — | Animation | false | false | framer-motion | 0 | HIGH | 2083 |
| `archive/premium/PremiumHero.tsx` | Archive | PROBABLY REQUIRED | — | Animation | false | false | framer-motion | 0 | HIGH | 5383 |
| `archive/premium/TrendingListings.tsx` | Archive | PROBABLY REMOVABLE | — | — | false | false | — | 0 | LOW | 529 |
| `components/analytics/GoogleAnalytics.tsx` | Other/Shared | REQUIRED | useSyncExternalStore | window,EventListeners | false | false | — | 3 | HIGH | 1621 |
| `components/analytics/GoogleAnalyticsPageView.tsx` | Other/Shared | REQUIRED | useEffect,useRef,usePathname,useSearchParams | — | false | false | — | 0 | HIGH | 985 |
| `components/analytics/GoogleAnalyticsQueuedEvents.tsx` | Other/Shared | REQUIRED | useEffect | document | false | false | — | 0 | HIGH | 1136 |
| `components/analytics/VisitorPresenceBeacon.tsx` | Other/Shared | REQUIRED | useEffect | window,document,navigator,sessionStorage | false | false | — | 1 | HIGH | 1739 |
| `components/auth/AuthBackButton.tsx` | Auth | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 838 |
| `components/auth/AuthIconInput.tsx` | Auth | REQUIRED | useState | — | false | true | — | 0 | HIGH | 2586 |
| `components/auth/AuthInput.tsx` | Auth | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 133 |
| `components/auth/AuthPasswordInput.tsx` | Auth | REQUIRED | useState | — | false | true | — | 0 | HIGH | 3789 |
| `components/auth/AuthRouteLayout.tsx` | Auth | REQUIRED | usePathname | — | false | false | — | 0 | HIGH | 730 |
| `components/auth/Checkbox.tsx` | Auth | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 736 |
| `components/auth/PasswordInput.tsx` | Auth | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 170 |
| `components/auth/RovexoSignOutLink.tsx` | Auth | REQUIRED | useRouter,useTransition | — | false | true | — | 1 | HIGH | 1053 |
| `components/auth/SocialButton.tsx` | Auth | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 120 |
| `components/auth/SocialLogin.tsx` | Auth | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 563 |
| `components/beta/BetaAppShell.tsx` | Other/Shared | REQUIRED | usePathname | — | false | false | — | 2 | HIGH | 1996 |
| `components/brand/RovexoAppIconMark.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 760 |
| `components/brand/RovexoLogo.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 3135 |
| `components/brand/RovexoWordmark.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 921 |
| `components/branding/CanonicalRx3dSplashGate.tsx` | Other/Shared | REQUIRED | useEffect,useRouter | window | false | false | — | 1 | HIGH | 753 |
| `components/branding/CanonicalRx3dSplashVisual.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 909 |
| `components/buyer/BuyerAddresses.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1436 |
| `components/buyer/BuyerDashboard.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 6 | MEDIUM | 3817 |
| `components/buyer/BuyerHeader.tsx` | Chrome/Nav | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 2021 |
| `components/buyer/BuyerHero.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 362 |
| `components/buyer/BuyerLogout.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 155 |
| `components/buyer/BuyerMessages.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 1523 |
| `components/buyer/BuyerNotifications.tsx` | Notifications | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1158 |
| `components/buyer/BuyerOrderHistory.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 1483 |
| `components/buyer/BuyerOrders.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 2206 |
| `components/buyer/BuyerPayments.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 1113 |
| `components/buyer/BuyerProfileCard.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 1441 |
| `components/buyer/BuyerProtection.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 1001 |
| `components/buyer/BuyerQuickActions.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 721 |
| `components/buyer/BuyerRecentlyViewed.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 978 |
| `components/buyer/BuyerReviews.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 1098 |
| `components/buyer/BuyerSavedListings.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 1004 |
| `components/buyer/BuyerSection.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 802 |
| `components/buyer/BuyerSecurity.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 1040 |
| `components/buyer/BuyerSettings.tsx` | Settings | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 761 |
| `components/buyer/BuyerStatistics.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1074 |
| `components/buyer/BuyerSupport.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 1044 |
| `components/buyer/BuyerTrustCard.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 455 |
| `components/celebration/CelebrationAnimation.tsx` | Other/Shared | REQUIRED | useState,useEffect,useRef | window,matchMedia,Canvas,Animation,EventListeners | false | false | — | 0 | HIGH | 7437 |
| `components/empty-state/TeddyAnimation.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 630 |
| `components/empty-state/TeddyEmptyState.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 655 |
| `components/errors/ForbiddenBackButton.tsx` | Other/Shared | REQUIRED | useRouter | window | false | true | — | 0 | HIGH | 863 |
| `components/fail-closed/FailClosedBoundary.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1312 |
| `components/fail-closed/FailClosedPanel.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 1880 |
| `components/follow/FollowButton.tsx` | Other/Shared | REQUIRED | useState,useRef,useCallback,useRouter,useTransition | window | false | true | — | 0 | HIGH | 5385 |
| `components/Header.tsx` | Chrome/Nav | REQUIRED | useLayoutEffect,useRef | — | false | false | — | 6 | HIGH | 3937 |
| `components/header/HeaderBringYourItemCta.tsx` | Chrome/Nav | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 819 |
| `components/header/HeaderCategoryBar.tsx` | Chrome/Nav | REQUIRED | useEffect,useRef,usePathname | EventListeners | false | false | — | 1 | HIGH | 2677 |
| `components/header/HeaderProfileLink.tsx` | Chrome/Nav | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 1171 |
| `components/header/HeaderSearchBar.tsx` | Chrome/Nav | PROBABLY REQUIRED | — | — | false | true | — | 2 | HIGH | 1330 |
| `components/header/HomepageHeaderShareButton.tsx` | Chrome/Nav | REQUIRED | useState,useEffect,useRef,useCallback,useId | window,navigator,Clipboard | false | true | — | 1 | HIGH | 11719 |
| `components/header/NotificationsBellLink.tsx` | Notifications | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 532 |
| `components/header/RovexoHeaderV2.tsx` | Chrome/Nav | REQUIRED | useState,useEffect,useRef | window,EventListeners | false | false | — | 2 | HIGH | 3676 |
| `components/header/RvxTopBar.tsx` | Chrome/Nav | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1124 |
| `components/home/HomeCategoryIconImage.tsx` | Homepage | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 958 |
| `components/home/HomepageHeader.tsx` | Homepage | REQUIRED | useState,useEffect,useLayoutEffect,useRef | window,EventListeners | false | false | — | 6 | HIGH | 3976 |
| `components/home/HomepageSearchField.tsx` | Homepage | REQUIRED | useRef,useRouter | — | false | true | — | 0 | HIGH | 2264 |
| `components/home/HomePageShell.tsx` | Homepage | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 324 |
| `components/home/hooks/useInfiniteCarousel.ts` | Homepage | REQUIRED | useEffect,useLayoutEffect,useRef,useCallback | window,ResizeObserver,matchMedia,Animation,EventListeners | false | false | — | 0 | HIGH | 14746 |
| `components/home/hooks/useMarketplaceFeedColumns.ts` | Homepage | REQUIRED | useState,useEffect | window,matchMedia,EventListeners | false | false | — | 0 | HIGH | 823 |
| `components/home/hooks/useVirtualizedFeedWindow.ts` | Homepage | REQUIRED | useState,useEffect | window,ResizeObserver,EventListeners | false | false | — | 0 | HIGH | 3254 |
| `components/home/ImageSearchCamera.tsx` | Homepage | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1865 |
| `components/home/MobileHeaderScrollContext.tsx` | Homepage | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 394 |
| `components/home/ProductSectionStates.tsx` | Homepage | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1921 |
| `components/home/RovexoAllListings.tsx` | Homepage | REQUIRED | useState,useEffect,useRef,useCallback | IntersectionObserver | false | false | — | 3 | HIGH | 4124 |
| `components/home/RovexoAllListingsGrid.tsx` | Homepage | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 718 |
| `components/home/RovexoBringYourItemCta.tsx` | Homepage | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 916 |
| `components/home/RovexoCategoryCard.tsx` | Homepage | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 790 |
| `components/home/RovexoCategoryRail.tsx` | Homepage | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 786 |
| `components/home/RovexoFooterNavigation.tsx` | Homepage | REQUIRED | usePathname | — | false | false | — | 4 | HIGH | 5649 |
| `components/home/RovexoMobileHeaderScrollContext.tsx` | Homepage | REQUIRED | useState,useLayoutEffect,useRef,useContext,useMemo,useCallback,usePathname | window,document,ResizeObserver,matchMedia,EventListeners | true | false | — | 1 | HIGH | 4468 |
| `components/home/RovexoShowcaseRails.tsx` | Homepage | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 661 |
| `components/home/RovexoShowcaseSection.tsx` | Homepage | NOT VERIFIED | — | — | false | false | — | 3 | MEDIUM | 3584 |
| `components/home/stores/StoreCard.tsx` | Homepage | PROBABLY REQUIRED | useCallback | — | false | true | — | 3 | HIGH | 3619 |
| `components/home/stores/StoresHeader.tsx` | Homepage | PROBABLY REQUIRED | useId | — | false | false | — | 1 | MEDIUM | 2620 |
| `components/home/stores/StoresSection.tsx` | Homepage | PROBABLY REQUIRED | useMemo | — | false | false | — | 2 | MEDIUM | 1281 |
| `components/homepage-v3/HomepageV3.tsx` | Homepage | NOT VERIFIED | — | — | false | false | — | 6 | MEDIUM | 1939 |
| `components/homepage-v3/HomepageV3BringYourItem.tsx` | Homepage | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 701 |
| `components/homepage-v3/HomepageV3CategoryRail.tsx` | Homepage | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 539 |
| `components/homepage-v3/HomepageV3Feed.tsx` | Homepage | REQUIRED | useState,useEffect,useRef,useMemo,useCallback | IntersectionObserver | false | false | — | 2 | HIGH | 4225 |
| `components/homepage-v3/HomepageV3Header.tsx` | Homepage | REQUIRED | useState,useEffect,useLayoutEffect,useRef | window,EventListeners | false | false | — | 4 | HIGH | 3087 |
| `components/homepage-v3/HomepageV3ListingRail.tsx` | Homepage | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1609 |
| `components/homepage-v3/HomepageV3Search.tsx` | Homepage | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 301 |
| `components/homepage-v3/HomepageV3Showcase.tsx` | Homepage | NOT VERIFIED | — | — | false | false | — | 3 | MEDIUM | 3668 |
| `components/homepage-v4/HomepageV4.tsx` | Homepage | PROBABLY REQUIRED | useMemo | — | false | false | — | 4 | MEDIUM | 1198 |
| `components/homepage-v4/HomepageV4BringYourItem.tsx` | Homepage | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 964 |
| `components/homepage-v4/HomepageV4CategoryRail.tsx` | Homepage | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 646 |
| `components/homepage-v4/HomepageV4Featured.tsx` | Homepage | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1127 |
| `components/homepage-v4/HomepageV4Feed.tsx` | Homepage | REQUIRED | useState,useEffect,useRef,useMemo,useCallback | IntersectionObserver | false | false | — | 2 | HIGH | 4375 |
| `components/homepage-v4/HomepageV4Header.tsx` | Homepage | REQUIRED | useState,useEffect,useLayoutEffect,useRef | window,EventListeners | false | false | — | 4 | HIGH | 3143 |
| `components/homepage-v4/HomepageV4Search.tsx` | Homepage | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 301 |
| `components/homepage-v4/HomepageV4Showcase.tsx` | Homepage | NOT VERIFIED | — | — | false | false | — | 3 | MEDIUM | 3272 |
| `components/homepage/canonical/CanonicalCategoryRail.tsx` | Homepage | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 849 |
| `components/homepage/canonical/CanonicalHomepage.tsx` | Homepage | PROBABLY REQUIRED | useMemo | — | false | false | — | 4 | MEDIUM | 1770 |
| `components/homepage/canonical/CanonicalMarketplaceFeed.tsx` | Homepage | REQUIRED | useState,useEffect,useRef,useMemo,useCallback | IntersectionObserver | false | false | — | 3 | HIGH | 8655 |
| `components/homepage/canonical/featured-store/FeaturedStoreHeader.tsx` | Homepage | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 2032 |
| `components/homepage/canonical/featured-store/FeaturedStoreSection.tsx` | Homepage | PROBABLY REQUIRED | useMemo | — | false | false | — | 3 | MEDIUM | 3835 |
| `components/homepage/canonical/featured-store/ShowcaseViewAllCard.tsx` | Homepage | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1123 |
| `components/homepage/canonical/featured-store/StoreProfileCard.tsx` | Homepage | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1362 |
| `components/homepage/canonical/HomepageEmptyState.tsx` | Homepage | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1437 |
| `components/icons/BottomNavIcon3D.tsx` | Chrome/Nav | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2362 |
| `components/icons/CategoryIcon3D.tsx` | Other/Shared | PROBABLY REQUIRED | useId | — | false | false | — | 0 | MEDIUM | 8778 |
| `components/icons/DashboardIcon3D.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1641 |
| `components/icons/HomeCategoryIcon3D.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1993 |
| `components/icons/HubSectionIcon.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1306 |
| `components/icons/ModuleIcon.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 563 |
| `components/icons/PremiumNavIcon.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2082 |
| `components/icons/RovexoGlassIcon.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 374 |
| `components/icons/RovexoIcon.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1411 |
| `components/layout/AppChromeScrollProvider.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 458 |
| `components/layout/AppShellLayout.tsx` | Other/Shared | REQUIRED | usePathname | — | false | false | — | 1 | HIGH | 2571 |
| `components/layout/AuthChromeDeferred.tsx` | Other/Shared | REQUIRED | usePathname | — | false | false | — | 0 | HIGH | 1883 |
| `components/layout/CanonicalPageShell.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 4 | HIGH | 1901 |
| `components/layout/HubPageMain.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 765 |
| `components/layout/PlatformChromeProviders.tsx` | Chrome/Nav | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 640 |
| `components/layout/UniversalUiBoundary.tsx` | Other/Shared | REQUIRED | usePathname | — | false | false | — | 0 | HIGH | 701 |
| `components/legal/CookieConsentBanner.tsx` | Other/Shared | REQUIRED | useSyncExternalStore | window,localStorage,EventListeners | false | true | — | 0 | HIGH | 3002 |
| `components/listing/ListingAttributeIcon.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 500 |
| `components/listing/ListingAttributeLabel.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1339 |
| `components/listing/ListingAttributeRow.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 2 | HIGH | 3089 |
| `components/listing/ListingAttributeValue.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 835 |
| `components/navigation/CanonicalPageHeader.tsx` | Chrome/Nav | PROBABLY REQUIRED | — | — | false | true | — | 2 | HIGH | 2112 |
| `components/navigation/NavigationPathRecorder.tsx` | Other/Shared | REQUIRED | useEffect,useRef,usePathname | sessionStorage | false | false | — | 0 | HIGH | 544 |
| `components/navigation/PageBack.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1469 |
| `components/navigation/RovexoHeaderCloseButton.tsx` | Chrome/Nav | REQUIRED | useRouter | window | false | true | — | 0 | HIGH | 1547 |
| `components/NotificationBell.tsx` | Notifications | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1225 |
| `components/preview/Run3PadPreviewGate.tsx` | Other/Shared | REQUIRED | useState,useEffect,useCallback | window,document,localStorage,EventListeners | false | true | — | 0 | HIGH | 5208 |
| `components/preview/Run3PreviewHub.tsx` | Other/Shared | REQUIRED | useEffect | — | false | false | — | 1 | HIGH | 4016 |
| `components/preview/Run4InternalPadGate.tsx` | Other/Shared | REQUIRED | useState,useEffect,useCallback,usePathname | window,document,localStorage,EventListeners | false | true | — | 0 | HIGH | 6206 |
| `components/preview/Run4InternalPreviewHub.tsx` | Other/Shared | REQUIRED | useEffect | — | false | false | — | 1 | HIGH | 4595 |
| `components/profile/ProfileFooterBanner.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1302 |
| `components/promotions/cards-v1/PromotionCardsPage.tsx` | Other/Shared | REQUIRED | useState | — | false | true | — | 1 | HIGH | 2093 |
| `components/promotions/cards-v1/PromotionListingPicker.tsx` | Other/Shared | REQUIRED | useState,useCallback | window | false | true | — | 2 | HIGH | 6953 |
| `components/promotions/cards-v1/PromotionPackagePicker.tsx` | Other/Shared | REQUIRED | useState,useCallback | window | false | true | — | 1 | HIGH | 5030 |
| `components/promotions/cards-v1/PromotionPaymentMethodSelector.tsx` | Other/Shared | REQUIRED | useState,useEffect | — | false | true | — | 0 | HIGH | 5852 |
| `components/promotions/cards-v1/PromotionPreview.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 882 |
| `components/promotions/PromotionAnalyticsBeacon.tsx` | Other/Shared | REQUIRED | useEffect | — | false | false | — | 0 | HIGH | 870 |
| `components/promotions/PromotionRealtimeRefresher.tsx` | Other/Shared | REQUIRED | useEffect,useRef,useRouter | — | false | false | — | 0 | HIGH | 1081 |
| `components/providers/PageVisibilityProvider.tsx` | Other/Shared | REQUIRED | useEffect | document | false | false | — | 0 | HIGH | 750 |
| `components/pwa/PwaProvider.tsx` | Other/Shared | REQUIRED | useState,useEffect | window,navigator,EventListeners | false | true | — | 0 | HIGH | 3326 |
| `components/runtime/ChunkLoadRecovery.tsx` | Other/Shared | REQUIRED | useEffect | window,navigator,sessionStorage,EventListeners | false | false | — | 0 | HIGH | 3991 |
| `components/sell/PublishingOverlay.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1904 |
| `components/sell/PublishSuccessDialog.tsx` | Other/Shared | REQUIRED | useState,useCallback,useRouter | window | false | true | — | 3 | HIGH | 6083 |
| `components/share/ShareListingSheet.tsx` | Other/Shared | REQUIRED | useState,useEffect,useCallback | window,document,navigator,matchMedia,Clipboard,EventListeners | false | true | — | 1 | HIGH | 11318 |
| `components/store/StoreUnavailablePage.tsx` | Other/Shared | REQUIRED | useRouter | window | false | true | — | 0 | HIGH | 1355 |
| `components/ui/Avatar.tsx` | UI Shared | REQUIRED | useState | — | false | true | — | 1 | HIGH | 2221 |
| `components/ui/BottomNavigation.tsx` | Chrome/Nav | REQUIRED | useEffect,useRouter,usePathname | — | false | true | — | 4 | HIGH | 8180 |
| `components/ui/BottomNavV2Icon.tsx` | Chrome/Nav | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1532 |
| `components/ui/Checkbox.tsx` | UI Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 633 |
| `components/ui/Dialog.tsx` | UI Shared | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1216 |
| `components/ui/ListingCard.tsx` | Listing | REQUIRED | useState,useEffect,useCallback,useRouter | — | false | true | — | 6 | HIGH | 15778 |
| `components/ui/ModalContainer.tsx` | UI Shared | REQUIRED | useEffect,useRef | window,EventListeners | false | true | — | 2 | HIGH | 4885 |
| `components/ui/motion.tsx` | UI Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 862 |
| `components/ui/NativeImageFileInput.tsx` | UI Shared | PROBABLY REQUIRED | — | FileUpload | false | true | — | 0 | HIGH | 1490 |
| `components/ui/Pagination.tsx` | UI Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1249 |
| `components/ui/PremiumEmptyStateImage.tsx` | UI Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1263 |
| `components/ui/PrimaryButton.tsx` | UI Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2530 |
| `components/ui/ProductRowImage.tsx` | UI Shared | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 1275 |
| `components/ui/Radio.tsx` | UI Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 571 |
| `components/ui/SafeImage.tsx` | UI Shared | REQUIRED | useState | — | false | true | — | 0 | HIGH | 3989 |
| `components/ui/ScrollContainer.tsx` | UI Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1595 |
| `components/ui/SearchBar.tsx` | UI Shared | REQUIRED | useState,useEffect,useRef,useMemo,useCallback,useId | window,document,EventListeners | false | true | — | 3 | HIGH | 19698 |
| `components/ui/Select.tsx` | UI Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 441 |
| `components/ui/SkeletonFade.tsx` | UI Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1451 |
| `components/ui/Tabs.tsx` | UI Shared | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 1095 |
| `components/ui/Textarea.tsx` | UI Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 472 |
| `components/ui/Toast.tsx` | UI Shared | REQUIRED | useState,useContext,useMemo,useCallback | window | true | true | — | 0 | HIGH | 3464 |
| `features/account-canonical/header/AccountCanonicalHeader.tsx` | Profile | REQUIRED | useLayoutEffect,useRef | — | false | true | — | 3 | HIGH | 3756 |
| `features/account-canonical/MyAccountTemplate.tsx` | Profile | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1379 |
| `features/account-canonical/shell/AccountCanonicalShell.tsx` | Profile | PROBABLY REQUIRED | — | — | false | true | — | 4 | HIGH | 3824 |
| `features/account-center/components/AccountCanonicalProfile.tsx` | Profile | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 3019 |
| `features/account-center/components/AccountCenterDeleteButton.tsx` | Profile | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 423 |
| `features/account-center/components/AccountCenterHome.tsx` | Profile | NOT VERIFIED | — | — | false | false | — | 4 | MEDIUM | 2447 |
| `features/account-center/components/AccountCenterLogoutButton.tsx` | Profile | PROBABLY REQUIRED | useTransition | — | false | true | — | 1 | HIGH | 707 |
| `features/account-center/components/AccountCenterModulePage.tsx` | Profile | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 1736 |
| `features/account-center/components/AccountMenuSections.tsx` | Profile | REQUIRED | useState,useTransition | — | false | true | — | 6 | HIGH | 4539 |
| `features/account-center/components/AccountSellerPerformanceCard.tsx` | Profile | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1962 |
| `features/account-center/components/BuyingHubPage.tsx` | Profile | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 306 |
| `features/account-center/components/BuyingMenuSections.tsx` | Profile | NOT VERIFIED | — | — | false | false | — | 4 | MEDIUM | 2169 |
| `features/account-center/components/HolidayModeProfileRow.tsx` | Profile | REQUIRED | useState,useTransition | — | false | true | — | 3 | HIGH | 4415 |
| `features/account-center/components/MasterMenuIcon.tsx` | Profile | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1500 |
| `features/account-center/components/MessagesHubPage.tsx` | Profile | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 1666 |
| `features/account-center/components/RecentlyViewedPage.tsx` | Profile | REQUIRED | useState,useEffect | — | false | false | — | 1 | HIGH | 2099 |
| `features/account-center/components/SellingMenuSections.tsx` | Profile | NOT VERIFIED | — | — | false | false | — | 4 | MEDIUM | 2178 |
| `features/account-center/components/VerificationHubPage.tsx` | Profile | REQUIRED | — | window | false | true | — | 2 | HIGH | 2375 |
| `features/account-center/hooks/useAccountHubLive.ts` | Profile | REQUIRED | useState,useEffect,useRef,useCallback | window,document,EventListeners | false | false | — | 0 | HIGH | 4422 |
| `features/account-module/components/BringYourItemPage.tsx` | Profile | REQUIRED | useState,useEffect,useRef,useMemo,useCallback,useRouter,useSearchParams | window | false | true | — | 3 | HIGH | 16720 |
| `features/account-module/components/DeleteAccountFlow.tsx` | Profile | REQUIRED | useState,useEffect,useRouter,useTransition | — | false | true | — | 1 | HIGH | 5725 |
| `features/account-module/components/PromotionToolEntryV1.tsx` | Profile | REQUIRED | useState | — | false | true | — | 1 | HIGH | 1722 |
| `features/account-module/components/PromotionToolsV1.tsx` | Profile | REQUIRED | useState,useMemo,useCallback | window | false | true | — | 3 | HIGH | 8223 |
| `features/account-module/components/ReviewsV1.tsx` | Profile | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 3542 |
| `features/account-module/components/RovexoIdeasPage.tsx` | Profile | REQUIRED | useState,useEffect,useRef,useMemo,useCallback,useRouter,useId,useTransition | window,navigator,IntersectionObserver,Clipboard | false | true | — | 2 | HIGH | 30401 |
| `features/account-module/components/SavedItemsV1.tsx` | Profile | REQUIRED | useState,useEffect,useRef,useCallback | IntersectionObserver | false | true | — | 1 | HIGH | 3541 |
| `features/account-module/components/SellerListingsV1.tsx` | Profile | REQUIRED | useState,useMemo,useCallback,useRouter,useSearchParams | window | false | true | — | 4 | HIGH | 14734 |
| `features/account-module/components/SettingsMenuIcon.tsx` | Profile | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1669 |
| `features/account-module/components/SettingsMenuSections.tsx` | Profile | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 1903 |
| `features/account-module/components/SettingsV1.tsx` | Profile | REQUIRED | useState,useSearchParams | window | false | true | — | 2 | HIGH | 1493 |
| `features/account/components/AccountBlockedUsersPage.tsx` | Profile | REQUIRED | useState,useEffect | — | false | true | react-hook-form | 1 | HIGH | 4933 |
| `features/account/components/AccountBuyerPreferencesPage.tsx` | Profile | REQUIRED | useState,useEffect | — | false | true | react-hook-form | 0 | HIGH | 7007 |
| `features/account/components/AccountCurrencyPage.tsx` | Profile | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1675 |
| `features/account/components/AccountDevicesPage.tsx` | Profile | REQUIRED | useState,useEffect | window,navigator | false | true | — | 2 | HIGH | 3484 |
| `features/account/components/AccountLanguagePage.tsx` | Profile | REQUIRED | useEffect,useRouter | — | false | false | — | 0 | HIGH | 312 |
| `features/account/components/AccountPrivacyPage.tsx` | Profile | REQUIRED | useState,useEffect,useRef,useCallback | window | false | true | — | 2 | HIGH | 7466 |
| `features/account/components/AccountSecurityPage.tsx` | Profile | REQUIRED | useState,useEffect | window,navigator | false | true | — | 3 | HIGH | 6190 |
| `features/account/components/AccountSecurityResetViaEmailPage.tsx` | Profile | REQUIRED | useActionState | — | false | false | — | 0 | HIGH | 2435 |
| `features/account/components/AccountSessionsPage.tsx` | Profile | REQUIRED | useState,useEffect | window | false | true | — | 2 | HIGH | 4316 |
| `features/account/components/AccountTimezonePage.tsx` | Profile | REQUIRED | useState,useEffect | — | false | true | react-hook-form | 0 | HIGH | 2762 |
| `features/account/components/AccountTwoFactorPage.tsx` | Profile | REQUIRED | useState,useEffect,useCallback | window,document,navigator,Clipboard | false | true | — | 2 | HIGH | 19088 |
| `features/account/components/addresses/AddressCard.tsx` | Profile | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 1681 |
| `features/account/components/addresses/AddressesPage.tsx` | Profile | REQUIRED | useState,useEffect,useRef,useRouter,useSearchParams | — | false | true | react-hook-form | 6 | HIGH | 15812 |
| `features/account/components/addresses/AddressesTabs.tsx` | Profile | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 1639 |
| `features/account/components/addresses/AddressForm.tsx` | Profile | PROBABLY REQUIRED | — | — | false | true | react-hook-form | 0 | HIGH | 5776 |
| `features/account/components/addresses/BusinessAddresses.tsx` | Profile | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1695 |
| `features/account/components/addresses/BusinessAddressForm.tsx` | Profile | PROBABLY REQUIRED | — | — | false | true | react-hook-form | 1 | HIGH | 6180 |
| `features/account/components/addresses/EditAddress.tsx` | Profile | REQUIRED | useState | — | false | true | — | 0 | HIGH | 2934 |
| `features/account/components/addresses/PersonalAddresses.tsx` | Profile | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1388 |
| `features/account/components/AvatarUploader.tsx` | Profile | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 583 |
| `features/account/components/CardSetupSheet.tsx` | Profile | REQUIRED | useState,useEffect,useRef,useCallback | — | false | true | @stripe/stripe-js | 0 | HIGH | 3983 |
| `features/account/components/CookiePreferencesPage.tsx` | Profile | REQUIRED | useState,useEffect,useRef,useCallback | window | false | true | — | 3 | HIGH | 4767 |
| `features/account/components/EmailChangeForm.tsx` | Profile | REQUIRED | useState | — | false | true | react-hook-form | 0 | HIGH | 1988 |
| `features/account/components/PasswordChangeForm.tsx` | Profile | REQUIRED | useState | — | false | true | react-hook-form | 0 | HIGH | 2285 |
| `features/account/components/ProfileEditPage.tsx` | Profile | REQUIRED | useState,useEffect,useRef,useCallback | window,localStorage,Animation | false | true | — | 1 | HIGH | 22754 |
| `features/admin/components/AdminPromotionsPage.tsx` | Admin | REQUIRED | useState,useMemo,useCallback | — | false | true | — | 1 | HIGH | 8735 |
| `features/admin/components/HelpAdminDashboard.tsx` | Admin | REQUIRED | useState | — | false | true | — | 0 | HIGH | 5426 |
| `features/admin/components/ModerationDashboard.tsx` | Admin | REQUIRED | useState,useEffect,useMemo,useCallback | — | false | true | — | 0 | HIGH | 12264 |
| `features/admin/components/MonetizationAdminDashboard.tsx` | Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1793 |
| `features/admin/components/PlatformAnalyticsDashboard.tsx` | Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1911 |
| `features/admin/components/ProductionOperationsDashboard.tsx` | Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 6714 |
| `features/admin/components/SellerPerformanceAdminDashboard.tsx` | Admin | REQUIRED | useState,useRouter | — | false | true | — | 0 | HIGH | 6521 |
| `features/admin/components/SeoAdminDashboard.tsx` | Admin | REQUIRED | useState | — | false | true | — | 0 | HIGH | 4314 |
| `features/admin/components/SeoAnalyticsDashboard.tsx` | Admin | REQUIRED | useState | — | false | true | — | 0 | HIGH | 6579 |
| `features/admin/components/SeoHealthCenter.tsx` | Admin | REQUIRED | useState | — | false | true | — | 0 | HIGH | 7873 |
| `features/admin/components/TrustAdminDashboard.tsx` | Admin | REQUIRED | useState,useRouter | — | false | true | — | 1 | HIGH | 6837 |
| `features/admin/components/TrustReviewActions.tsx` | Admin | REQUIRED | useState,useRouter | — | false | true | — | 0 | HIGH | 1109 |
| `features/analytics/components/AnalyticsDoughnutChart.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1342 |
| `features/analytics/components/AnalyticsExportSection.tsx` | Other/Shared | REQUIRED | — | window,document | false | true | — | 0 | HIGH | 3593 |
| `features/analytics/components/AnalyticsGeographicSection.tsx` | Other/Shared | REQUIRED | useState,useMemo | — | false | true | — | 0 | HIGH | 1620 |
| `features/analytics/components/AnalyticsHeader.tsx` | Chrome/Nav | REQUIRED | useState | — | false | true | — | 2 | HIGH | 2570 |
| `features/analytics/components/AnalyticsOverviewGrid.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 857 |
| `features/analytics/components/AnalyticsPromotionsSection.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1183 |
| `features/analytics/components/AnalyticsRangeAction.tsx` | Other/Shared | REQUIRED | useState | — | false | true | — | 1 | HIGH | 2412 |
| `features/analytics/components/AnalyticsRecentActivitySection.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 802 |
| `features/analytics/components/BusinessAnalyticsPage.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 6 | HIGH | 2749 |
| `features/analytics/components/SellerAnalyticsPage.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 7 | HIGH | 3063 |
| `features/analytics/hooks/use-analytics-data.ts` | Other/Shared | REQUIRED | useState,useCallback | — | false | false | — | 0 | HIGH | 1045 |
| `features/auth/components/AuthField.tsx` | Auth | REQUIRED | useState | — | false | true | — | 0 | HIGH | 2524 |
| `features/auth/components/AuthForm.tsx` | Auth | REQUIRED | useState,useActionState | — | false | true | — | 4 | HIGH | 4189 |
| `features/auth/components/AuthOAuthButtons.tsx` | Auth | PROBABLY REQUIRED | useTransition | — | false | true | — | 0 | HIGH | 5044 |
| `features/auth/components/AuthPasswordField.tsx` | Auth | REQUIRED | useState | — | false | true | — | 0 | HIGH | 2741 |
| `features/auth/components/AuthSelect.tsx` | Auth | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1155 |
| `features/auth/components/ForgotPasswordScreen.tsx` | Auth | REQUIRED | useState,useActionState | navigator | false | true | — | 0 | HIGH | 3861 |
| `features/auth/components/LoginRememberRow.tsx` | Auth | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 680 |
| `features/auth/components/LoginScreen.tsx` | Auth | REQUIRED | useState,useActionState | — | false | true | — | 1 | HIGH | 6230 |
| `features/auth/components/MfaChallengeScreen.tsx` | Auth | REQUIRED | useState,useEffect,useRouter | — | false | true | — | 0 | HIGH | 6545 |
| `features/auth/components/RegisterFields.tsx` | Auth | REQUIRED | useState,useMemo | — | false | true | — | 1 | HIGH | 5481 |
| `features/auth/components/RegisterScreen.tsx` | Auth | REQUIRED | useState,useActionState | — | false | true | — | 1 | HIGH | 8207 |
| `features/auth/components/RequireSuperAdmin.tsx` | Super Admin | REQUIRED | useEffect,useRouter | — | false | false | — | 1 | HIGH | 909 |
| `features/auth/components/ResetPasswordChecklist.tsx` | Auth | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 921 |
| `features/auth/components/ResetPasswordFields.tsx` | Auth | REQUIRED | useState | — | false | true | — | 1 | HIGH | 2140 |
| `features/auth/components/ResetPasswordScreen.tsx` | Auth | REQUIRED | useState,useMemo,useId,useActionState | navigator | false | true | — | 2 | HIGH | 8342 |
| `features/auth/components/ResetPasswordStrengthMeter.tsx` | Auth | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1154 |
| `features/auth/components/RoleGuard.tsx` | Auth | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 581 |
| `features/auth/components/SuperAdminGuard.tsx` | Super Admin | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 514 |
| `features/auth/components/VerifyEmailScreen.tsx` | Auth | REQUIRED | useState,useEffect,useRef,useRouter,useTransition | window | false | true | — | 0 | HIGH | 8686 |
| `features/auth/hooks/use-profile.ts` | Auth | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1062 |
| `features/auth/hooks/use-role.ts` | Auth | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 319 |
| `features/auth/hooks/use-super-admin.ts` | Super Admin | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 304 |
| `features/auth/providers/AuthProvider.tsx` | Auth | REQUIRED | useState,useEffect,useContext,useMemo,useCallback,usePathname | — | true | false | — | 0 | HIGH | 5441 |
| `features/auth/providers/AvatarProvider.tsx` | Auth | REQUIRED | useContext,useMemo | — | true | false | — | 1 | HIGH | 1368 |
| `features/bundle/BundleReviewPage.tsx` | Other/Shared | REQUIRED | useState,useCallback,useRouter | — | false | true | — | 6 | HIGH | 13755 |
| `features/bundle/GlobalStickyBundleBar.tsx` | Other/Shared | REQUIRED | usePathname | — | false | false | — | 1 | HIGH | 667 |
| `features/bundle/StickyBundleBar.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1502 |
| `features/business/dashboard/components/BusinessDashboardHeader.tsx` | Business | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 466 |
| `features/business/dashboard/components/BusinessMenuSections.tsx` | Business | NOT VERIFIED | — | — | false | false | — | 4 | MEDIUM | 2304 |
| `features/business/inventory/components/BusinessInventoryPage.tsx` | Business | REQUIRED | useSearchParams | — | false | false | — | 2 | HIGH | 2603 |
| `features/cart/components/CartCheckoutSheet.tsx` | Other/Shared | REQUIRED | useState,useMemo,useRouter | navigator | false | true | — | 3 | HIGH | 4302 |
| `features/cart/components/CartPage.tsx` | Other/Shared | REQUIRED | useState,useMemo,useCallback,useRouter | — | false | true | — | 4 | HIGH | 12565 |
| `features/checkout/components/BuyNowPublicErrorDialog.tsx` | Checkout | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1280 |
| `features/checkout/components/CheckoutDeliverySection.tsx` | Checkout | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 4451 |
| `features/checkout/components/CheckoutGuardBlocked.tsx` | Checkout | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1301 |
| `features/checkout/components/CheckoutPage.tsx` | Checkout | REQUIRED | useEffect,useRef,useRouter,useSearchParams | — | false | true | — | 6 | HIGH | 6490 |
| `features/checkout/components/CheckoutPageHeader.tsx` | Checkout | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1371 |
| `features/checkout/components/CheckoutPriceSummary.tsx` | Checkout | REQUIRED | useState,useId | — | false | true | — | 0 | HIGH | 1807 |
| `features/checkout/components/CheckoutProcessingOverlay.tsx` | Checkout | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 993 |
| `features/checkout/components/CheckoutProductSummary.tsx` | Checkout | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 3976 |
| `features/checkout/components/CheckoutReturnPolicy.tsx` | Checkout | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1168 |
| `features/checkout/components/CheckoutSuccessView.tsx` | Checkout | REQUIRED | useState,useEffect,useCallback,useRouter | — | false | true | — | 0 | HIGH | 4815 |
| `features/checkout/components/CheckoutWizardV1.tsx` | Checkout | REQUIRED | useState,useEffect,useMemo | — | false | true | — | 5 | HIGH | 16472 |
| `features/checkout/hooks/use-buy-now-navigation.ts` | Checkout | REQUIRED | useRef,useCallback | sessionStorage | false | false | — | 0 | HIGH | 5139 |
| `features/checkout/hooks/use-checkout-form.ts` | Checkout | REQUIRED | useState,useEffect,useRef,useMemo,useCallback,useRouter | window,navigator,sessionStorage | false | false | — | 0 | HIGH | 12550 |
| `features/command-centre/AdminCommandCentreShell.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 604 |
| `features/command-centre/CommandCentreLayout.tsx` | Other/Shared | REQUIRED | useState,useMemo,usePathname,useSyncExternalStore | — | false | true | — | 0 | HIGH | 10042 |
| `features/command-centre/SuperAdminPageHeader.tsx` | Super Admin | REQUIRED | usePathname | — | false | false | — | 0 | HIGH | 1088 |
| `features/commerce-ui/components/CheckoutLineItem.tsx` | Other/Shared | REQUIRED | useState | — | false | true | — | 1 | HIGH | 3013 |
| `features/commerce-ui/components/ParcelOperations.tsx` | Other/Shared | REQUIRED | useState | — | false | true | — | 0 | HIGH | 3212 |
| `features/commerce-ui/components/ParcelTrackingCard.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2833 |
| `features/dashboard/components/AnimatedCounter.tsx` | Other/Shared | REQUIRED | useState,useEffect | Animation | false | false | — | 1 | HIGH | 1118 |
| `features/dashboard/components/DashboardHeader.tsx` | Chrome/Nav | REQUIRED | useState | — | false | true | — | 2 | HIGH | 2498 |
| `features/dashboard/components/DashboardPerformanceSection.tsx` | Other/Shared | REQUIRED | useState,useMemo | — | false | true | — | 0 | HIGH | 3452 |
| `features/dashboard/components/DashboardQuickAccess.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 3 | MEDIUM | 1380 |
| `features/dashboard/components/DashboardSummaryGrid.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1149 |
| `features/dashboard/components/DashboardTile.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 2041 |
| `features/dashboard/components/LogoutButton.tsx` | Other/Shared | REQUIRED | useState,useTransition | — | false | true | — | 2 | HIGH | 1515 |
| `features/dashboard/components/ProfileCard.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 3904 |
| `features/header/HeaderProvider.tsx` | Chrome/Nav | REQUIRED | useMemo,usePathname | — | false | false | — | 0 | HIGH | 1967 |
| `features/header/hooks/use-header-badges.ts` | Chrome/Nav | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 512 |
| `features/help/components/DecisionTreeWizard.tsx` | Other/Shared | REQUIRED | useState,useEffect,useMemo,useRouter | — | false | true | — | 3 | HIGH | 4475 |
| `features/help/components/HelpArticlePage.tsx` | Other/Shared | REQUIRED | useEffect | — | false | false | — | 2 | HIGH | 5588 |
| `features/help/components/HelpAssistant.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 644 |
| `features/help/components/HelpCategoryHubPage.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2635 |
| `features/help/components/HelpCentrePage.tsx` | Other/Shared | REQUIRED | useState,useMemo | — | false | true | — | 1 | HIGH | 4317 |
| `features/help/components/HelpFaqPage.tsx` | Other/Shared | REQUIRED | useState,useMemo | — | false | true | — | 0 | HIGH | 1683 |
| `features/help/components/HelpPoliciesPage.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1336 |
| `features/help/components/HelpRelatedContent.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2255 |
| `features/help/components/HelpResolutionPrompt.tsx` | Other/Shared | REQUIRED | — | window | false | true | — | 1 | HIGH | 3171 |
| `features/help/components/HelpSolutionView.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 4083 |
| `features/home/components/FollowingFeedSection.tsx` | Other/Shared | REQUIRED | useState,useEffect,useRef,useRouter | window,navigator,IntersectionObserver,Clipboard | false | true | — | 5 | HIGH | 12221 |
| `features/home/hooks/use-product-watchlist.ts` | Other/Shared | REQUIRED | useState,useEffect,useCallback | — | false | false | — | 0 | HIGH | 2162 |
| `features/inbox/components/ConversationHub.tsx` | Messages | REQUIRED | useState,useEffect,useLayoutEffect,useRef,useMemo,useCallback,useRouter,useSearchParams,useId | window,document,navigator,EventListeners | false | true | — | 15 | HIGH | 80920 |
| `features/inbox/components/InboxPage.tsx` | Messages | REQUIRED | useState,useEffect,useLayoutEffect,useRef,useMemo,useCallback,useRouter,useSearchParams | window,navigator,IntersectionObserver,SupabaseRealtime,EventListeners | false | true | — | 7 | HIGH | 39819 |
| `features/inbox/components/PlatformFeeSheet.tsx` | Messages | REQUIRED | useEffect,useRef | window,EventListeners | false | true | — | 1 | HIGH | 3806 |
| `features/inbox/components/TransactionActionBar.tsx` | Messages | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 5345 |
| `features/inbox/components/TransactionStatusCard.tsx` | Messages | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 2588 |
| `features/inbox/hooks/use-owner-demo-mode.ts` | Messages | REQUIRED | useCallback,useSyncExternalStore | window,localStorage,EventListeners | false | false | — | 0 | HIGH | 1185 |
| `features/integrations-engine/IntegrationsEngineHub.tsx` | Other/Shared | REQUIRED | useState | — | false | true | — | 3 | HIGH | 7450 |
| `features/launch/components/RecordRecentlyViewed.tsx` | Other/Shared | REQUIRED | useEffect | — | false | false | — | 0 | HIGH | 449 |
| `features/legal/components/LegalDocumentCanonical.tsx` | Other/Shared | REQUIRED | — | document | false | false | — | 1 | HIGH | 575 |
| `features/legal/components/LegalDocumentPage.tsx` | Other/Shared | REQUIRED | — | document | false | false | — | 0 | HIGH | 1115 |
| `features/legal/components/LegalIndexCanonical.tsx` | Other/Shared | REQUIRED | — | document | false | false | — | 1 | HIGH | 1673 |
| `features/messages/hooks/use-chat-realtime.ts` | Other/Shared | REQUIRED | useEffect | document | false | false | — | 2 | HIGH | 6206 |
| `features/mobile-ui/components/MobileHubCard.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1995 |
| `features/mobile-ui/components/MobileHubFolderIcon.tsx` | Other/Shared | PROBABLY REQUIRED | useId | — | false | false | — | 0 | MEDIUM | 1956 |
| `features/mobile-ui/components/MobileHubNav.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 661 |
| `features/mobile-ui/components/MobileHubNavigator.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 1553 |
| `features/mobile-ui/components/MobileHubSections.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 3 | MEDIUM | 1777 |
| `features/mobile-ui/components/MobilePrimaryHubFolder.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1823 |
| `features/mobile-ui/components/MobilePrimaryHubs.tsx` | Other/Shared | REQUIRED | useState,useMemo | — | false | true | — | 4 | HIGH | 3612 |
| `features/mobile-ui/hooks/use-mobile-badges.ts` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1546 |
| `features/mobile-ui/hooks/use-mobile-hub-profile.ts` | Other/Shared | REQUIRED | useState,useEffect | — | false | false | — | 0 | HIGH | 3024 |
| `features/monetization/components/PlansPage.tsx` | Other/Shared | REQUIRED | useState,useRouter | window | false | true | — | 0 | HIGH | 4434 |
| `features/notifications/components/NotificationBell.tsx` | Notifications | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1220 |
| `features/notifications/components/NotificationSettingsPage.tsx` | Notifications | REQUIRED | useState,useEffect,useRef,useCallback | window | false | true | — | 3 | HIGH | 8436 |
| `features/notifications/components/PushPermissionPrompt.tsx` | Notifications | REQUIRED | useState,useEffect,useCallback | — | false | true | — | 2 | HIGH | 4683 |
| `features/notifications/components/PushSubscriptionManager.tsx` | Notifications | REQUIRED | useState,useEffect,useCallback,usePathname | window,document,EventListeners | false | true | — | 3 | HIGH | 7319 |
| `features/notifications/components/RealtimeNotificationProvider.tsx` | Notifications | REQUIRED | useState,useEffect,useContext,useMemo,useCallback,useRouter | window,document,navigator,EventListeners | true | false | — | 2 | HIGH | 13476 |
| `features/orders/components/BuyerCancelOrderCard.tsx` | Orders | REQUIRED | useState | window | false | true | — | 0 | HIGH | 2293 |
| `features/orders/components/BuyerOrderDetailCanonical.tsx` | Orders | REQUIRED | useState,useCallback | — | false | true | — | 4 | HIGH | 5380 |
| `features/orders/components/IssueResolutionLink.tsx` | Orders | REQUIRED | useState,useEffect | — | false | false | — | 0 | HIGH | 1223 |
| `features/orders/components/OrderActionsCard.tsx` | Orders | REQUIRED | — | window | false | true | — | 0 | HIGH | 1507 |
| `features/orders/components/OrderCheckoutConfirmation.tsx` | Orders | REQUIRED | useEffect,useRef,useRouter,useSearchParams | — | false | false | — | 0 | HIGH | 1048 |
| `features/orders/components/OrderDetailView.tsx` | Orders | REQUIRED | useState,useCallback | — | false | true | — | 5 | HIGH | 6915 |
| `features/orders/components/OrderReviewCard.tsx` | Orders | REQUIRED | useState,useEffect,useCallback,useRouter | window | false | true | — | 0 | HIGH | 4215 |
| `features/orders/components/OrdersListItem.tsx` | Orders | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 3157 |
| `features/orders/components/OrdersPage.tsx` | Orders | REQUIRED | useState,useEffect,useMemo,useRouter,useSearchParams | — | false | true | — | 2 | HIGH | 8987 |
| `features/orders/components/SellerFulfillmentCard.tsx` | Orders | REQUIRED | useState | window | false | true | — | 0 | HIGH | 2233 |
| `features/orders/components/SellerOrderFulfillment.tsx` | Orders | PROBABLY REQUIRED | — | — | false | true | — | 2 | HIGH | 1142 |
| `features/product-detail/AddedToCartToast.tsx` | Other/Shared | REQUIRED | useEffect,useRouter | window | false | true | — | 0 | HIGH | 1605 |
| `features/product-detail/AddToBundleSheet.tsx` | Other/Shared | REQUIRED | useState,useEffect | window,EventListeners | false | true | — | 1 | HIGH | 5555 |
| `features/product-detail/ProductActionBarV1.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 11231 |
| `features/product-detail/ProductDescriptionV1.tsx` | Other/Shared | REQUIRED | useState,useLayoutEffect,useRef | — | false | true | — | 0 | HIGH | 2712 |
| `features/product-detail/ProductDetailPage.tsx` | Other/Shared | REQUIRED | useState,useEffect,useMemo,useCallback,useRouter,usePathname | window | false | true | — | 15 | HIGH | 17027 |
| `features/product-detail/ProductFullscreenImageViewer.tsx` | Other/Shared | REQUIRED | useState,useEffect,useRef,useMemo,useCallback | document,EventListeners | false | true | — | 2 | HIGH | 9640 |
| `features/product-detail/ProductGalleryV1.tsx` | Other/Shared | REQUIRED | useState,useEffect,useRef,useMemo,useCallback | — | false | true | — | 2 | HIGH | 5576 |
| `features/product-detail/ProductInformationRows.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 2050 |
| `features/product-detail/ProductListingActionsMenu.tsx` | Other/Shared | REQUIRED | useState,useEffect,useRef,useCallback,useRouter | window,navigator,Clipboard,EventListeners | false | true | — | 1 | HIGH | 14233 |
| `features/product-detail/ProductPageChrome.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 3 | HIGH | 3143 |
| `features/product-detail/ProductQuantityStepper.tsx` | Other/Shared | REQUIRED | useState,useCallback,useId | — | false | true | — | 1 | HIGH | 3309 |
| `features/product-detail/ProductRecentlyViewed.tsx` | Other/Shared | REQUIRED | useState,useEffect | — | false | false | — | 1 | HIGH | 1710 |
| `features/product-detail/ProductReportDialog.tsx` | Other/Shared | REQUIRED | useState | — | false | true | — | 1 | HIGH | 3743 |
| `features/product-detail/ProductStockStatus.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1207 |
| `features/product-detail/ProductStoreSection.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 3158 |
| `features/product-detail/ProductViewsLive.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 820 |
| `features/product-detail/RecordProductViewBeacon.tsx` | Other/Shared | REQUIRED | useEffect,useRef | document,IntersectionObserver,EventListeners | false | false | — | 1 | HIGH | 3424 |
| `features/product-detail/SellerReportDialog.tsx` | Other/Shared | REQUIRED | useState | — | false | true | — | 1 | HIGH | 3097 |
| `features/product-detail/use-product-action-bar.ts` | Other/Shared | REQUIRED | useState,useEffect,useRef,useCallback | window | false | false | — | 0 | HIGH | 2668 |
| `features/product-detail/use-product-offer-negotiation.ts` | Other/Shared | REQUIRED | useState,useEffect,useMemo,useCallback | window | false | false | — | 0 | HIGH | 4659 |
| `features/profile/components/CanonicalProfileAvatar.tsx` | Other/Shared | REQUIRED | useState,useEffect,useRef,useCallback,useRouter,useId,useImperativeHandle | document,Canvas | false | true | — | 2 | HIGH | 11502 |
| `features/profile/components/FollowListLoadingShell.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 3 | MEDIUM | 1697 |
| `features/profile/components/FollowListPage.tsx` | Other/Shared | REQUIRED | useState,useEffect,useRef,useCallback,useTransition | — | false | true | — | 5 | HIGH | 8006 |
| `features/profile/components/ProfileAvatarEditor.tsx` | Other/Shared | REQUIRED | useRouter | — | false | true | — | 2 | HIGH | 1764 |
| `features/profile/components/ProfileBioEditor.tsx` | Other/Shared | REQUIRED | useState,useRouter | — | false | true | — | 1 | HIGH | 2431 |
| `features/profile/components/ProfileCommandCentreButton.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1849 |
| `features/profile/components/ViewProfilePage.tsx` | Other/Shared | REQUIRED | useState,useRef,useMemo,useCallback,useRouter,useTransition | window,navigator,Clipboard | false | true | — | 10 | HIGH | 35968 |
| `features/promote/components/StoreAnalytics.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1281 |
| `features/promote/components/StoreShowcase.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 2094 |
| `features/promote/components/StoreShowcaseCheckout.tsx` | Other/Shared | REQUIRED | useState | — | false | true | — | 1 | HIGH | 3314 |
| `features/promote/components/StoreShowcasePanel.tsx` | Other/Shared | REQUIRED | useState,useMemo | window | false | true | — | 4 | HIGH | 4489 |
| `features/promote/components/StoreShowcaseSuccess.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 1185 |
| `features/protection/components/ProtectionCaseActions.tsx` | Other/Shared | REQUIRED | useState,useRouter | — | false | true | — | 0 | HIGH | 2524 |
| `features/search/client.ts` | Search | NOT VERIFIED | — | — | false | false | — | 8 | MEDIUM | 1307 |
| `features/search/components/ImageSearchView.tsx` | Search | REQUIRED | useState,useEffect,useMemo,useRouter | — | false | true | — | 2 | HIGH | 12935 |
| `features/search/components/MarketplaceNoProductsEmpty.tsx` | Search | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 934 |
| `features/search/components/ProductResults.tsx` | Search | REQUIRED | useRef | — | false | true | — | 2 | HIGH | 1798 |
| `features/search/components/SavedSearchesPanel.tsx` | Search | REQUIRED | useState,useEffect | — | false | true | — | 0 | HIGH | 2596 |
| `features/search/components/SearchCategoryBrowseCard.tsx` | Search | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 2308 |
| `features/search/components/SearchFilters.tsx` | Search | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 6814 |
| `features/search/components/SearchInputActions.tsx` | Search | REQUIRED | useState,useEffect,useId | window,document | false | true | — | 2 | HIGH | 8246 |
| `features/search/components/SearchLandingClient.tsx` | Search | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 157 |
| `features/search/components/SearchLandingView.tsx` | Search | REQUIRED | useState,useEffect,useRef,useMemo,useCallback,useRouter | localStorage | false | true | — | 3 | HIGH | 10956 |
| `features/search/components/SearchLocationFilter.tsx` | Search | REQUIRED | useState,useCallback | — | false | true | — | 0 | HIGH | 2741 |
| `features/search/components/SearchOverlay.tsx` | Search | REQUIRED | useState,useEffect,useRef,useMemo,useCallback,useRouter,useId | window,document,Animation | false | true | — | 7 | HIGH | 16240 |
| `features/search/components/SearchProvider.tsx` | Search | REQUIRED | — | — | true | true | — | 2 | HIGH | 1294 |
| `features/search/components/SearchResultCard.tsx` | Search | REQUIRED | useState | — | false | true | — | 3 | HIGH | 8034 |
| `features/search/components/SearchResultsEmpty.tsx` | Search | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 595 |
| `features/search/components/SearchResultsView.tsx` | Search | REQUIRED | useState,useEffect,useRef,useMemo,useCallback,useRouter,useSearchParams,useTransition | — | false | true | — | 6 | HIGH | 10580 |
| `features/search/components/SearchScopeChips.tsx` | Search | REQUIRED | useRouter | — | false | true | — | 0 | HIGH | 1240 |
| `features/search/components/SearchSuggestionList.tsx` | Search | PROBABLY REQUIRED | useMemo | — | false | true | — | 2 | HIGH | 4339 |
| `features/search/components/SearchTypeaheadPanel.tsx` | Search | REQUIRED | useState,useEffect,useMemo,useCallback,useRouter | — | false | true | — | 5 | HIGH | 8924 |
| `features/search/components/SuggestedSearches.tsx` | Search | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 673 |
| `features/search/hooks/use-debounced-value.ts` | Search | REQUIRED | useState,useEffect | window | false | false | — | 1 | HIGH | 538 |
| `features/search/hooks/use-search-keyboard.ts` | Search | REQUIRED | useState,useCallback | window | false | false | — | 0 | HIGH | 1497 |
| `features/search/hooks/use-search-overlay-state.ts` | Search | REQUIRED | useState,useEffect,useMemo,useCallback,useRouter,usePathname | window | false | false | — | 0 | HIGH | 4293 |
| `features/search/hooks/use-search-overlay.tsx` | Search | REQUIRED | useContext | — | true | false | — | 0 | HIGH | 558 |
| `features/search/hooks/use-search-results.ts` | Search | REQUIRED | useState,useEffect,useRef,useCallback | — | false | false | — | 1 | HIGH | 4156 |
| `features/sell/components/FieldError.tsx` | Sell | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 366 |
| `features/sell/context/SellProvider.tsx` | Sell | REQUIRED | useState,useEffect,useRef,useContext,useMemo,useCallback,useRouter | window,document,EventListeners | true | false | — | 1 | HIGH | 46377 |
| `features/sell/hooks/use-sell-page-bottom-clearance.ts` | Sell | REQUIRED | useEffect | ResizeObserver | false | false | — | 0 | HIGH | 1457 |
| `features/sell/hooks/use-sell-progressive-flow.ts` | Sell | PROBABLY REQUIRED | useMemo,useCallback | — | false | false | — | 1 | MEDIUM | 2030 |
| `features/sell/hooks/useDraftListing.ts` | Sell | REQUIRED | useState,useCallback | — | false | false | — | 0 | HIGH | 944 |
| `features/sell/hooks/usePhotoUpload.ts` | Sell | PROBABLY REQUIRED | useCallback | — | false | false | — | 1 | MEDIUM | 647 |
| `features/sell/hooks/usePublishListing.ts` | Sell | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 842 |
| `features/sell/ui/DeletePhotoAction.tsx` | Sell | PROBABLY REQUIRED | — | Animation | false | true | — | 1 | HIGH | 1299 |
| `features/sell/ui/SellCategoryBlock.tsx` | Sell | REQUIRED | useState,useMemo,useDeferredValue | — | false | true | — | 4 | HIGH | 3327 |
| `features/sell/ui/SellCategoryPicker.tsx` | Sell | REQUIRED | useState,useEffect,useRef,useMemo | — | false | true | — | 4 | HIGH | 8143 |
| `features/sell/ui/SellCategorySuggestion.tsx` | Sell | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 1777 |
| `features/sell/ui/SellDescriptionBlock.tsx` | Sell | REQUIRED | useState,useEffect,useRef,useId | window,document | false | true | — | 1 | HIGH | 3781 |
| `features/sell/ui/SellOptionPicker.tsx` | Sell | REQUIRED | useState,useMemo | — | false | true | — | 3 | HIGH | 14441 |
| `features/sell/ui/SellPage.tsx` | Sell | REQUIRED | useState,useEffect,useRef,useCallback | window,document,EventListeners | false | true | — | 15 | HIGH | 9808 |
| `features/sell/ui/SellParcelBlock.tsx` | Sell | REQUIRED | useState,useMemo | window | false | true | — | 3 | HIGH | 7242 |
| `features/sell/ui/SellPhotoFileInput.tsx` | Sell | PROBABLY REQUIRED | — | FileUpload | false | true | — | 0 | HIGH | 1974 |
| `features/sell/ui/SellPhotoRail.tsx` | Sell | REQUIRED | useState,useEffect,useRef,useMemo,useCallback | window,document,matchMedia,DragDrop,EventListeners | false | true | — | 5 | HIGH | 13684 |
| `features/sell/ui/SellPickerLeadingMark.tsx` | Sell | REQUIRED | useState | — | false | true | — | 0 | HIGH | 6865 |
| `features/sell/ui/SellPricingBlock.tsx` | Sell | PROBABLY REQUIRED | useMemo,useId | — | false | true | — | 3 | HIGH | 2271 |
| `features/sell/ui/SellPrimitives.tsx` | Sell | PROBABLY REQUIRED | — | — | false | true | — | 2 | HIGH | 2955 |
| `features/sell/ui/SellProgressiveAttributes.tsx` | Sell | REQUIRED | useState,useMemo | — | false | true | — | 5 | HIGH | 8000 |
| `features/sell/ui/SellPublishBar.tsx` | Sell | REQUIRED | useSyncExternalStore | — | false | true | — | 1 | HIGH | 2257 |
| `features/sell/ui/SellStockQuantityBlock.tsx` | Sell | REQUIRED | useState,useId | — | false | true | — | 3 | HIGH | 2334 |
| `features/sell/ui/SellTitleBlock.tsx` | Sell | REQUIRED | useState,useEffect,useRef,useId | — | false | true | — | 1 | HIGH | 2968 |
| `features/seller-performance/components/SellerPerformanceFactorCard.tsx` | Sell | REQUIRED | useState,useId | — | false | true | — | 0 | HIGH | 1797 |
| `features/seller-performance/components/SellerPerformanceHistorySection.tsx` | Sell | REQUIRED | useState | — | false | true | — | 0 | HIGH | 2280 |
| `features/seller-performance/components/SellerPerformanceScoreMeter.tsx` | Sell | REQUIRED | useState,useEffect | window,Animation | false | false | — | 1 | HIGH | 2210 |
| `features/seller/compliance/ComplianceDashboard.tsx` | Sell | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 11776 |
| `features/seller/listings/components/PromotionPicker.tsx` | Sell | REQUIRED | useState,useEffect,useRef | window,EventListeners | false | true | — | 1 | HIGH | 4687 |
| `features/seller/listings/components/RestockListingDialog.tsx` | Sell | REQUIRED | useState,useId | — | false | true | — | 0 | HIGH | 4036 |
| `features/seller/listings/components/SellerListingOverflowMenu.tsx` | Sell | REQUIRED | useState,useEffect,useLayoutEffect,useRef,useMemo,useCallback,useId | window,document,Animation,EventListeners | false | true | — | 1 | HIGH | 6454 |
| `features/seller/marketplace/components/MarketplaceConnectorCard.tsx` | Sell | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 1171 |
| `features/seller/marketplace/components/MarketplaceConnectorSettingsModal.tsx` | Sell | REQUIRED | useState,useEffect,useRef | window,EventListeners | false | true | — | 1 | HIGH | 8671 |
| `features/seller/marketplace/components/MarketplaceConnectorsPage.tsx` | Sell | REQUIRED | useState,useMemo,useCallback,useRouter | — | false | true | — | 1 | HIGH | 5286 |
| `features/seller/marketplace/hooks/use-marketplace-connectors.ts` | Sell | REQUIRED | useState,useEffect,useCallback | — | false | false | — | 0 | HIGH | 3051 |
| `features/seller/migration/components/HeroSlideVisual.tsx` | Sell | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 824 |
| `features/seller/migration/components/inline/MigrationImportProgressPanel.tsx` | Sell | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 3009 |
| `features/seller/migration/components/inline/MigrationInlinePreviewPanel.tsx` | Sell | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 3306 |
| `features/seller/migration/components/inline/MigrationItemReviewPanel.tsx` | Sell | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 4963 |
| `features/seller/migration/components/inline/MigrationValidationList.tsx` | Sell | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1326 |
| `features/seller/migration/components/MigrationBulkPublishPanel.tsx` | Sell | REQUIRED | useState,useCallback | — | false | true | — | 1 | HIGH | 8225 |
| `features/seller/migration/components/MigrationCenterPage.tsx` | Sell | REQUIRED | useState,useEffect,useRef,useMemo,useCallback,useRouter,useSearchParams | window | false | true | — | 3 | HIGH | 9092 |
| `features/seller/migration/components/MigrationSourceFields.tsx` | Sell | PROBABLY REQUIRED | — | FileUpload | false | true | — | 0 | HIGH | 5347 |
| `features/seller/migration/components/MigrationStepIndicator.tsx` | Sell | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1362 |
| `features/seller/migration/components/steps/MigrationConnectStep.tsx` | Sell | PROBABLY REQUIRED | — | — | false | true | — | 2 | HIGH | 6411 |
| `features/seller/migration/components/steps/MigrationImportStep.tsx` | Sell | REQUIRED | useEffect | — | false | true | — | 4 | HIGH | 3405 |
| `features/seller/migration/components/steps/MigrationPlatformStep.tsx` | Sell | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 2191 |
| `features/seller/migration/components/steps/MigrationProgressStep.tsx` | Sell | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 454 |
| `features/seller/migration/components/steps/MigrationReportStep.tsx` | Sell | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 2996 |
| `features/seller/migration/components/StoreMigrationHeroBanner.tsx` | Sell | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1047 |
| `features/seller/migration/hooks/use-inline-import-preview.ts` | Sell | REQUIRED | useState,useEffect,useRef,useMemo,useCallback | window | false | false | — | 1 | HIGH | 5243 |
| `features/seller/migration/hooks/use-migration-poll.ts` | Sell | REQUIRED | useEffect,useRef,useCallback | — | false | false | — | 1 | HIGH | 1709 |
| `features/seller/migration/hooks/use-migration-publish-poll.ts` | Sell | REQUIRED | useEffect,useRef,useCallback | — | false | false | — | 1 | HIGH | 1814 |
| `features/seller/migration/hooks/use-migration-wizard.ts` | Sell | REQUIRED | useState,useMemo,useCallback | — | false | false | — | 3 | HIGH | 11477 |
| `features/seller/review-center/components/SellerReviewCasePage.tsx` | Sell | REQUIRED | useState,useEffect | — | false | true | — | 0 | HIGH | 7162 |
| `features/seller/review-center/components/SellerReviewCenterPage.tsx` | Sell | REQUIRED | useState,useEffect | — | false | false | — | 1 | HIGH | 3102 |
| `features/seller/tax/components/SellerTaxRegistrationPage.tsx` | Sell | REQUIRED | useState,useRouter | window | false | true | — | 0 | HIGH | 11059 |
| `features/settings/components/ConfirmDialog.tsx` | Settings | REQUIRED | useEffect,useRef | window,EventListeners | false | true | — | 1 | HIGH | 2362 |
| `features/settings/components/LanguagePicker.tsx` | Settings | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 287 |
| `features/settings/components/PreferenceToggleRow.tsx` | Settings | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 2601 |
| `features/settings/components/SettingToggle.tsx` | Settings | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 321 |
| `features/shipping/components/LabelCard.tsx` | Other/Shared | REQUIRED | useState,useRef | window,document | false | true | — | 1 | HIGH | 5560 |
| `features/shipping/components/ParcelCard.tsx` | Other/Shared | REQUIRED | useState,useCallback | — | false | true | — | 1 | HIGH | 5509 |
| `features/shipping/components/ShipmentSummary.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2313 |
| `features/shipping/components/ShipmentWizard.tsx` | Other/Shared | REQUIRED | useState,useMemo,useCallback | — | false | true | — | 2 | HIGH | 7684 |
| `features/shipping/components/ShippingCard.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1412 |
| `features/shipping/components/ShippingLabelViewer.tsx` | Other/Shared | REQUIRED | useState,useEffect,useRef,useCallback | window,document,navigator,EventListeners | false | true | — | 1 | HIGH | 13873 |
| `features/shipping/components/ShippingSummary.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1038 |
| `features/shipping/components/ShippingTrackingTimeline.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1715 |
| `features/shipping/components/TrackingCard.tsx` | Other/Shared | REQUIRED | useState | — | false | true | — | 0 | HIGH | 3081 |
| `features/shipping/ShippingEngineHub.tsx` | Other/Shared | REQUIRED | useSearchParams | — | false | false | — | 1 | HIGH | 8616 |
| `features/size/components/CustomSizeModal.tsx` | Other/Shared | REQUIRED | useState,useId | — | false | true | — | 0 | HIGH | 2965 |
| `features/size/components/SizeGuideModal.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 2072 |
| `features/size/components/SizeSelector.tsx` | Other/Shared | REQUIRED | useState,useRef,useMemo | window | false | true | — | 4 | HIGH | 7853 |
| `features/staff-enterprise/StaffEnterpriseShell.tsx` | Other/Shared | REQUIRED | useState,useEffect | navigator,FileUpload | false | true | — | 2 | HIGH | 14631 |
| `features/staff-enterprise/useStaffCall.ts` | Other/Shared | REQUIRED | useState,useEffect,useRef,useCallback | navigator | false | false | — | 0 | HIGH | 8812 |
| `features/staff-enterprise/useStaffMessages.ts` | Other/Shared | REQUIRED | useState,useEffect,useRef,useMemo,useCallback | window,navigator,FileUpload,EventListeners | false | false | — | 0 | HIGH | 7086 |
| `features/store/components/StoreVisitPageV2.tsx` | Other/Shared | REQUIRED | useState,useRef,useMemo,useCallback,useRouter | window,document,navigator,Clipboard | false | true | — | 8 | HIGH | 25037 |
| `features/super-admin/ai-engine/AiEngineAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | window,document | false | true | — | 1 | HIGH | 8908 |
| `features/super-admin/analytics-engine/AnalyticsEngineAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | window,document | false | true | — | 1 | HIGH | 10042 |
| `features/super-admin/app-studio/AppStudio.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | window,document | false | true | — | 2 | HIGH | 24458 |
| `features/super-admin/app-studio/AppStudioSimulator.tsx` | Super Admin | REQUIRED | useState | — | false | true | — | 0 | HIGH | 3715 |
| `features/super-admin/asset-manager/AssetManagerAdmin.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | — | false | true | — | 1 | HIGH | 10380 |
| `features/super-admin/audit-compliance/AuditComplianceCenterAdmin.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | — | false | true | — | 1 | HIGH | 10514 |
| `features/super-admin/certification-center/CertificationCenterAdmin.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | — | false | true | — | 1 | HIGH | 11216 |
| `features/super-admin/command-center-v1/CommandCenterLiveProvider.tsx` | Super Admin | REQUIRED | useState,useContext,useMemo,useCallback | — | true | false | — | 1 | HIGH | 1889 |
| `features/super-admin/command-center-v1/CommandCenterV1.tsx` | Super Admin | REQUIRED | — | window | false | true | — | 11 | HIGH | 3226 |
| `features/super-admin/command-center-v1/components/ActivityFeed.tsx` | Super Admin | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1640 |
| `features/super-admin/command-center-v1/components/ChartsPanel.tsx` | Super Admin | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 3739 |
| `features/super-admin/command-center-v1/components/CommandCenterWorldMap.tsx` | Super Admin | PROBABLY REQUIRED | useMemo | — | false | false | — | 1 | MEDIUM | 3543 |
| `features/super-admin/command-center-v1/components/CriticalAlertsBar.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1717 |
| `features/super-admin/command-center-v1/components/GlobalSearchBar.tsx` | Super Admin | REQUIRED | useState,useMemo | — | false | true | — | 0 | HIGH | 2963 |
| `features/super-admin/command-center-v1/components/HealthScoresPanel.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1776 |
| `features/super-admin/command-center-v1/components/LiveStatusBadge.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 924 |
| `features/super-admin/command-center-v1/components/MetricCard.tsx` | Super Admin | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 2034 |
| `features/super-admin/command-center-v1/components/MetricSection.tsx` | Super Admin | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1008 |
| `features/super-admin/command-center-v1/components/NotificationsPanel.tsx` | Notifications | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1841 |
| `features/super-admin/command-center-v1/components/QuickActionsGrid.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1003 |
| `features/super-admin/command-center-v1/components/StatusHeader.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1108 |
| `features/super-admin/command-center-v2/CommandCenterV2.tsx` | Super Admin | PROBABLY REQUIRED | useMemo | — | false | false | — | 8 | MEDIUM | 12597 |
| `features/super-admin/command-center-v2/components/CcAnimatedCounter.tsx` | Super Admin | REQUIRED | useState,useEffect | Animation | false | false | — | 0 | HIGH | 1464 |
| `features/super-admin/command-center-v2/components/CcDonutChart.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2332 |
| `features/super-admin/command-center-v2/components/CcHeader.tsx` | Super Admin | REQUIRED | useState,useEffect | window | false | false | — | 0 | HIGH | 3020 |
| `features/super-admin/command-center-v2/components/CcLineChart.tsx` | Super Admin | REQUIRED | useState,useMemo | — | false | true | — | 0 | HIGH | 3371 |
| `features/super-admin/command-center-v2/components/CcSparkline.tsx` | Super Admin | PROBABLY REQUIRED | useMemo | — | false | false | — | 0 | MEDIUM | 1493 |
| `features/super-admin/command-os-v4/CommandOsShell.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | — | false | true | — | 1 | HIGH | 11194 |
| `features/super-admin/components/LiveCountriesPanel.tsx` | Super Admin | REQUIRED | useState,useEffect,useRef,useMemo,useCallback | window | false | false | — | 1 | HIGH | 6792 |
| `features/super-admin/components/OwnerDemoModePanel.tsx` | Super Admin | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1538 |
| `features/super-admin/components/PreferredMarketplaceStoresPanel.tsx` | Super Admin | REQUIRED | useState,useEffect,useCallback | — | false | true | — | 0 | HIGH | 10951 |
| `features/super-admin/components/premium/EnterpriseAdminShell.tsx` | Super Admin | PROBABLY REQUIRED | — | — | false | true | — | 2 | HIGH | 5583 |
| `features/super-admin/components/premium/EnterpriseAdminToolbar.tsx` | Super Admin | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 2603 |
| `features/super-admin/components/premium/EnterpriseDashboardStandard.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 5116 |
| `features/super-admin/components/premium/EnterpriseEngineAdminShell.tsx` | Super Admin | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1281 |
| `features/super-admin/components/premium/OmegaStatusBar.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1700 |
| `features/super-admin/components/premium/SuperAdminBreadcrumbs.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1028 |
| `features/super-admin/components/premium/SuperAdminCommandPalette.tsx` | Super Admin | REQUIRED | useState,useEffect,useMemo,useCallback | window,EventListeners | false | true | — | 1 | HIGH | 5242 |
| `features/super-admin/components/premium/SuperAdminPremiumDashboard.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 4429 |
| `features/super-admin/components/premium/SuperAdminSearchToolbar.tsx` | Super Admin | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 844 |
| `features/super-admin/components/SuperAdminAuditLog.tsx` | Super Admin | REQUIRED | useState,useEffect | — | false | false | — | 0 | HIGH | 1762 |
| `features/super-admin/components/SuperAdminAutomationPanel.tsx` | Super Admin | REQUIRED | useState,useEffect | — | false | true | — | 0 | HIGH | 3779 |
| `features/super-admin/components/SuperAdminCommandCentre.tsx` | Super Admin | REQUIRED | useState,useEffect | window | false | true | — | 2 | HIGH | 7286 |
| `features/super-admin/components/SuperAdminDashboard.tsx` | Super Admin | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 9354 |
| `features/super-admin/components/SuperAdminGlobalSearch.tsx` | Super Admin | REQUIRED | useState,useEffect | — | false | true | — | 1 | HIGH | 2833 |
| `features/super-admin/components/SuperAdminGrantsPanel.tsx` | Super Admin | REQUIRED | useState | — | false | true | — | 0 | HIGH | 3930 |
| `features/super-admin/components/SuperAdminMonitoringWidgets.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1648 |
| `features/super-admin/components/SuperAdminNotificationsPanel.tsx` | Notifications | REQUIRED | useState,useEffect | — | false | true | — | 0 | HIGH | 8246 |
| `features/super-admin/components/SuperAdminPlatformPanel.tsx` | Super Admin | REQUIRED | useState,useEffect | — | false | true | — | 0 | HIGH | 5656 |
| `features/super-admin/components/SuperAdminQuickActions.tsx` | Super Admin | REQUIRED | useState | — | false | true | — | 0 | HIGH | 6825 |
| `features/super-admin/components/SuperAdminShell.tsx` | Super Admin | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 715 |
| `features/super-admin/components/SuperAdminUsersPanel.tsx` | Super Admin | REQUIRED | useState,useEffect,useCallback | window | false | true | — | 0 | HIGH | 13903 |
| `features/super-admin/device-lifecycle-manager/DeviceLifecycleManagerAdmin.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | — | false | true | — | 0 | HIGH | 16596 |
| `features/super-admin/enterprise-ai-operating-system/EnterpriseAiOperatingSystemAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 10157 |
| `features/super-admin/enterprise-automation-hub/EnterpriseAutomationHubAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 13554 |
| `features/super-admin/enterprise-autonomous-execution-engine/EnterpriseAutonomousExecutionAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 17835 |
| `features/super-admin/enterprise-business-intelligence/EnterpriseBiAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 13245 |
| `features/super-admin/enterprise-category-management-center/EnterpriseCategoryManagementAdmin.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | — | false | true | — | 0 | HIGH | 18699 |
| `features/super-admin/enterprise-compliance-center/EnterpriseComplianceCenterAdmin.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | — | false | true | — | 0 | HIGH | 25082 |
| `features/super-admin/enterprise-core/EnterpriseCore.tsx` | Super Admin | REQUIRED | useState,useEffect,useCallback,useTransition | window,document | false | true | — | 1 | HIGH | 23862 |
| `features/super-admin/enterprise-deployment-center/EnterpriseDeploymentCenterAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 9622 |
| `features/super-admin/enterprise-development-center/EnterpriseDevelopmentAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 16228 |
| `features/super-admin/enterprise-e2e-validation-engine/EnterpriseE2eValidationAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 18546 |
| `features/super-admin/enterprise-governance-center/EnterpriseGovernanceAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 12018 |
| `features/super-admin/enterprise-launch-readiness-engine/EnterpriseLaunchReadinessAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 13175 |
| `features/super-admin/enterprise-marketplace-completion-engine/EnterpriseMarketplaceCompletionAdmin.tsx` | Super Admin | REQUIRED | useState,useEffect,useCallback,useTransition | — | false | true | — | 0 | HIGH | 88391 |
| `features/super-admin/enterprise-mobile-control-center/EnterpriseMobileControlCenterAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 11477 |
| `features/super-admin/enterprise-module-registry/EnterpriseModuleRegistryAdmin.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | document | false | true | — | 1 | HIGH | 12254 |
| `features/super-admin/enterprise-observability-center/EnterpriseObservabilityAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 16496 |
| `features/super-admin/enterprise-security-operations-center/EnterpriseSocAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 14309 |
| `features/super-admin/enterprise-workflow-engine/EnterpriseWorkflowEngineAdmin.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | — | false | true | — | 0 | HIGH | 13351 |
| `features/super-admin/executive-command/ExecutiveCommandAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 9988 |
| `features/super-admin/experience-v3/ExperienceShell.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | — | false | true | — | 1 | HIGH | 18573 |
| `features/super-admin/hmrc/HmrcSettingsPanel.tsx` | Settings | REQUIRED | useState,useEffect | — | false | true | — | 0 | HIGH | 6669 |
| `features/super-admin/homepage-builder-engine/HomepageBuilderEngineAdmin.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | — | false | true | — | 0 | HIGH | 10640 |
| `features/super-admin/homepage-enterprise-certification-engine/HomepageEnterpriseCertificationAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 26261 |
| `features/super-admin/incident-command-center/IncidentCommandCenterAdmin.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | — | false | true | — | 0 | HIGH | 17094 |
| `features/super-admin/incident-response-center/IncidentResponseCenterAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 13296 |
| `features/super-admin/incident-timeline/IncidentTimelineAdmin.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | — | false | true | — | 0 | HIGH | 14163 |
| `features/super-admin/integrations-engine/IntegrationsEngineAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | window,document | false | true | — | 1 | HIGH | 9523 |
| `features/super-admin/launch-certification/CertificationDashboard.tsx` | Super Admin | REQUIRED | useState,useEffect,useCallback,useTransition | — | false | true | — | 0 | HIGH | 6883 |
| `features/super-admin/live-analytics/components/AnimatedNumber.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 579 |
| `features/super-admin/live-analytics/components/LiveAnalyticsToolbar.tsx` | Super Admin | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 4742 |
| `features/super-admin/live-analytics/components/LiveCitiesSection.tsx` | Super Admin | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1731 |
| `features/super-admin/live-analytics/components/LiveCountriesSection.tsx` | Super Admin | REQUIRED | useState,useEffect,useRef,useMemo | window | false | false | — | 2 | HIGH | 6484 |
| `features/super-admin/live-analytics/components/LiveDimensionPanel.tsx` | Super Admin | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 2042 |
| `features/super-admin/live-analytics/components/LiveEventFeed.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2349 |
| `features/super-admin/live-analytics/components/LivePerformanceSection.tsx` | Super Admin | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 2932 |
| `features/super-admin/live-analytics/components/LiveVisitorMetricsCard.tsx` | Super Admin | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 2128 |
| `features/super-admin/live-analytics/components/LiveWorldMap.tsx` | Super Admin | PROBABLY REQUIRED | useMemo | — | false | false | — | 0 | MEDIUM | 2974 |
| `features/super-admin/live-analytics/components/MiniSparkline.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 530 |
| `features/super-admin/live-analytics/LiveAnalyticsCenter.tsx` | Super Admin | REQUIRED | useState,useMemo | — | false | true | — | 9 | HIGH | 4715 |
| `features/super-admin/marketplace-intelligence/MarketplaceIntelligenceAdmin.tsx` | Super Admin | REQUIRED | useState | — | false | true | — | 1 | HIGH | 8268 |
| `features/super-admin/marketplace-os/MosControlCenter.tsx` | Super Admin | REQUIRED | useState | — | false | true | — | 0 | HIGH | 8123 |
| `features/super-admin/marketplace/DeleteAllListingsPanel.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 1 | HIGH | 5454 |
| `features/super-admin/messages-engine/MessagesEngineAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | window,document | false | true | — | 1 | HIGH | 9781 |
| `features/super-admin/mission-control-engine/MissionControlEngineAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | window,document | false | true | — | 2 | HIGH | 8408 |
| `features/super-admin/mission-control/AiManagerPanel.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 3866 |
| `features/super-admin/mission-control/BannerManagerPanel.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 2 | HIGH | 5765 |
| `features/super-admin/mission-control/DeveloperToolsPanel.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 4393 |
| `features/super-admin/mission-control/FeatureManagerPanel.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 3784 |
| `features/super-admin/mission-control/HomepageBuilderPanel.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 1 | HIGH | 6271 |
| `features/super-admin/mission-control/MissionControlAutoRefresh.tsx` | Super Admin | REQUIRED | useEffect,useRouter | window | false | false | — | 0 | HIGH | 551 |
| `features/super-admin/mission-control/MissionControlCenterV2.tsx` | Super Admin | REQUIRED | useState,useMemo | — | false | true | — | 2 | HIGH | 16007 |
| `features/super-admin/mission-control/MissionControlShortcutGrid.tsx` | Super Admin | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1269 |
| `features/super-admin/mission-control/QuickListingPanel.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 5418 |
| `features/super-admin/mission-control/ResponsivePreviewFrame.tsx` | Super Admin | REQUIRED | useState | — | false | true | — | 0 | HIGH | 1847 |
| `features/super-admin/mobile-distribution-center/MobileDistributionCenterAdmin.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | — | false | true | — | 0 | HIGH | 25343 |
| `features/super-admin/notifications-engine/NotificationsEngineAdmin.tsx` | Notifications | REQUIRED | useState,useCallback,useTransition | window,document | false | true | — | 1 | HIGH | 9347 |
| `features/super-admin/omega-command-center/OmegaCommandCenterAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 10185 |
| `features/super-admin/omega-command-center/OmegaEngineAdmin.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2074 |
| `features/super-admin/omega-development-director/OmegaDevelopmentDirectorAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 18261 |
| `features/super-admin/omega-enterprise-mobile/OmegaEnterpriseMobileAdmin.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | — | false | true | — | 0 | HIGH | 21021 |
| `features/super-admin/omega-global-ui-integrity-engine/OmegaGlobalUiIntegrityAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 15401 |
| `features/super-admin/omega-quality-assurance-center/OmegaQualityAssuranceAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 16291 |
| `features/super-admin/operations-center/OperationsCenterAdmin.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | — | false | true | — | 0 | HIGH | 9826 |
| `features/super-admin/operations/AiEmergencySection.tsx` | Super Admin | REQUIRED | useState | window | false | true | — | 1 | HIGH | 3982 |
| `features/super-admin/operations/AiIncidentHistorySection.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2943 |
| `features/super-admin/operations/AiLiveMonitoringSection.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1508 |
| `features/super-admin/operations/AiOperationsAssistantSection.tsx` | Super Admin | REQUIRED | useState | — | false | true | — | 0 | HIGH | 4047 |
| `features/super-admin/operations/AiOperationsCenter.tsx` | Super Admin | REQUIRED | useState | — | false | true | — | 12 | HIGH | 2610 |
| `features/super-admin/operations/AiOperationsLogsSection.tsx` | Super Admin | REQUIRED | useState | — | false | true | — | 0 | HIGH | 2816 |
| `features/super-admin/operations/AiOperationsSummaryCards.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2916 |
| `features/super-admin/operations/AiPerformanceSection.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2708 |
| `features/super-admin/operations/AiPlatformScanSection.tsx` | Super Admin | REQUIRED | useState | — | false | true | — | 0 | HIGH | 3431 |
| `features/super-admin/operations/AiRecommendationsSection.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1990 |
| `features/super-admin/operations/AiRepairCenterSection.tsx` | Super Admin | REQUIRED | useState | navigator,Clipboard | false | true | — | 0 | HIGH | 8571 |
| `features/super-admin/operations/AiSecuritySection.tsx` | Super Admin | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2822 |
| `features/super-admin/operations/AiSelfHealingSection.tsx` | Super Admin | REQUIRED | useState | — | false | true | — | 1 | HIGH | 3277 |
| `features/super-admin/orders-engine/OrdersEngineAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | window,document | false | true | — | 1 | HIGH | 8105 |
| `features/super-admin/organic-growth/OrganicGrowthDashboard.tsx` | Super Admin | REQUIRED | useState | — | false | true | — | 0 | HIGH | 8009 |
| `features/super-admin/payments-engine/PaymentsEngineAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | window,document | false | true | — | 1 | HIGH | 8876 |
| `features/super-admin/platform-studio/PlatformStudio.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | window,document | false | true | — | 2 | HIGH | 16795 |
| `features/super-admin/platform-visual/MenuBuilderPanel.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 4582 |
| `features/super-admin/platform-visual/studio-pro/VisualCanvas.tsx` | Super Admin | REQUIRED | useState,useRef,useCallback | — | false | true | — | 0 | HIGH | 7371 |
| `features/super-admin/platform-visual/ThemeStudioPanel.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | document | false | true | — | 1 | HIGH | 7817 |
| `features/super-admin/platform-visual/ThemeStudioPro.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | window,document | false | true | — | 5 | HIGH | 24166 |
| `features/super-admin/premium-design/PremiumAssetManagerPanel.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 1 | HIGH | 5647 |
| `features/super-admin/production-assets/ProductionAssetValidatorPanel.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | — | false | true | — | 0 | HIGH | 8663 |
| `features/super-admin/promotion-management/UserPromotionsAdmin.tsx` | Super Admin | REQUIRED | useState,useEffect,useRef,useCallback,useRouter | — | false | true | — | 1 | HIGH | 16853 |
| `features/super-admin/protection-engine/ProtectionEngineAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | window,document | false | true | — | 1 | HIGH | 9316 |
| `features/super-admin/recovery-center/RecoveryCenterAdmin.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | — | false | true | — | 0 | HIGH | 12884 |
| `features/super-admin/rovexo-ideas/RovexoIdeasAdmin.tsx` | Super Admin | REQUIRED | useState,useTransition | — | false | true | — | 1 | HIGH | 7038 |
| `features/super-admin/search-engine/SearchEngineAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | window,document | false | true | — | 1 | HIGH | 9429 |
| `features/super-admin/security-engine/SecurityEngineAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | window,document | false | true | — | 1 | HIGH | 10226 |
| `features/super-admin/shipping-engine/ShippingEngineAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | window,document | false | true | — | 2 | HIGH | 9134 |
| `features/super-admin/shipping-engine/ShippingProvidersPanel.tsx` | Super Admin | REQUIRED | useState,useEffect,useCallback,useTransition | — | false | true | — | 0 | HIGH | 3979 |
| `features/super-admin/staff-profile/StaffProfileAdmin.tsx` | Super Admin | REQUIRED | useState,useEffect,useMemo,useCallback | — | false | true | — | 1 | HIGH | 19803 |
| `features/super-admin/visual-cms/VisualCmsAdmin.tsx` | Super Admin | REQUIRED | useState,useMemo,useCallback,useTransition | — | false | true | — | 3 | HIGH | 13094 |
| `features/super-admin/wallet-engine/WalletEngineAdmin.tsx` | Super Admin | REQUIRED | useState,useCallback,useTransition | window,document | false | true | — | 1 | HIGH | 8618 |
| `features/support/components/SupportForm.tsx` | Other/Shared | REQUIRED | useState,useMemo,useRouter,usePathname,useSearchParams | FileUpload | false | true | — | 1 | HIGH | 6926 |
| `features/support/components/SupportSuccessPage.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1079 |
| `features/transaction-hub/CheckoutHubSheet.tsx` | Other/Shared | REQUIRED | useState,useEffect,useRouter | — | false | true | — | 2 | HIGH | 4471 |
| `features/transaction-hub/MakeOfferSheet.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 819 |
| `features/transaction-hub/OfferComposerSheet.tsx` | Other/Shared | REQUIRED | useState,useEffect,useMemo,useCallback,useRouter | — | false | true | — | 3 | HIGH | 8358 |
| `features/transaction-hub/TransactionHubBottomActions.tsx` | Other/Shared | REQUIRED | useState,useMemo | — | false | true | — | 1 | HIGH | 9679 |
| `features/transaction-hub/TransactionHubPaymentSuccess.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1897 |
| `features/trust/components/TrustCenterPage.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 3707 |
| `features/trust/components/TrustScoreMeter.tsx` | Other/Shared | REQUIRED | useState,useEffect | window,Animation | false | false | — | 1 | HIGH | 2214 |
| `features/trust/components/TrustTierBadge.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1110 |
| `features/trust/components/TrustVerificationActions.tsx` | Other/Shared | REQUIRED | useState,useRouter | — | false | true | — | 0 | HIGH | 2509 |
| `features/wallet/components/AnnualStatementDetail.tsx` | Wallet | REQUIRED | — | window | false | true | — | 0 | HIGH | 3098 |
| `features/wallet/components/AnnualStatementsList.tsx` | Wallet | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1508 |
| `features/wallet/components/BankAccountForm.tsx` | Wallet | REQUIRED | useState | — | false | true | — | 0 | HIGH | 5031 |
| `features/wallet/components/MonthlyStatementDetail.tsx` | Wallet | REQUIRED | — | window,document | false | true | — | 0 | HIGH | 4574 |
| `features/wallet/components/MonthlyStatementsList.tsx` | Wallet | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1840 |
| `features/wallet/components/MonthSummaryGrid.tsx` | Wallet | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1393 |
| `features/wallet/components/PayoutSetupSection.tsx` | Wallet | REQUIRED | useState | window | false | true | — | 1 | HIGH | 1635 |
| `features/wallet/components/PayoutStatusCard.tsx` | Wallet | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1056 |
| `features/wallet/components/ProfileBalanceMenuIcon.tsx` | Wallet | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 347 |
| `features/wallet/components/WalletBankAccountsPage.tsx` | Wallet | REQUIRED | useState,useEffect | window | false | true | — | 1 | HIGH | 7254 |
| `features/wallet/components/WalletConnectedBank.tsx` | Wallet | REQUIRED | useState,useRouter,useTransition | — | false | true | — | 0 | HIGH | 3748 |
| `features/wallet/components/WalletHubV1.tsx` | Wallet | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 8880 |
| `features/wallet/components/WalletInsights.tsx` | Wallet | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 3057 |
| `features/wallet/components/WalletMenuSections.tsx` | Wallet | NOT VERIFIED | — | — | false | false | — | 2 | MEDIUM | 1749 |
| `features/wallet/components/WalletPaymentMethodsPage.tsx` | Wallet | REQUIRED | useState,useEffect,useRouter,useSearchParams,useSyncExternalStore | — | false | true | — | 2 | HIGH | 13921 |
| `features/wallet/components/WalletPayoutsPage.tsx` | Wallet | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2354 |
| `features/wallet/components/WalletProfileChrome.tsx` | Wallet | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2149 |
| `features/wallet/components/WalletRecentTransactions.tsx` | Wallet | REQUIRED | useState | — | false | true | — | 1 | HIGH | 4841 |
| `features/wallet/components/WalletTransactionsList.tsx` | Wallet | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2264 |
| `features/wallet/components/withdraw/WithdrawAmountStep.tsx` | Wallet | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1388 |
| `features/wallet/components/withdraw/WithdrawMethodStep.tsx` | Wallet | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1188 |
| `features/wallet/components/withdraw/WithdrawPage.tsx` | Wallet | REQUIRED | useState,useMemo,useRouter | — | false | true | — | 0 | HIGH | 11424 |
| `features/wallet/components/withdraw/WithdrawReviewStep.tsx` | Wallet | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1200 |
| `features/wallet/hooks/use-wallet-live.ts` | Wallet | REQUIRED | useState,useEffect,useRef,useCallback | window | false | false | — | 0 | HIGH | 3424 |
| `features/wallet/hooks/use-withdraw-flow.ts` | Wallet | REQUIRED | useState,useMemo | — | false | false | — | 0 | HIGH | 2852 |
| `features/wholesale/components/RfqSubmitForm.tsx` | Other/Shared | REQUIRED | useState,useRouter | — | false | true | — | 0 | HIGH | 3346 |
| `features/wholesale/components/WholesalePricingManager.tsx` | Other/Shared | REQUIRED | useState,useEffect | — | false | true | — | 0 | HIGH | 2908 |
| `hooks/buyer/BuyerDashboardProvider.tsx` | Other/Shared | REQUIRED | useContext | — | true | false | — | 0 | HIGH | 1025 |
| `hooks/navigation/usePageBack.ts` | Other/Shared | REQUIRED | useRef,useMemo,useCallback,useRouter,usePathname | window | false | false | — | 0 | HIGH | 1908 |
| `hooks/use-body-scroll-lock.ts` | Other/Shared | REQUIRED | useEffect | document | false | false | — | 0 | HIGH | 1125 |
| `hooks/use-focus-trap.ts` | Other/Shared | REQUIRED | useEffect,useRef | window,document,EventListeners | false | false | — | 0 | HIGH | 2661 |
| `hooks/use-mobile-input-scroll.ts` | Other/Shared | REQUIRED | useEffect | window,document,Animation,EventListeners | false | false | — | 0 | HIGH | 901 |
| `lib/auth/bootstrap.ts` | Auth | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 2565 |
| `lib/bring-your-item/certification.ts` | Lib/Hooks | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 17067 |
| `lib/checkout/checkout-session-self-heal-client-v1.ts` | Checkout | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 908 |
| `lib/checkout/use-saved-payment-methods.ts` | Checkout | REQUIRED | useState,useEffect,useCallback | — | false | false | — | 0 | HIGH | 1656 |
| `lib/help/session.ts` | Lib/Hooks | REQUIRED | — | window,navigator,sessionStorage | false | false | — | 0 | HIGH | 3887 |
| `lib/home/hero-category-sync.tsx` | Lib/Hooks | REQUIRED | useState,useContext,useMemo,useCallback | — | true | false | — | 0 | HIGH | 1772 |
| `lib/i18n/provider.tsx` | Lib/Hooks | REQUIRED | useState,useEffect,useContext,useMemo,useCallback,usePathname,useSyncExternalStore | window,document,localStorage,EventListeners | true | false | — | 1 | HIGH | 5844 |
| `lib/i18n/use-translation.ts` | Lib/Hooks | PROBABLY REQUIRED | useCallback | — | false | false | — | 1 | MEDIUM | 591 |
| `lib/media/use-card-image-src.ts` | Lib/Hooks | REQUIRED | useState | — | false | false | — | 0 | HIGH | 2106 |
| `lib/messages/prepare-message-photo-v1.ts` | Lib/Hooks | REQUIRED | — | document,Canvas | false | false | — | 0 | HIGH | 1867 |
| `lib/messages/resolve-message-photo-url.client.ts` | Lib/Hooks | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1773 |
| `lib/motion/use-prefers-reduced-motion.ts` | Lib/Hooks | REQUIRED | useSyncExternalStore | window,matchMedia,Animation,EventListeners | false | false | — | 0 | HIGH | 1428 |
| `lib/navigation/link-icons.tsx` | Lib/Hooks | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 411 |
| `lib/ops/performance-audit.ts` | Lib/Hooks | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 12467 |
| `lib/performance/hooks.ts` | Lib/Hooks | REQUIRED | useState,useEffect,useRef,useCallback,useSyncExternalStore | window,document,IntersectionObserver,Animation,EventListeners | false | false | — | 0 | HIGH | 5171 |
| `lib/push/client-subscribe.ts` | Lib/Hooks | REQUIRED | — | window,navigator | false | false | — | 0 | HIGH | 6127 |
| `lib/react/use-client-hydrated.ts` | Lib/Hooks | REQUIRED | useSyncExternalStore | — | false | false | — | 0 | HIGH | 446 |
| `lib/supabase/client.ts` | Lib/Hooks | REQUIRED | — | document,SupabaseRealtime | false | false | — | 0 | HIGH | 1163 |
| `lib/views/use-live-product-views.ts` | Lib/Hooks | REQUIRED | useCallback,useSyncExternalStore | — | false | false | — | 1 | HIGH | 808 |
| `lib/views/view-live-sync.ts` | Lib/Hooks | REQUIRED | useSyncExternalStore | EventListeners | false | false | — | 0 | HIGH | 4112 |
| `scripts/cert-run6-zero-lag.ts` | Tests/Scripts | REQUIRED | useMemo,useCallback | window,document,Animation | false | false | — | 0 | HIGH | 51478 |
| `src/components/canonical/CanonicalAccountHeader.tsx` | Chrome/Nav | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 428 |
| `src/components/canonical/CanonicalButton.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 2507 |
| `src/components/canonical/CanonicalCheckbox.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 1093 |
| `src/components/canonical/CanonicalInput.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2310 |
| `src/components/canonical/CanonicalMenuRow.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 3608 |
| `src/components/canonical/CanonicalModal.tsx` | Other/Shared | REQUIRED | useEffect,useRef | window,EventListeners | false | true | — | 3 | HIGH | 3060 |
| `src/components/canonical/CanonicalPageHeader.tsx` | Chrome/Nav | PROBABLY REQUIRED | — | — | false | true | — | 2 | HIGH | 2930 |
| `src/components/canonical/CanonicalPageLayout.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 1 | HIGH | 1503 |
| `src/components/canonical/CanonicalRadio.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 2250 |
| `src/components/canonical/CanonicalSection.tsx` | Other/Shared | NOT VERIFIED | — | — | false | false | — | 1 | MEDIUM | 1198 |
| `src/components/canonical/CanonicalSelector.tsx` | Other/Shared | PROBABLY REMOVABLE | — | — | false | false | — | 0 | MEDIUM | 2100 |
| `src/components/canonical/CanonicalSwitch.tsx` | Other/Shared | PROBABLY REQUIRED | — | — | false | true | — | 0 | HIGH | 2423 |
| `src/components/canonical/dialogs/CanonicalConfirmDialog.tsx` | Other/Shared | REQUIRED | useEffect,useRef,useId | window,EventListeners | false | true | — | 3 | HIGH | 3114 |

---

## ABSOLUTE RULES HONORED

- No code changes · No refactor · No Server/Client conversion · No `"use client"` removal
- No file moves · No rename · No delete · No commits · No push · No deploy
- No TODOs · No refactor plan · No patches · Evidence only

## STOP
