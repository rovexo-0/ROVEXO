"use client";

import {
  CanonicalSection,
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalInfoBlock,
} from "@/src/components/canonical";
import { AccountIcon } from "@/components/account/AccountIcons";
import { AccountCanonicalShell } from "@/features/account-canonical";
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
              icon={
                <span className="ac-canonical__menu-icon" aria-hidden>
                  <AccountIcon name="reviews" />
                </span>
              }
            />
          </CanonicalCard>
        </CanonicalSection>

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
                      ? `${review.comment} · ${formatReviewDate(review.createdAt)}`
                      : formatReviewDate(review.createdAt)
                  }
                  value={`${review.rating}/5`}
                  showChevron={false}
                  icon={
                    <span className="ac-canonical__menu-icon" aria-hidden>
                      <AccountIcon name="reviews" />
                    </span>
                  }
                />
              ))}
            </CanonicalCard>
          </CanonicalSection>
        )}
      </div>
    </AccountCanonicalShell>
  );
}
