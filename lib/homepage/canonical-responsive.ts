/**
 * ROVEXO Canonical Homepage — responsive engine (design reference: iPhone,
 * scales proportionally across the full device matrix).
 */

/** Reference listing card proportions (iPhone design reference). */
export const HP_LISTING_REF = {
  width: 160,
  height: 340,
  imageHeight: 220,
  bodyHeight: 120,
} as const;

/** Reference featured-store product card proportions. */
export const HP_STORE_CARD_REF = {
  width: 112,
  height: 206,
  imageHeight: 118,
} as const;

/** Grid column breakpoints — largest match wins (sync with CanonicalHomepage.module.css). */
export const HP_FEED_COLUMN_QUERIES = [
  { query: "(min-width: 1920px)", columns: 6 },
  { query: "(min-width: 1440px)", columns: 5 },
  { query: "(min-width: 1024px)", columns: 4 },
  { query: "(min-width: 834px)", columns: 3 },
  { query: "(min-width: 640px)", columns: 3 },
] as const;

export const HP_FEED_DEFAULT_COLUMNS = 2;

/** Certification / Playwright viewport matrix. */
export const HP_RESPONSIVE_VIEWPORTS = [
  { id: "iphone-se", label: "iPhone SE", width: 375, height: 667 },
  { id: "iphone-13", label: "iPhone 13", width: 390, height: 844 },
  { id: "iphone-15", label: "iPhone 15", width: 393, height: 852 },
  { id: "iphone-16", label: "iPhone 16", width: 393, height: 852 },
  { id: "iphone-pro-max", label: "iPhone Pro Max", width: 440, height: 956 },
  { id: "android-small", label: "Android Small", width: 360, height: 780 },
  { id: "android-medium", label: "Android Medium", width: 412, height: 915 },
  { id: "android-large", label: "Android Large", width: 480, height: 1014 },
  { id: "foldable", label: "Foldable", width: 717, height: 512 },
  { id: "tablet", label: "Tablet", width: 768, height: 1024 },
  { id: "ipad", label: "iPad", width: 820, height: 1180 },
  { id: "laptop", label: "Laptop", width: 1280, height: 800 },
  { id: "desktop", label: "Desktop", width: 1440, height: 900 },
  { id: "ultrawide", label: "UltraWide", width: 2560, height: 1080 },
] as const;

export function resolveFeedColumnCount(viewportWidth: number): number {
  for (const entry of HP_FEED_COLUMN_QUERIES) {
    const minWidth = Number.parseInt(entry.query.match(/\d+/)?.[0] ?? "0", 10);
    if (viewportWidth >= minWidth) return entry.columns;
  }
  return HP_FEED_DEFAULT_COLUMNS;
}

export function matchFeedColumnsFromMedia(): number {
  if (typeof window === "undefined") return HP_FEED_DEFAULT_COLUMNS;

  for (const { query, columns } of HP_FEED_COLUMN_QUERIES) {
    if (window.matchMedia(query).matches) return columns;
  }
  return HP_FEED_DEFAULT_COLUMNS;
}
