/**
 * My Account profile header rating — canonical review aggregate display.
 */
export function formatAccountProfileRating(rating: number, reviewCount: number): string {
  if (reviewCount <= 0) return "⭐ New";
  return `⭐ ${rating.toFixed(1)}`;
}

export function formatSellerPerformanceRating(rating: number, reviewCount: number): string {
  if (reviewCount <= 0) return "⭐ New";
  return `⭐ ${rating.toFixed(1)} (${reviewCount})`;
}
