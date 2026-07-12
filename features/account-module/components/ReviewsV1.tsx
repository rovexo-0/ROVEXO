"use client";

import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalButton, CanonicalInfoBlock, CanonicalInput, CanonicalSelector, CanonicalSwitch, CanonicalTextarea } from "@/src/components/canonical";
import { Avatar } from "@/components/ui/Avatar";
import { Rating } from "@/components/ui/Rating";
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
  const displayRating = rating > 0 ? rating : 0;

  return (
    <AccountCanonicalShell title="My Reviews" backHref="/account">
      <CanonicalSection title="Overall rating">
        <CanonicalCard variant="medium" className="flex flex-col items-center gap-ds-2 p-ds-4 text-center">
          <Rating value={displayRating} size="md" />
          <p className="cds-menu-row__title text-lg">{displayRating > 0 ? displayRating.toFixed(1) : "—"}</p>
          <p className="cds-menu-row__subtitle">{reviewCount} Total Reviews</p>
        </CanonicalCard>
      </CanonicalSection>

      {reviews.length === 0 ? (
        <CanonicalInfoBlock variant="description">
          <p className="font-medium text-text-primary">No reviews yet</p>
          <p className="mt-ds-1">Reviews from buyers will appear here after completed orders.</p>
        </CanonicalInfoBlock>
      ) : (
        <CanonicalSection title="Reviews">
          <CanonicalCard variant="list">
            {reviews.map((review) => (
              <div key={review.id} className="flex gap-ds-3 px-[var(--cds-row-padding-x)] py-ds-3">
                <Avatar
                  src={review.reviewerAvatarUrl}
                  alt={review.reviewerName ?? "Reviewer"}
                  name={review.reviewerName ?? "Buyer"}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-ds-2">
                    <p className="cds-menu-row__title">{review.reviewerName ?? "Buyer"}</p>
                    <Rating value={review.rating} size="sm" />
                  </div>
                  {review.comment ? (
                    <p className="cds-menu-row__subtitle mt-ds-1">{review.comment}</p>
                  ) : null}
                  <time className="cds-field__hint mt-ds-1 block" dateTime={review.createdAt}>
                    {formatReviewDate(review.createdAt)}
                  </time>
                </div>
              </div>
            ))}
          </CanonicalCard>
        </CanonicalSection>
      )}
    </AccountCanonicalShell>
  );
}
