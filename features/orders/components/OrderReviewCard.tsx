"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CanonicalButton, CanonicalCard, CanonicalInfoBlock } from "@/src/components/canonical";
import { Rating } from "@/components/ui/Rating";
import { FOLLOW_RATING_BADGE_STAR_COLOR } from "@/lib/reviews/follow-rating-badge-spec-v1";
import type { Review } from "@/lib/reviews/types";

function RatingStarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={22}
      height={22}
      aria-hidden
      fill={filled ? FOLLOW_RATING_BADGE_STAR_COLOR : "none"}
      stroke={FOLLOW_RATING_BADGE_STAR_COLOR}
      strokeWidth={1.4}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.753-.382-1.831-4.401Z"
      />
    </svg>
  );
}

type OrderReviewCardProps = {
  orderId: string;
  sellerName: string;
};

export function OrderReviewCard({ orderId, sellerName }: OrderReviewCardProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void fetch(`/api/reviews?orderId=${encodeURIComponent(orderId)}`)
      .then((response) => response.json())
      .then((payload: { canReview?: boolean; reason?: string; existingReview?: Review | null }) => {
        setCanReview(Boolean(payload.canReview));
        setExistingReview(payload.existingReview ?? null);
        if (!payload.canReview && payload.reason) {
          setMessage(payload.reason);
        }
      })
      .catch(() => setMessage("Unable to load review status."));
  }, [orderId]);

  const submitReview = useCallback(async () => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating, comment }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        review?: Review;
        error?: string;
      };

      if (!response.ok || !payload.success || !payload.review) {
        setMessage(payload.error ?? "Unable to submit review.");
        return;
      }

      setExistingReview(payload.review);
      setCanReview(false);
      setMessage("Thank you for your review.");
      window.dispatchEvent(new CustomEvent("rovexo:inbox-sync"));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }, [comment, orderId, rating, router]);

  if (existingReview) {
    return (
      <CanonicalCard variant="medium" className="flex w-full flex-col gap-ds-2">
        <h2 className="text-base font-semibold text-text-primary">Your review</h2>
        <Rating value={existingReview.rating} size="sm" />
        {existingReview.comment ? (
          <p className="text-sm text-text-secondary">{existingReview.comment}</p>
        ) : null}
      </CanonicalCard>
    );
  }

  if (!canReview) {
    if (!message) return null;
    return (
      <CanonicalCard variant="medium" className="w-full">
        <p className="text-sm text-text-secondary">{message}</p>
      </CanonicalCard>
    );
  }

  return (
    <CanonicalCard variant="medium" className="flex w-full flex-col gap-ds-2">
      <h2 className="text-base font-semibold text-text-primary">Rate {sellerName}</h2>

      <div className="flex gap-ds-2" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => {
          const selected = rating >= value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              className="flex h-10 w-10 items-center justify-center bg-transparent"
              style={{ opacity: selected ? 1 : 0.38 }}
              onClick={() => setRating(value)}
              aria-label={`Rate ${value} out of 5`}
            >
              <RatingStarIcon filled={selected} />
            </button>
          );
        })}
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Share your experience (optional)"
        className="min-h-[96px] w-full rx-input px-ds-3 py-ds-2 text-sm"
      />

      {message ? <CanonicalInfoBlock variant="description">{message}</CanonicalInfoBlock> : null}

      <CanonicalButton fullWidth disabled={isSubmitting} loading={isSubmitting} onClick={() => void submitReview()}>
        Submit review
      </CanonicalButton>
    </CanonicalCard>
  );
}
