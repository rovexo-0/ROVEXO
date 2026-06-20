"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Rating } from "@/components/ui/Rating";
import type { Review } from "@/lib/reviews/types";

type OrderReviewCardProps = {
  orderId: string;
  sellerName: string;
};

export function OrderReviewCard({ orderId, sellerName }: OrderReviewCardProps) {
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
    } finally {
      setIsSubmitting(false);
    }
  }, [comment, orderId, rating]);

  if (existingReview) {
    return (
      <Card padding="lg" className="flex flex-col gap-ds-3 shadow-ds-soft">
        <h2 className="text-base font-semibold text-text-primary">Your review</h2>
        <Rating value={existingReview.rating} size="sm" />
        {existingReview.comment && (
          <p className="text-sm text-text-secondary">{existingReview.comment}</p>
        )}
      </Card>
    );
  }

  if (!canReview) {
    if (!message) return null;
    return (
      <Card padding="lg" className="shadow-ds-soft">
        <p className="text-sm text-text-secondary">{message}</p>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="flex flex-col gap-ds-4 shadow-ds-soft">
      <h2 className="text-base font-semibold text-text-primary">Rate {sellerName}</h2>

      <div className="flex gap-ds-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={`h-10 w-10 rounded-full border text-sm font-semibold ${
              rating >= value
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-secondary"
            }`}
            onClick={() => setRating(value)}
            aria-label={`Rate ${value} out of 5`}
          >
            {value}
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Share your experience (optional)"
        className="min-h-[96px] w-full rounded-ds-md border border-border bg-surface px-ds-3 py-ds-2 text-sm text-text-primary"
      />

      {message && <p className="text-sm text-text-secondary">{message}</p>}

      <Button
        variant="primary"
        fullWidth
        disabled={isSubmitting}
        onClick={() => void submitReview()}
      >
        Submit Review
      </Button>
    </Card>
  );
}
