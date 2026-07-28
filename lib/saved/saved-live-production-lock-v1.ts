/**
 * ROVEXO v1.0 — SAVED LIVE PRODUCTION LOCK
 *
 * STATUS: PRODUCTION LOCK · FROZEN · OWNER AUTHORITY
 * Canonical: https://www.rovexo.co.uk
 * Source: origin/main|develop Saved heart/API (LIVE behaviour)
 *
 * FREEZE: YES — no redesign · no extra features · no alternate Saved systems
 */

export const SAVED_LIVE_PRODUCTION_LOCK = "1.0" as const;
export const SAVED_LIVE_STATUS = "PRODUCTION_LOCK" as const;
export const SAVED_LIVE_FREEZE = true as const;
export const SAVED_LIVE_CANONICAL = "https://www.rovexo.co.uk" as const;
export const SAVED_LIVE_SOURCE_REF = "origin/main + origin/develop Saved heart/API" as const;

/** Owner-allowed surface only (PRODUCTION LOCK). */
export const SAVED_PRODUCTION_ALLOWED = [
  "Save",
  "Unsave",
  "Empty state",
  "Login",
  "Logout",
  "Refresh",
  "Cross surface synchronization",
  "Database truth",
] as const;

/** Owner-forbidden forever under this freeze. */
export const SAVED_PRODUCTION_FORBIDDEN = [
  "Collections",
  "Followers",
  "Following",
  "Lists",
  "Undo button",
  "Social features",
  "Multiple Saved systems",
  "LocalStorage authority",
] as const;

/**
 * LIVE DOES THIS — SAVE (Homepage / Search ListingCard)
 *
 * 1. User clicks heart
 * 2. UI: setIsSaved(true) immediately (optimistic, ~0ms)
 * 3. POST /api/saved { productSlug }
 * 4. DB: saved_items upsert
 * 5. Response { saved: true } → keep red; if !ok → rollback white
 * 6. Navigate to /saved → server listSavedItems → product appears
 * 7. Remount other surfaces → GET /api/saved?slug= → DB truth
 * 8. Refresh (F5) → DB truth (allowed; not required for sync)
 */
export const LIVE_SAVE_FLOW = [
  "CLICK heart",
  "OPTIMISTIC setIsSaved(true) 0ms",
  "POST /api/saved { productSlug }",
  "DB upsert saved_items",
  "OK → keep ♥ · FAIL → rollback ♡",
  "Saved page load → GET list from DB → product visible",
  "Other surfaces remount → GET ?slug= → DB boolean",
  "Refresh → DB truth",
] as const;

/**
 * LIVE DOES THIS — UNSAVE (Saved page controlled heart)
 *
 * 1. User clicks heart on Saved card
 * 2. DELETE /api/saved { productSlugs: [slug] }
 * 3. DB delete
 * 4. Response { items: SavedItem[] } → setItems(items) immediately
 * 5. Empty list → empty state UI
 * 6. Homepage remount → GET ?slug= → false → ♡
 * 7. Refresh → DB truth
 */
export const LIVE_UNSAVE_FLOW = [
  "CLICK heart on Saved (controlled)",
  "DELETE /api/saved { productSlugs }",
  "DB delete saved_items",
  "OK → setItems(payload.items) immediately",
  "items.length===0 → empty state",
  "Homepage/Search remount → GET ?slug= → ♡",
  "Refresh → DB truth",
] as const;

/**
 * LIVE DOES THIS — Heart hook (useProductWatchlist)
 * Per-card useState · optimistic toggle · GET hydrate on mount · no shared bus
 * Refresh allowed (DB truth) · soft refresh not required for ♥ sync
 */
export const LIVE_HEART_RULES = {
  optimistic: true,
  uiUpdateMs: 0,
  sharedSsotBus: false,
  softRefreshRequired: false,
  refreshAllowedShowsDbTruth: true,
  hydrateOnMount: "GET /api/saved?slug=",
  rollbackOnFail: true,
  authority: "database",
} as const;

export const LIVE_EMPTY_STATE = {
  title: "Nothing saved",
  hint: "Tap ♥ on a listing.",
  cta: "Browse",
  ctaHref: "/search",
} as const;

/**
 * LIVE DOES THIS — Product page
 * LIVE www/develop ProductDetailPage has NO header heart.
 * Similar/related cards use ListingCard → useProductWatchlist (remount hydrate).
 */
export const LIVE_PRODUCT_PAGE = {
  headerHeart: false,
  cardHearts: "ListingCard useProductWatchlist",
} as const;

export const LIVE_API = {
  getSlug: "GET /api/saved?slug=",
  getList: "GET /api/saved",
  save: "POST /api/saved { productSlug } → { saved: true }",
  unsave: "DELETE /api/saved { productSlugs } → { items }",
  table: "saved_items",
} as const;
