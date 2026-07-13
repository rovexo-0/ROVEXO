/**
 * Account Seller Performance summary — rating display from engine values.
 */
export function formatAccountSellerRatingDisplay(rating: number, reviewCount: number): string {
  if (reviewCount <= 0) return "⭐ New";

  const clamped = Math.max(0, Math.min(5, rating));
  const filled = Math.min(5, Math.max(0, Math.floor(clamped)));
  const stars = `${"★".repeat(filled)}${"☆".repeat(5 - filled)}`;

  return `${stars} ${clamped.toFixed(1)}`;
}
