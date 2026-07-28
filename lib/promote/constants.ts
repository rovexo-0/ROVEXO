/**
 * ROVEXO STORE SHOWCASE ENGINE v1.0 (LOCK) — constants + public contract.
 *
 * Fair visibility for the ENTIRE store. Not position buying. Not Pay to Win.
 * Only option: 7 days · £6.30
 */

export const STORE_SHOWCASE_ENGINE_NAME = "ROVEXO STORE SHOWCASE ENGINE" as const;
export const STORE_SHOWCASE_ENGINE_VERSION = "v1.0" as const;
export const STORE_SHOWCASE_PRODUCTION_READY = true as const;

/** Canonical feature id — Master Engine / Smart Feature registry. */
export const STORE_SHOWCASE_FEATURE_ID = "store-showcase" as const;

/** Persistence type on existing `seller_promotions` (no new schema). */
export const STORE_SHOWCASE_PERSISTENCE_TYPE = "store_featured" as const;

/** Only package. */
export const STORE_SHOWCASE_DURATION_DAYS = 7 as const;
export const STORE_SHOWCASE_PACKAGE_ID = "7d" as const;

/** £6.30 — only price. */
export const STORE_SHOWCASE_PRICE_CENTS = 630 as const;
export const STORE_SHOWCASE_PRICE_LABEL = "£6.30" as const;

/** Production: hide when fewer than this many active listings. */
export const STORE_SHOWCASE_MIN_LISTINGS = 2 as const;

/** After expiration — waiting period before repurchase. */
export const STORE_SHOWCASE_REPURCHASE_WAIT_HOURS = 24 as const;

/** Day 7 maximum row hint (fair exposure floor — not a purchased slot). */
export const STORE_SHOWCASE_DAY7_MAX_ROW = 20 as const;

/** Surfaces Store Showcase may improve discoverability on (never “buy first place”). */
export const STORE_SHOWCASE_SURFACES = [
  "entire-store",
  "seller-profile",
  "all-listings",
  "search",
  "categories",
  "recommended",
  "suggested-stores",
] as const;

export type StoreShowcaseSurface = (typeof STORE_SHOWCASE_SURFACES)[number];

/** User-facing copy only — never expose decay / row math. */
export const STORE_SHOWCASE_USER_COPY = {
  title: "Store Showcase",
  durationLabel: "7 Days",
  priceLabel: STORE_SHOWCASE_PRICE_LABEL,
  promotes: [
    "Entire Store Visibility",
    "Featured Exposure",
    "Automatic Expiration",
  ],
  tagline: "More visibility for your whole store — fair exposure, automatic expiration.",
} as const;
