/**
 * ROVEXO SUPREME BLOOD CODE XXVII
 * SEARCH PAGE UI — PIXEL MATCH (Owner reference SSOT)
 *
 * STATUS: SUPERSEDED BY SEARCH_UI_v1.0 FREEZE (2026-07-25)
 * Surface: /search idle landing (bottom nav Search tab)
 *
 * Presentation locked under SEARCH_UI_v1.0.
 * Engine / API / ranking / AI / camera / history / trending logic unchanged.
 */

export const SUPREME_BLOOD_CODE_XXVII_V1 = {
  version: "27.0",
  codename: "SEARCH_PAGE_UI_PIXEL_MATCH",
  status: "LOCKED",
  approvedByOwner: true,
  freezeLocked: true,
  permanentlyFrozen: true,
  ownerPixelMatchConfirmed: true,
  searchUiFreeze: "SEARCH_UI_v1.0",
  approvedAt: "2026-07-25",
  officialRoute: "http://localhost:3000/search",
  visualTarget: "99%+",
  hierarchy: [
    "Search Bar",
    "Category Grid",
    "Recent Searches",
    "Trending Searches",
  ] as const,
  categoryGrid: {
    /** Reference image SSOT — 3 columns on mobile. */
    columnsMobile: 3,
    source: "CANONICAL_ROOT_CATEGORIES",
    rootCount: 9,
    showIcon: false,
    showName: true,
    showListingCount: true,
    showArtwork: true,
  } as const,
  recentMax: 3,
  bottomNav: "UNCHANGED" as const,
  notIncluded: [
    "Search Engine",
    "Backend",
    "Database",
    "API",
    "Ranking",
    "AI Search",
    "Camera Search logic",
    "History Logic",
    "Trending Logic",
    "Navigation Logic",
    "Bottom Navigation",
    "Authentication",
  ] as const,
} as const;
