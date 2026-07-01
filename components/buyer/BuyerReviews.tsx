"use client";

import Link from "next/link";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { BuyerSection } from "@/components/buyer/BuyerSection";
import { useBuyerDashboard } from "@/hooks/buyer";

export function BuyerReviews() {
  const { data } = useBuyerDashboard();
  const { reviews } = data;

  return (
    <BuyerSection id="buyer-reviews" title="Reviews" href="/orders">
      <article className="buyer-card">
        <RovexoIcon icon={RovexoIcons.actions.star} variant="category" />
        <p className="buyer-stat-card__value">{reviews.count}</p>
        <p className="buyer-stat-card__label">Reviews given</p>
        {reviews.averageRating > 0 ? (
          <p className="buyer-order-active__meta">Average rating {reviews.averageRating.toFixed(1)}</p>
        ) : (
          <p className="buyer-order-active__meta">Leave reviews after completed orders.</p>
        )}
        <Link href="/orders" className="buyer-section__link">
          Review purchases
        </Link>
      </article>
    </BuyerSection>
  );
}
