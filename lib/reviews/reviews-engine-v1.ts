/**
 * ROVEXO REVIEWS ENGINE v1.0 — ABSOLUTE BLOOD CODE
 *
 * Extends certified Rating Engine (DO NOT MODIFY Rating Engine lock).
 * ONE table: public.reviews
 * ONE store: lib/reviews/store.ts
 * ONE API: /api/reviews
 *
 * Absolute law: NO COMPLETED TRANSACTION = NO REVIEW
 * Max 2 reviews per order · one per participant · Verified Purchase automatic
 * One public reply from reviewed user · no nested threads
 */

import { REVIEW_WINDOW_DAYS } from "@/lib/reviews/follow-rating-badge-spec-v1";

export const REVIEWS_ENGINE_V1 = {
  version: "1.0",
  table: "reviews",
  apiPath: "/api/reviews",
  store: "lib/reviews/store.ts",
  lock: "lib/reviews/reviews-engine-v1.ts",
  migration: "supabase/migrations/20260727010000_reviews_engine_v1_dual_slots.sql",
  absoluteLaw: "NO_COMPLETED_TRANSACTION_NO_REVIEW",
  extends: "lib/rating/rating-engine-v1.ts",
  columns: {
    orderId: "order_id",
    reviewerId: "reviewer_id",
    reviewedUserId: "reviewee_id",
    rating: "rating",
    comment: "comment",
    verifiedPurchase: "verified_purchase",
    replyText: "reply_text",
    replyAt: "reply_at",
    replyAuthorId: "reply_author_id",
  },
  rules: {
    orderBackedOnly: true,
    maxReviewsPerOrder: 2,
    oneReviewPerParticipant: true,
    buyerReviewsSeller: true,
    sellerReviewsBuyer: true,
    neverOverwriteOppositeSlot: true,
    verifiedPurchaseAutomatic: true,
    verifiedPurchaseImmutableByUser: true,
    ratingRequired: true,
    textOptional: true,
    ratingWithoutTextValid: true,
    editOnlyInsideReviewWindow: true,
    immutableAfterWindow: true,
    userDeleteForbidden: true,
    superAdminMayRemove: true,
    onePublicReplyFromReviewedUser: true,
    noReplyChains: true,
    noNestedComments: true,
    authenticatedOnly: true,
    optimisticUi: true,
    rollbackOnFailure: true,
  },
  reviewWindowDays: REVIEW_WINDOW_DAYS,
  requiredOrderStatus: "completed" as const,
} as const;
