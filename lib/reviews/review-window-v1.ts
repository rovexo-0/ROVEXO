/**
 * Review window engine — Absolute Blood Code XLVI
 * 4-day window after delivery keep / dispute resolve.
 * Returned orders never open a review window.
 */

import { REVIEW_WINDOW_DAYS } from "@/lib/reviews/follow-rating-badge-spec-v1";

export function computeReviewWindowCloseAt(opensAt: Date = new Date()): Date {
  return new Date(opensAt.getTime() + REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

export function isReviewWindowOpen(input: {
  closed?: boolean | null;
  opensAt?: string | null;
  closesAt?: string | null;
  now?: Date;
}): boolean {
  if (input.closed) return false;
  const now = (input.now ?? new Date()).getTime();
  if (input.closesAt) {
    const closes = new Date(input.closesAt).getTime();
    if (!Number.isNaN(closes) && now > closes) return false;
  } else if (input.opensAt) {
    const opens = new Date(input.opensAt).getTime();
    if (!Number.isNaN(opens) && now > computeReviewWindowCloseAt(new Date(opens)).getTime()) {
      return false;
    }
  }
  return true;
}

/** Returned parcels NEVER affect reputation / reviews (Blood Code XLVI). */
export const RETURNED_ORDERS_AFFECT_REPUTATION = false as const;
