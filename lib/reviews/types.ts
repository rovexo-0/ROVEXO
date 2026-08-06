export type Review = {
  id: string;
  orderId: string;
  reviewerId: string;
  /** reviewed_user_id — opposite participant */
  revieweeId: string;
  productId: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt?: string;
  reviewerName?: string;
  reviewerUsername?: string | null;
  reviewerAvatarUrl?: string | null;
  /**
   * Verified Purchase — only when order completed + buyer authored + listing matches.
   * Store v2.0: display badge only when true.
   */
  verifiedPurchase: boolean;
  /** Listing linked to the review (for Store v2.0 product thumbnail). */
  productSlug?: string | null;
  productImageUrl?: string | null;
  productTitle?: string | null;
  replyText?: string | null;
  replyAt?: string | null;
  replyAuthorId?: string | null;
};

export type CreateReviewInput = {
  orderId: string;
  rating: number;
  comment?: string;
};

export type UpdateReviewInput = {
  reviewId: string;
  rating?: number;
  comment?: string | null;
};

export type ReplyToReviewInput = {
  reviewId: string;
  replyText: string;
};

export type ReviewEligibility = {
  canReview: boolean;
  reason?: string;
  existingReview?: Review | null;
  canEdit?: boolean;
  canReply?: boolean;
};

/** 1–5 star histogram for seller rating distribution UI. */
export type RatingDistribution = {
  five: number;
  four: number;
  three: number;
  two: number;
  one: number;
};

export type SellerRatingSummary = {
  averageRating: number;
  reviewCount: number;
  distribution: RatingDistribution;
};
