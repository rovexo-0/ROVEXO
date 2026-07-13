type AccountSellerStarRatingProps = {
  rating: number;
};

export function AccountSellerStarRating({ rating }: AccountSellerStarRatingProps) {
  const clamped = Math.max(0, Math.min(5, rating));
  const filled = Math.min(5, Math.max(0, Math.round(clamped)));

  return (
    <span
      className="ac-canonical__seller-stars"
      aria-label={`${clamped.toFixed(1)} out of 5 stars`}
    >
      {"★".repeat(filled)}
      {"☆".repeat(5 - filled)}
    </span>
  );
}
