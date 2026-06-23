import { listSellerReviews } from "@/lib/reviews/store";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Rating } from "@/components/ui/Rating";
import type { Review } from "@/lib/reviews/types";

type SellerReviewsSectionProps = {
  sellerId: string;
  reviews: Review[];
};

export function SellerReviewsSection({ reviews }: SellerReviewsSectionProps) {
  if (!reviews.length) {
    return (
      <EmptyState
        title="No reviews yet"
        description="Reviews from buyers will appear here after completed orders."
      />
    );
  }

  return (
    <section className="flex flex-col gap-ds-3">
      <h2 className="text-base font-semibold text-text-primary">Reviews</h2>
      {reviews.map((review) => (
        <Card key={review.id} padding="lg" className="shadow-ds-soft">
          <div className="flex items-center justify-between gap-ds-3">
            <p className="text-sm font-medium text-text-primary">
              {review.reviewerName ?? "Buyer"}
            </p>
            <Rating value={review.rating} size="sm" />
          </div>
          {review.comment && (
            <p className="mt-ds-2 text-sm text-text-secondary">{review.comment}</p>
          )}
        </Card>
      ))}
    </section>
  );
}

export async function loadSellerReviews(sellerId: string) {
  return listSellerReviews(sellerId, 10);
}
