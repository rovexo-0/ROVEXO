"use client";

import {
  CanonicalSection,
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalInfoBlock,
} from "@/src/components/canonical";
import { MasterMenuIcon } from "@/features/account-center/components/MasterMenuIcon";
import { MASTER_ICON_COLORS } from "@/lib/design-system/master-icon-system-v1";
import { AccountCanonicalShell } from "@/features/account-canonical";
import {
  buildRatingDistribution,
  RATING_DISTRIBUTION_LADDER,
} from "@/lib/reviews/rating-distribution";
import { SELLER_RATING_RULES } from "@/lib/reviews/seller-rating-system-v1";
import type { Review } from "@/lib/reviews/types";

function formatReviewDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

type ReviewsV1Props = {
  rating: number;
  reviewCount: number;
  reviews: Review[];
};

export function ReviewsV1({ rating, reviewCount, reviews }: ReviewsV1Props) {
  const displayRating = rating > 0 ? rating.toFixed(1) : "—";
  const distribution = buildRatingDistribution(reviews);
  const distTotal = Math.max(reviewCount, reviews.length);

  return (
    <AccountCanonicalShell title="My Reviews" backHref="/account" showHeaderTitle>
      <div className="ac-canonical">
        <CanonicalSection title="Overall">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title="Rating"
              description={`${reviewCount} reviews`}
              value={displayRating}
              showChevron={false}
              icon={<MasterMenuIcon icon="reviews" color={MASTER_ICON_COLORS.gold} />}
            />
          </CanonicalCard>
        </CanonicalSection>

        {distTotal > 0 ? (
          <CanonicalSection title="Distribution">
            <CanonicalCard variant="list">
              {RATING_DISTRIBUTION_LADDER.map(({ stars, key }) => (
                <CanonicalMenuRow
                  key={key}
                  title={`${stars} stars`}
                  description={`${Math.round((distribution[key] / distTotal) * 100)}%`}
                  value={String(distribution[key])}
                  showChevron={false}
                />
              ))}
            </CanonicalCard>
          </CanonicalSection>
        ) : null}

        {reviews.length === 0 ? (
          <CanonicalInfoBlock variant="description">
            <p className="font-medium text-text-primary">No reviews yet</p>
            <p className="mt-ds-1">Reviews appear after completed orders.</p>
          </CanonicalInfoBlock>
        ) : (
          <CanonicalSection title="Reviews">
            <CanonicalCard variant="list">
              {reviews.map((review) => (
                <CanonicalMenuRow
                  key={review.id}
                  title={review.reviewerName ?? "Buyer"}
                  description={
                    review.comment
                      ? `${SELLER_RATING_RULES.verifiedPurchaseLabel} · ${review.comment} · ${formatReviewDate(review.createdAt)}`
                      : `${SELLER_RATING_RULES.verifiedPurchaseLabel} · ${formatReviewDate(review.createdAt)}`
                  }
                  value={`${review.rating}/5`}
                  showChevron={false}
                  icon={<MasterMenuIcon icon="reviews" color={MASTER_ICON_COLORS.gold} />}
                />
              ))}
            </CanonicalCard>
          </CanonicalSection>
        )}
      </div>
    </AccountCanonicalShell>
  );
}
