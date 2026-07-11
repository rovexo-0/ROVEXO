"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Rating } from "@/components/ui/Rating";
import { AccountModuleShell } from "@/features/account-module/components/AccountModuleShell";
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
    <AccountModuleShell title="My Reviews" backHref="/account" version="v1.0">
      <section className="acm-reviews-summary" aria-labelledby="reviews-overall-rating" data-reviews-version="v1.0">
        <h2 id="reviews-overall-rating" className="sr-only">
          Overall rating
        </h2>
        <div className="acm-reviews-summary__stars" aria-hidden>
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className={index < Math.round(displayRating) ? "acm-reviews-summary__star acm-reviews-summary__star--on" : "acm-reviews-summary__star"}
            >
              ★
            </span>
          ))}
        </div>
        <p className="acm-reviews-summary__score">{displayRating > 0 ? displayRating.toFixed(1) : "—"}</p>
        <p className="acm-reviews-summary__total">{reviewCount} Total Reviews</p>
      </section>

      {reviews.length === 0 ? (
        <div className="acm-empty">
          <p className="acm-empty__title">No reviews yet</p>
          <p className="acm-empty__text">Reviews from buyers will appear here after completed orders.</p>
        </div>
      ) : (
        <ul className="acm-reviews-list">
          {reviews.map((review) => (
            <li key={review.id} className="acm-reviews-item">
              <Avatar
                src={review.reviewerAvatarUrl}
                alt={review.reviewerName ?? "Reviewer"}
                name={review.reviewerName ?? "Buyer"}
                size="md"
              />
              <div className="acm-reviews-item__body">
                <div className="acm-reviews-item__head">
                  <p className="acm-reviews-item__name">{review.reviewerName ?? "Buyer"}</p>
                  <Rating value={review.rating} size="sm" />
                </div>
                {review.comment ? <p className="acm-reviews-item__comment">{review.comment}</p> : null}
                <time className="acm-reviews-item__date" dateTime={review.createdAt}>
                  {formatReviewDate(review.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AccountModuleShell>
  );
}
