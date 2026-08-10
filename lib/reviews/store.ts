import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { onReviewSubmitted } from "@/lib/trust/events";
import {
  buildRatingDistribution,
  emptyRatingDistribution,
} from "@/lib/reviews/rating-distribution";
import { isValidRating } from "@/lib/rating/rating-engine-v1";
import { isReviewWindowOpen } from "@/lib/reviews/review-window-v1";
import type {
  CreateReviewInput,
  ReplyToReviewInput,
  Review,
  ReviewEligibility,
  SellerRatingSummary,
  UpdateReviewInput,
} from "@/lib/reviews/types";
import {
  PUBLIC_IDENTITY_FALLBACKS,
  resolvePublicUsernameLabel,
} from "@/lib/profile/public-display-name-v1";

const REVIEW_BLOCKED_STATUSES = new Set([
  "awaiting_payment",
  "awaiting_shipment",
  "shipped",
  "delivered",
  "issue_open",
  "cancelled",
]);

type OrderEligibilityRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  paid_at?: string | null;
  delivered_at?: string | null;
  completed_at?: string | null;
  refunded_at?: string | null;
  refund_status?: string | null;
  review_window_closed?: boolean;
  review_window_closes_at?: string | null;
  review_window_opens_at?: string | null;
};

function eligibilityBlockReason(status: string): string {
  switch (status) {
    case "awaiting_payment":
      return "Review is unavailable until payment is completed.";
    case "cancelled":
      return "Cancelled orders cannot be reviewed.";
    case "issue_open":
      return "Review is unavailable while a dispute is active.";
    case "awaiting_shipment":
    case "shipped":
    case "delivered":
      return "Review is available after the order is completed.";
    default:
      return "Review is available after order completion.";
  }
}

function assertOrderAllowsReview(order: OrderEligibilityRow): string | null {
  const status = String(order.status ?? "");

  if (status === "cancelled") return eligibilityBlockReason(status);
  if (status === "issue_open") return eligibilityBlockReason(status);
  if (order.refunded_at || order.refund_status === "completed") {
    return "Refunded orders cannot be reviewed.";
  }
  if (REVIEW_BLOCKED_STATUSES.has(status) || status !== "completed") {
    return eligibilityBlockReason(status);
  }
  if (!order.paid_at) {
    return "Review is unavailable until payment is completed.";
  }
  if (!order.delivered_at && !order.completed_at) {
    return "Review is available after delivery is completed.";
  }
  if (
    !isReviewWindowOpen({
      closed: order.review_window_closed,
      opensAt: order.review_window_opens_at,
      closesAt: order.review_window_closes_at,
    })
  ) {
    return "The review window has closed.";
  }
  return null;
}

function mapReview(row: {
  id: string;
  order_id: string;
  reviewer_id: string;
  reviewee_id: string;
  product_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at?: string | null;
  verified_purchase?: boolean | null;
  reply_text?: string | null;
  reply_at?: string | null;
  reply_author_id?: string | null;
  reviewer?: { full_name: string; username?: string | null; avatar_url?: string | null } | null;
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
    updatedAt: row.updated_at ?? undefined,
    reviewerName: resolvePublicUsernameLabel(
      row.reviewer?.username,
      PUBLIC_IDENTITY_FALLBACKS.member,
    ),
    reviewerUsername: row.reviewer?.username ?? null,
    reviewerAvatarUrl: row.reviewer?.avatar_url ?? null,
    verifiedPurchase: row.verified_purchase !== false,
    replyText: row.reply_text ?? null,
    replyAt: row.reply_at ?? null,
    replyAuthorId: row.reply_author_id ?? null,
  };
}

async function loadOrderForReview(orderId: string): Promise<OrderEligibilityRow | null> {
  // Participant check still enforces buyer/seller; admin read avoids RLS false "Order not found"
  // when the authenticated client cookie jar cannot see a just-completed order row.
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, buyer_id, seller_id, status, paid_at, delivered_at, completed_at, refunded_at, refund_status, review_window_opens_at, review_window_closes_at, review_window_closed",
    )
    .eq("id", orderId)
    .maybeSingle();
  return (order as OrderEligibilityRow | null) ?? null;
}

