/**
 * Premium empty-state illustration library.
 * Assets: public/assets/empty-states/{id}.{avif,webp,png}
 */

export const PREMIUM_EMPTY_STATE_IDS = [
  "featured-listings",
  "popular-auctions",
  "recommended",
  "recently-listed",
  "business-spotlight",
  "continue-browsing",
  "messages",
  "notifications",
  "wishlist",
  "orders",
  "wallet",
  "reviews",
] as const;

export type PremiumEmptyStateId = (typeof PREMIUM_EMPTY_STATE_IDS)[number];

export const PREMIUM_EMPTY_STATE_SIZES = [240, 480, 960] as const;

const EMPTY_STATE_SET = new Set<string>(PREMIUM_EMPTY_STATE_IDS);

export function isPremiumEmptyStateId(value: string): value is PremiumEmptyStateId {
  return EMPTY_STATE_SET.has(value);
}

export function getPremiumEmptyStatePngSrc(id: PremiumEmptyStateId): string {
  return `/assets/empty-states/${id}.png`;
}

export function getPremiumEmptyStateSrcSet(
  id: PremiumEmptyStateId,
  format: "avif" | "webp" | "png",
): string {
  return PREMIUM_EMPTY_STATE_SIZES.map((size) => {
    const suffix = size === 960 ? "" : `-${size}`;
    return `/assets/empty-states/${id}${suffix}.${format} ${size}w`;
  }).join(", ");
}

/** Maps homepage section titles to premium empty-state assets */
export function resolveHomeSectionEmptyStateId(title: string): PremiumEmptyStateId {
  const normalized = title.toLowerCase();
  if (normalized.includes("featured")) return "featured-listings";
  if (normalized.includes("recommended")) return "recommended";
  if (normalized.includes("recently")) return "recently-listed";
  if (normalized.includes("auction")) return "popular-auctions";
  if (normalized.includes("business")) return "business-spotlight";
  if (normalized.includes("browsing") || normalized.includes("continue")) return "continue-browsing";
  return "featured-listings";
}
