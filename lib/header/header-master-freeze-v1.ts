/**
 * ROVEXO HEADER MASTER FREEZE v1.0 — LEVEL 8
 * Header Simplification CERTIFIED: MINIMALIST · SEARCH FIRST · FULL WIDTH SEARCH BAR
 *
 * ONE Header · NO Notification · NO Avatar · NO header profile fetch
 * Profile/Wallet/Orders keep Back + title via AccountCanonicalHeader (not RovexoHeaderV2 actions).
 */

export const HEADER_MASTER_FREEZE_V1 = {
  version: "1.0",
  status: "PRODUCTION_CERTIFIED_LEVEL_8_SEARCH_FIRST_MINIMALIST",
  complete: true,
  certified: true,
  productionReady: true,
  freezeLocked: true,
  searchFirstMinimalist: true,
  oneHeaderOnly: true,
  oneAvatarOwner: true,
  oneProfileFetchOnAppLoad: true,
  fullWidthSearchBar: true,
  noNotificationIcon: true,
  noAvatarInHeader: true,
  noHeaderProfileFetch: true,
  headerSurvivesNavigation: true,
  searchBarTokens: {
    heightPx: 44,
    radiusPx: 16,
    textPx: 14,
    iconPx: 20,
    paddingPx: 16,
  },
  keep: [
    "Search Icon",
    "Camera Search Icon",
    "Clear Search (X)",
    "Search Suggestions",
    "Trending Searches",
    "Camera Search",
  ] as const,
  removed: [
    "Notification Icon",
    "Avatar Icon",
    "Notification Badge",
    "Avatar Loading State",
    "Avatar Fetch in Header",
    "Avatar Skeleton",
  ] as const,
  forbidden: [
    "Notification icon in RovexoHeaderV2",
    "Avatar / HeaderProfileLink in RovexoHeaderV2",
    "duplicated Header icons",
    "unnecessary Header actions",
    "Camera Search / SearchProvider modifications",
  ] as const,
  ssot: {
    freeze: "lib/header/header-master-freeze-v1.ts",
    header: "features/header/HeaderProvider.tsx",
    component: "components/header/RovexoHeaderV2.tsx",
    css: "styles/rovexo/header-v2.css",
  },
} as const;

export type HeaderMasterFreezeV1 = typeof HEADER_MASTER_FREEZE_V1;