export async function getReviewEligibility(
  orderId: string,
  reviewerId: string,
): Promise<ReviewEligibility> {
  const order = await loadOrderForReview(orderId);
  if (!order) {
    return { canReview: false, reason: "Order not found." };
  }

  const isBuyer = order.buyer_id === reviewerId;
  const isSeller = order.seller_id === reviewerId;
  if (!isBuyer && !isSeller) {
    return { canReview: false, reason: "Only order participants can leave a review." };
  }

  if (order.buyer_id === order.seller_id) {
    return { canReview: false, reason: "Self-review is not allowed." };
  }

  const block = assertOrderAllowsReview(order);
  if (block) {
    return { canReview: false, reason: block };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("reviews")
    .select("*")
    .eq("order_id", orderId)
    .eq("reviewer_id", reviewerId)
    .maybeSingle();

  if (existing) {
    const mapped = mapReview(existing);
    const canEdit = isReviewWindowOpen({
      closed: order.review_window_closed,
      opensAt: order.review_window_opens_at,
      closesAt: order.review_window_closes_at,
    });
    return {
      canReview: false,
      reason: "You already reviewed this order.",
      existingReview: mapped,
      canEdit,
      canReply: false,
    };
  }

  return { canReview: true };
}

export async function createOrderReview(
  reviewerId: string,
  input: CreateReviewInput,
): Promise<{ review: Review } | { error: string }> {
  if (!isValidRating(input.rating)) {
    return { error: "Rating must be a whole number between 1 and 5." };
  }

  const eligibility = await getReviewEligibility(input.orderId, reviewerId);
  if (!eligibility.canReview) {
    return { error: eligibility.reason ?? "Unable to submit review." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_order_review", {
    p_order_id: input.orderId,
    p_reviewer_id: reviewerId,
    p_rating: input.rating,
    p_comment: input.comment,
  });

  if (error || !data) {
    const message = error?.message ?? "Unable to submit review.";
    if (/self-review/i.test(message)) {
      return { error: "Self-review is not allowed." };
    }
    if (/already submitted/i.test(message)) {
      return { error: "You already reviewed this order." };
    }
    if (/Maximum two reviews/i.test(message)) {
      return { error: "Maximum two reviews per order." };
    }
    if (/Only order participants/i.test(message)) {
      return { error: "Only order participants can leave a review." };
    }
    if (/between 1 and 5/i.test(message)) {
      return { error: "Rating must be a whole number between 1 and 5." };
    }
    return { error: message };
  }

  const { data: review } = await admin
    .from("reviews")
    .select("*")
    .eq("id", data as string)
    .single();

  if (!review) {
    return { error: "Review created but could not be loaded." };
  }

  void onReviewSubmitted({
    orderId: input.orderId,
    reviewerId,
    revieweeId: review.reviewee_id,
    rating: input.rating,
  });

  // Existing notification path (Reviews Engine does not redesign Notifications).
  void (async () => {
    try {
      const { data: orderItem } = await admin
        .from("order_items")
        .select("title, image_url")
        .eq("order_id", input.orderId)
        .limit(1)
        .maybeSingle();
      const { emitSmartNotification } = await import("@/lib/notifications/events");
      const { NOTIFICATION_ROUTES } = await import("@/lib/notifications/routing");
      const stars = "★".repeat(Math.min(5, Math.max(1, Math.round(input.rating))));
      await emitSmartNotification({
        userId: review.reviewee_id,
        eventType: "review_received",
        idempotencyKey: `review-received:${review.id}`,
        notificationType: "review",
        title: "Review received",
        subtitle: stars,
        detail: orderItem?.title ?? undefined,
        href: NOTIFICATION_ROUTES.reviews,
        avatarUrl: orderItem?.image_url ?? undefined,
        avatarName: orderItem?.title ?? undefined,
        payload: { orderId: input.orderId, reviewId: review.id },
      });
    } catch {
      /* fail-closed — review already persisted */
    }
  })();

  return { review: mapReview(review) };
}

export async function updateOrderReview(
  reviewerId: string,
  input: UpdateReviewInput,
): Promise<{ review: Review } | { error: string }> {
  if (input.rating != null && !isValidRating(input.rating)) {
    return { error: "Rating must be a whole number between 1 and 5." };
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("reviews")
    .select("*")
    .eq("id", input.reviewId)
    .maybeSingle();

  if (!existing) return { error: "Review not found." };
  if (existing.reviewer_id !== reviewerId) {
    return { error: "You can only edit your own review." };
  }

  const order = await loadOrderForReview(existing.order_id);
  if (!order) return { error: "Order not found." };
  if (
    !isReviewWindowOpen({
      closed: order.review_window_closed,
      opensAt: order.review_window_opens_at,
      closesAt: order.review_window_closes_at,
    })
  ) {
    return { error: "The review window has closed." };
  }

  const patch: {
    rating?: number;
    comment?: string | null;
    updated_at: string;
  } = { updated_at: new Date().toISOString() };
  if (input.rating != null) patch.rating = input.rating;
  if (input.comment !== undefined) {
    patch.comment = input.comment?.trim() ? input.comment.trim() : null;
  }

  const { data: updated, error } = await admin
    .from("reviews")
    .update(patch)
    .eq("id", input.reviewId)
    .eq("reviewer_id", reviewerId)
    .select("*")
    .single();

  if (error || !updated) {
    return { error: "Unable to update review." };
  }

  return { review: mapReview(updated) };
}

export async function replyToReview(
  userId: string,
  input: ReplyToReviewInput,
): Promise<{ review: Review } | { error: string }> {
  const text = input.replyText?.trim() ?? "";
  if (!text) return { error: "Reply text is required." };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("reviews")
    .select("*")
    .eq("id", input.reviewId)
    .maybeSingle();

  if (!existing) return { error: "Review not found." };
  if (existing.reviewee_id !== userId) {
    return { error: "Only the reviewed user may reply." };
  }
  if (existing.reply_text) {
    return { error: "A reply already exists for this review." };
  }

  const { data: updated, error } = await admin
    .from("reviews")
    .update({
      reply_text: text,
      reply_at: new Date().toISOString(),
      reply_author_id: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.reviewId)
    .eq("reviewee_id", userId)
    .is("reply_text", null)
    .select("*")
    .single();

  if (error || !updated) {
    return { error: "Unable to save reply." };
  }

  return { review: mapReview(updated) };
}

async function enrichSellerReviewsForStore(reviews: Review[]): Promise<Review[]> {
  if (reviews.length === 0) return reviews;

  const admin = createAdminClient();
  const productIds = [
    ...new Set(reviews.map((r) => r.productId).filter((id): id is string => Boolean(id))),
  ];
  const orderIds = [...new Set(reviews.map((r) => r.orderId).filter(Boolean))];

  const productById = new Map<
    string,
    { slug: string; title: string; imageUrl: string | null }
  >();
  const orderById = new Map<
    string,
    { status: string; buyerId: string; productIds: Set<string> }
  >();

  if (productIds.length > 0) {
    const { data: products } = await admin
      .from("products")
      .select("id, slug, title, product_images ( url, thumbnail_url, sort_order, is_primary )")
      .in("id", productIds);

    for (const row of products ?? []) {
      const images = [...((row.product_images as Array<Record<string, unknown>>) ?? [])].sort(
        (a, b) =>
          Number(b.is_primary) - Number(a.is_primary) ||
          Number(a.sort_order) - Number(b.sort_order),
      );
      const primary = images[0];
      productById.set(String(row.id), {
        slug: String(row.slug ?? ""),
        title: String(row.title ?? ""),
        imageUrl:
          (primary?.thumbnail_url as string | undefined) ??
          (primary?.url as string | undefined) ??
          null,
      });
    }
  }

  if (orderIds.length > 0) {
    const { data: orders } = await admin
      .from("orders")
      .select("id, status, buyer_id, order_items ( product_id )")
      .in("id", orderIds);

    for (const row of orders ?? []) {
      const itemProductIds = new Set(
        ((row.order_items as Array<{ product_id?: string }> | null) ?? [])
          .map((item) => item.product_id)
          .filter((id): id is string => Boolean(id)),
      );
      orderById.set(String(row.id), {
        status: String(row.status ?? ""),
        buyerId: String(row.buyer_id ?? ""),
        productIds: itemProductIds,
      });
    }
  }

  return reviews.map((review) => {
    const product = review.productId ? productById.get(review.productId) : undefined;
    const order = orderById.get(review.orderId);
    const listingMatches =
      Boolean(review.productId) &&
      (order?.productIds.has(review.productId!) ||
        (!order?.productIds.size && Boolean(review.productId)));
    const verifiedPurchase = Boolean(
      order &&
        order.status === "completed" &&
        order.buyerId === review.reviewerId &&
        listingMatches,
    );

    return {
      ...review,
      verifiedPurchase,
      productSlug: product?.slug || null,
      productImageUrl: product?.imageUrl ?? null,
      productTitle: product?.title ?? null,
    };
  });
}

export async function listSellerReviews(
  sellerId: string,
  limit = 50,
): Promise<Review[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(
      `
      *,
      reviewer:profiles!reviews_reviewer_id_fkey ( full_name, username, avatar_url )
    `,
    )
    .eq("reviewee_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const mapped = (data ?? []).map((row) =>
    mapReview({
      ...row,
      reviewer: row.reviewer as { full_name: string; avatar_url?: string | null } | null,
    }),
  );

  return enrichSellerReviewsForStore(mapped);
}

export async function listOrderReviews(
  orderId: string,
  viewerId: string,
): Promise<Review[] | { error: string }> {
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("buyer_id, seller_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return { error: "Order not found." };
  }
  if (order.buyer_id !== viewerId && order.seller_id !== viewerId) {
    return { error: "Only order participants can view order reviews." };
  }

  const { data } = await supabase
    .from("reviews")
    .select(
      `
      *,
      reviewer:profiles!reviews_reviewer_id_fkey ( full_name, username, avatar_url )
    `,
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: true })
    .limit(2);

  return (data ?? []).map((row) =>
    mapReview({
      ...row,
      reviewer: row.reviewer as { full_name: string; avatar_url?: string | null } | null,
    }),
  );
}

export async function getSellerRatingSummary(sellerId: string): Promise<SellerRatingSummary> {
  const supabase = await createClient();

  // Rating Engine v1.0 SSOT: average + count from valid reviews rows only.
  const { data: ratingRows } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewee_id", sellerId);

  const distribution = buildRatingDistribution(ratingRows ?? []);
  const reviewCount = (ratingRows ?? []).length;
  const averageRating =
    reviewCount > 0
      ? (ratingRows ?? []).reduce((sum, row) => sum + Number(row.rating), 0) / reviewCount
      : 0;

  return {
    averageRating,
    reviewCount,
    distribution: reviewCount > 0 ? distribution : emptyRatingDistribution(),
  };
}

export async function getReviewForOrder(orderId: string): Promise<Review | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(
      `
      *,
      reviewer:profiles!reviews_reviewer_id_fkey ( full_name, username, avatar_url )
    `,
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return mapReview({
    ...data,
    reviewer: data.reviewer as { full_name: string; avatar_url?: string | null } | null,
  });
}

export async function getParticipantReview(
  orderId: string,
  reviewerId: string,
): Promise<Review | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("order_id", orderId)
    .eq("reviewer_id", reviewerId)
    .maybeSingle();
  return data ? mapReview(data) : null;
}
