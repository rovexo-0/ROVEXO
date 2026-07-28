/**
 * Profile header rating — dynamic from approved reviews, no upper limit.
 * Format: 5.0 ★ (55) · new user: 0.0 ★ (0)
 */
export function formatAccountProfileRating(rating: number, reviewCount: number): string {
  const count = Math.max(0, Math.floor(reviewCount));
  const value = count <= 0 ? 0 : Math.max(0, rating);
  return `${value.toFixed(1)} ★ (${count})`;
}

/** New Member when the user has zero reviews. */
export function isNewMemberProfile(reviewCount: number): boolean {
  return Math.max(0, Math.floor(reviewCount)) <= 0;
}

export function formatSellerPerformanceRating(rating: number, reviewCount: number): string {
  if (reviewCount <= 0) return "⭐ New";
  return `⭐ ${rating.toFixed(1)} (${reviewCount})`;
}
