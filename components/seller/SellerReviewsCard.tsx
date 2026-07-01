"use client";

import { SellerSection } from "@/components/seller/SellerSection";
import { useSellerDashboard } from "@/hooks/seller";

export function SellerReviewsCard() {
  const { data } = useSellerDashboard();
  const { reviews } = data;

  return (
    <SellerSection id="seller-reviews" title="Reviews" href="/seller/review-center">
      <div className="seller-card">
        <p className="seller-stat-card__value">{reviews.averageRating.toFixed(1)}</p>
        <p className="seller-stat-card__label">{reviews.reviewCount} reviews · {reviews.pendingResponses} pending responses</p>
      </div>
    </SellerSection>
  );
}
