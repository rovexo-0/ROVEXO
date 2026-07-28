/**
 * ROVEXO v1.0 — SAVED FINAL FREEZE (PRODUCTION LOCK)
 *
 * Owner: FREEZE YES · PRODUCTION LOCK
 * Canonical: lib/saved/saved-live-production-lock-v1.ts
 * Authority: https://www.rovexo.co.uk
 */

export {
  SAVED_LIVE_PRODUCTION_LOCK as SAVED_FINAL_FREEZE_VERSION,
  SAVED_LIVE_STATUS,
  SAVED_LIVE_FREEZE,
  LIVE_EMPTY_STATE,
  LIVE_API,
  LIVE_HEART_RULES,
  LIVE_SAVE_FLOW,
  LIVE_UNSAVE_FLOW,
  SAVED_LIVE_CANONICAL,
  SAVED_PRODUCTION_ALLOWED,
  SAVED_PRODUCTION_FORBIDDEN,
} from "@/lib/saved/saved-live-production-lock-v1";

export const SAVED_FINAL_FREEZE_STATUS = "PRODUCTION_LOCK" as const;
export const SAVED_FINAL_FREEZE_PRIORITY = "P0" as const;
export const SAVED_FINAL_FREEZE = true as const;

/** Database truth SSOT — one Saved system only. */
export const SAVED_SSOT = {
  table: "saved_items",
  api: "/api/saved",
  page: "/saved",
  verify: "lib/saved/check.ts",
  heartHook: "features/home/hooks/use-product-watchlist.ts",
  listingCard: "components/ui/ListingCard.tsx",
  searchCard: "features/search/components/SearchResultCard.tsx",
  storeCard: "components/home/stores/StoreCard.tsx",
  savedPage: "features/account-module/components/SavedItemsV1.tsx",
  lock: "lib/saved/saved-live-production-lock-v1.ts",
} as const;

export const SAVED_AFFECTED_SURFACES = [
  "Homepage",
  "Saved",
  "Search",
  "Product similar/related cards",
  "Store",
] as const;

export const SAVED_PIPELINE = [
  "saved_items (DATABASE)",
  "POST|DELETE /api/saved",
  "optimistic useProductWatchlist OR Saved setItems",
  "remount surfaces → GET /api/saved?slug= DB truth",
  "Refresh → DB truth",
] as const;

export const SAVED_ALLOWED = [
  "Save",
  "Unsave",
  "Empty state",
  "Login",
  "Logout",
  "Refresh",
  "Cross surface synchronization",
  "Database truth",
] as const;

export const SAVED_LIVE_RULE = {
  optimisticUiMs: 0,
  sharedSsotBus: false,
  softRefreshRequired: false,
  refreshAllowedShowsDbTruth: true,
  hydrateOnMount: "GET /api/saved?slug=",
  rollbackOnFail: true,
  manualRefreshRequired: false,
  zeroDesyncAfterRemount: true,
  authority: "database",
} as const;

export const SAVED_EMPTY_STATE = {
  title: "Nothing saved",
  hint: "Tap ♥ on a listing.",
  cta: "Browse",
  ctaHref: "/search",
} as const;

export const SAVED_FORBIDDEN = [
  "Collections",
  "Followers",
  "Following",
  "Lists",
  "Undo button",
  "Social features",
  "Multiple Saved systems",
  "LocalStorage authority",
  "FavouriteStore",
  "SavedHeartButton SSOT bus",
  "SavedSsotBridge",
  "publishSavedLive shared bus",
  "sessionStorage authority",
] as const;
