/**
 * ROVEXO v1.0 — HOMEPAGE SHOWCASE FINAL FREEZE (Compact Premium Lock)
 *
 * Homepage only · horizontal scroll · 9 listings + 1 View All · newest first.
 * Store pages (Your Store / Visit Store / Business Store) remain unchanged.
 */

export const SHOWCASE_FINAL_VERSION = "1.0" as const;
export const SHOWCASE_FINAL_STATUS = "CEO_APPROVED_COMPACT_PREMIUM_FREEZE" as const;
export const SHOWCASE_FINAL_DOM = "data-hp-showcase" as const;
export const SHOWCASE_FINAL_DOM_VALUE = "v1.0-final" as const;

/** Max ListingCards in the showcase rail (slots 1–9). */
export const SHOWCASE_LISTING_MAX = 9 as const;

/** Slot 10 — single View All card. */
export const SHOWCASE_VIEW_ALL_SLOT = 10 as const;

/** Total rail items: 9 listings + 1 View All. */
export const SHOWCASE_RAIL_MAX_ITEMS = 10 as const;

export const SHOWCASE_VIEW_ALL_COPY = {
  title: "VIEW ALL",
  tapHint: "Tap to open Store",
} as const;

/** Reuses Visit Store listing-card density (96×136) on Homepage showcase only. */
export const SHOWCASE_LISTING_CARD_DENSITY = "visit" as const;

export function formatShowcaseProductCount(count: number): string {
  const safe = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  const label = safe === 1 ? "Product" : "Products";
  return `${safe.toLocaleString("en-GB")} ${label}`;
}

export function takeShowcaseListings<T extends { createdAt?: string | null; id?: string }>(
  listings: readonly T[],
): T[] {
  return [...listings]
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (bTime !== aTime) return bTime - aTime;
      return String(b.id ?? "").localeCompare(String(a.id ?? ""));
    })
    .slice(0, SHOWCASE_LISTING_MAX);
}
