import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Rating } from "@/components/ui/Rating";
import { listSellerReviews } from "@/lib/reviews/store";
import { SELLER_RATING_RULES } from "@/lib/reviews/seller-rating-system-v1";
import { resolvePublicProfileHref } from "@/lib/profile/public-profile-href";
import type { Review } from "@/lib/reviews/types";
import Link from "next/link";

type SellerReviewsSectionProps = {
  sellerId: string;
  reviews: Review[];
};

export function SellerReviewsSection({ reviews }: SellerReviewsSectionProps) {
  if (!reviews.length) {
    return (
      <EmptyState
        premiumIllustrationId="reviews"
        title="No reviews yet"
        description="Reviews from buyers will appear here after completed orders."
      />
    );
  }

  return (
    <section className="flex flex-col gap-ds-3">
      <h2 className="text-base font-semibold text-text-primary">Reviews</h2>
      {reviews.map((review) => {
        const profileHref = resolvePublicProfileHref(review.reviewerUsername);
        const label = review.reviewerName ?? "Buyer";
        return (
          <Card key={review.id} padding="lg" className="">
            <div className="flex items-center justify-between gap-ds-3">
              {profileHref ? (
                <Link
                  href={profileHref}
                  className="text-sm font-medium text-text-primary"
                >
                  {label}
                </Link>
              ) : (
                <p className="text-sm font-medium text-text-primary">{label}</p>
              )}
              <Rating value={review.rating} size="sm" />
            </div>
            {(review.verifiedPurchase ?? true) ? (
              <p className="mt-ds-1 text-xs font-semibold text-emerald-600">
                {SELLER_RATING_RULES.verifiedPurchaseLabel}
              </p>
            ) : null}
            {review.comment && (
              <p className="mt-ds-2 text-sm text-text-secondary">{review.comment}</p>
            )}
          </Card>
        );
      })}
    </section>
  );
}

export async function loadSellerReviews(sellerId: string) {
  return listSellerReviews(sellerId, 10);
}
