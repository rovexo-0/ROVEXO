export type Review = {
  id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  productId: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName?: string;
};

export type CreateReviewInput = {
  orderId: string;
  rating: number;
  comment?: string;
};

export type ReviewEligibility = {
  canReview: boolean;
  reason?: string;
  existingReview?: Review | null;
};
