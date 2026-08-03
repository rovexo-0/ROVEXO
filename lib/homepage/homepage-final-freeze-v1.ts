/**
 * ROVEXO v1.0 — HOMEPAGE CEO FINAL LOCK (Compact Premium Freeze)
 *
 * STATUS: FINAL LOCK · P0 ABSOLUTE AUTHORITY · UK FIRST
 * Allowed after lock: bug · performance · security · a11y · DB optimizations only.
 * Forbidden: Homepage / Showcase / card redesign · social Follow · extra badges/tabs/buttons · layout changes.
 *
 * Social Follow permanently removed (CEO Social System Removal).
 */

export const HOMEPAGE_CEO_FINAL_LOCK_VERSION = "1.0" as const;
export const HOMEPAGE_CEO_FINAL_LOCK_STATUS = "FINAL_LOCK" as const;
export const HOMEPAGE_CEO_FINAL_LOCK_PRIORITY = "P0" as const;

/** @deprecated Alias — use HOMEPAGE_CEO_FINAL_LOCK_* */
export const HOMEPAGE_FINAL_FREEZE_VERSION = HOMEPAGE_CEO_FINAL_LOCK_VERSION;
/** @deprecated Alias — use HOMEPAGE_CEO_FINAL_LOCK_* */
export const HOMEPAGE_FINAL_FREEZE_STATUS = "LOCKED" as const;
/** @deprecated Alias — use HOMEPAGE_CEO_FINAL_LOCK_* */
export const HOMEPAGE_FINAL_FREEZE_PRIORITY = HOMEPAGE_CEO_FINAL_LOCK_PRIORITY;

/**
 * Store fallback — seller deleted/removed/banned · store deleted · listing deleted.
 * Never show 404 / Page not found / internal errors.
 */
export const STORE_UNAVAILABLE_COPY = {
  title: "Store unavailable",
  body: "This Store is currently unavailable.",
  backLabel: "BACK",
} as const;

/** Listing deleted uses the same Owner Store unavailable surface (CEO Final Lock). */
export const LISTING_UNAVAILABLE_COPY = STORE_UNAVAILABLE_COPY;

/** Showcase / Store / Product — only these route families. */
export const HOMEPAGE_VALID_ROUTE_PREFIXES = [
  "/user/",
  "/store/",
  "/listing/",
] as const;

export const HOMEPAGE_CEO_FINAL_LOCK = {
  version: HOMEPAGE_CEO_FINAL_LOCK_VERSION,
  status: HOMEPAGE_CEO_FINAL_LOCK_STATUS,
  priority: HOMEPAGE_CEO_FINAL_LOCK_PRIORITY,
  ukFirst: true,
  compactPremium: true,
  mobileFirst: true,
  socialFollow: "PERMANENTLY_REMOVED" as const,
  /** Marketplace Following feed must not mount on Homepage (Owner 2026-08-03). */
  homepageFollowingFeed: "REMOVED" as const,
  showcase: {
    horizontalScrollOnly: true,
    newestFirst: true,
    listingMax: 9,
    viewAllCards: 1,
    railMax: 10,
    pagination: false,
    infiniteScroll: false,
    advertisements: false,
  },
  storeRoutes: ["/user/[username]", "/store/[slug]"] as const,
  productRoute: "/listing/[slug]",
  allowedAfterLock: [
    "bug fixes",
    "performance improvements",
    "security fixes",
    "accessibility fixes",
    "database optimizations",
  ] as const,
  forbiddenAfterLock: [
    "Homepage redesign",
    "Showcase redesign",
    "card redesign",
    "Follow / social features",
    "additional badges",
    "additional tabs",
    "extra buttons",
    "layout modifications",
  ] as const,
} as const;

const FORBIDDEN_SEGMENT = /^(null|undefined|nan|true|false)$/i;

export function isSafeRouteSegment(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed || FORBIDDEN_SEGMENT.test(trimmed)) return false;
  if (trimmed.includes("/") || trimmed.includes("?") || trimmed.includes("#")) return false;
  if (trimmed.includes(" ")) return false;
  return true;
}

export function isValidHomepageStoreHref(href: string | null | undefined): boolean {
  if (!href || typeof href !== "string") return false;
  const path = href.trim();
  if (path.startsWith("/user/")) {
    return isSafeRouteSegment(path.slice("/user/".length));
  }
  if (path.startsWith("/store/")) {
    return isSafeRouteSegment(path.slice("/store/".length));
  }
  return false;
}

export function isValidHomepageListingHref(href: string | null | undefined): boolean {
  if (!href || typeof href !== "string") return false;
  const path = href.trim();
  if (!path.startsWith("/listing/")) return false;
  return isSafeRouteSegment(path.slice("/listing/".length));
}

export function listingHrefFromSlug(slug: string | null | undefined): string | null {
  if (!isSafeRouteSegment(slug)) return null;
  return `/listing/${slug!.trim()}`;
}
