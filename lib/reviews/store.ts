import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CreateReviewInput, Review, ReviewEligibility } from "@/lib/reviews/types";

function mapReview(row: {
  id: string;
  order_id: string;
  reviewer_id: string;
  reviewee_id: string;
  product_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: { full_name: string } | null;
}): Review {
  return {
    id: row.id,
    orderId: row.order_id,
    reviewerId: row.reviewer_id,
    revieweeId: row.reviewee_id,
    productId: row.product_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    reviewerName: row.reviewer?.full_name,
  };
}

export async function getReviewEligibility(
  orderId: string,
  buyerId: string,
): Promise<ReviewEligibility> {
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, buyer_id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return { canReview: false, reason: "Order not found." };
  }

  if (order.buyer_id !== buyerId) {
    return { canReview: false, reason: "Only the buyer can leave a review." };
  }

  if (order.status !== "completed") {
    return { canReview: false, reason: "Review is available after order completion." };
  }

  const { data: existing } = await supabase
    .from("reviews")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existing) {
    return {
      canReview: false,
      reason: "You already reviewed this order.",
      existingReview: mapReview(existing),
    };
  }

  return { canReview: true };
}

export async function createOrderReview(
  buyerId: string,
  input: CreateReviewInput,
): Promise<{ review: Review } | { error: string }> {
  const eligibility = await getReviewEligibility(input.orderId, buyerId);
  if (!eligibility.canReview) {
    return { error: eligibility.reason ?? "Unable to submit review." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_order_review", {
    p_order_id: input.orderId,
    p_reviewer_id: buyerId,
    p_rating: input.rating,
    p_comment: input.comment,
  });

  if (error || !data) {
    return { error: error?.message ?? "Unable to submit review." };
  }

  const { data: review } = await admin
    .from("reviews")
    .select("*")
    .eq("id", data as string)
    .single();

  if (!review) {
    return { error: "Review created but could not be loaded." };
  }

  return { review: mapReview(review) };
}

export async function listSellerReviews(
  sellerId: string,
  limit = 20,
): Promise<Review[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(
      `
      *,
      reviewer:profiles!reviews_reviewer_id_fkey ( full_name )
    `,
    )
    .eq("reviewee_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) =>
    mapReview({
      ...row,
      reviewer: row.reviewer as { full_name: string } | null,
    }),
  );
}

export async function getReviewForOrder(orderId: string): Promise<Review | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  return data ? mapReview(data) : null;
}
