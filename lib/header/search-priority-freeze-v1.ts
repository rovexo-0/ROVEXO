/**
 * ROVEXO v1.0 — SEARCH PRIORITY FREEZE
 * OWNER APPROVED · LOCKED · FROZEN · SSOT READY
 *
 * Canonical principle: IF SOMETHING DOES NOT HELP SEARCH, IT DOES NOT BELONG IN THE HEADER.
 * Header is STATELESS — never auth / avatar / notifications / user fetch.
 */

export const SEARCH_PRIORITY_FREEZE_V1 = {
  version: "1.0",
  status: "OWNER_APPROVED_LOCKED_FROZEN",
  approvedByOwner: true,
  freezeLocked: true,
  principle:
    "IF SOMETHING DOES NOT HELP SEARCH, IT DOES NOT BELONG IN THE HEADER.",
  headerPurpose: "SEARCH_ONLY" as const,
  searchOccupiesAvailableSpacePercent: 100,
  headerMustBe: [
    "SIMPLE",
    "FAST",
    "MINIMALIST",
    "COMPACT",
    "PREMIUM",
    "SCALABLE",
    "MAINTAINABLE",
  ] as const,
  headerNever: [
    "crowded",
    "overloaded",
    "duplicated",
    "state dependent",
    "API dependent",
    "user dependent",
  ] as const,
  headerNeverRequires: [
    "authentication",
    "user fetch",
    "avatar fetch",
    "notifications fetch",
    "refresh",
    "remount",
    "hydration fixes",
  ] as const,
  headerStateless: true,
  /** Superseded 2026-07-23: Search Bar mounts on Homepage only (Owner permanent freeze). */
  identicalMarketplaceChrome: false,
  homepageSearchBarOnly: true,
  sharedHeaderSurfaces: ["Home"] as const,
  accountUsesBackTitleOnly: true,
  accountExamples: [
    "Profile",
    "Orders",
    "Wallet",
    "Balance",
    "Settings",
    "Addresses",
    "Verification",
    "Security",
    "Payment Methods",
    "Bank Account",
    "Transactions",
  ] as const,
  forbiddenForever: [
    "Avatar",
    "Notifications",
    "Notification badges",
    "Multiple headers",
    "Multiple search bars",
    "Multiple search providers",
    "Multiple avatar owners",
    "Multiple states",
    "Multiple API fetches",
    "Search bar outside Homepage",
    "CSS-hidden marketplace header",
    "Refresh requirements",
  ] as const,
  successGates: {
    oneHeader: "PASS",
    oneSearchBar: "PASS",
    noAvatar: "PASS",
    noNotifications: "PASS",
    noRefresh: "PASS",
    noHeaderReload: "PASS",
    homepageSearchOnly: "PASS",
    searchPriority100: "PASS",
    availableWidth100: "PASS",
    cameraSearch: "PASS",
    longTermScalability: "PASS",
    mobileFirst: "PASS",
    compactPremium: "PASS",
  },
  ssot: {
    freeze: "lib/header/search-priority-freeze-v1.ts",
    headerFreeze: "lib/header/header-master-freeze-v1.ts",
    homepageSearchOnly: "lib/header/homepage-search-bar-only-v1.ts",
    header: "features/header/HeaderProvider.tsx",
    component: "components/header/RovexoHeaderV2.tsx",
  },
} as const;

export type SearchPriorityFreezeV1 = typeof SEARCH_PRIORITY_FREEZE_V1;
