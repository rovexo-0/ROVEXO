import { createAdminClient } from "@/lib/supabase/admin";

export type TrustFraudCheck = {
  blocked: boolean;
  reason?: string;
};

export async function detectReviewFraud(input: {
  orderId: string;
  reviewerId: string;
  revieweeId: string;
}): Promise<TrustFraudCheck> {
  if (input.reviewerId === input.revieweeId) {
    return { blocked: true, reason: "self_review" };
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("buyer_id, seller_id")
    .eq("id", input.orderId)
    .maybeSingle();

  if (!order) {
    return { blocked: true, reason: "missing_order" };
  }

  if (order.buyer_id === order.seller_id) {
    return { blocked: true, reason: "self_purchase" };
  }

  if (order.buyer_id !== input.reviewerId || order.seller_id !== input.revieweeId) {
    return { blocked: true, reason: "invalid_participants" };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("reviewer_id", input.revieweeId)
    .eq("reviewee_id", input.reviewerId)
    .gte("created_at", since);

  if ((count ?? 0) > 0) {
    return { blocked: true, reason: "review_exchange" };
  }

  return { blocked: false };
}

export async function detectSelfOffer(input: {
  buyerId: string;
  sellerId: string;
}): Promise<TrustFraudCheck> {
  if (input.buyerId === input.sellerId) {
    return { blocked: true, reason: "self_offer" };
  }
  return { blocked: false };
}

export async function detectOrderTrustFraud(input: {
  buyerId: string;
  sellerId: string;
}): Promise<TrustFraudCheck> {
  if (input.buyerId === input.sellerId) {
    return { blocked: true, reason: "self_purchase" };
  }
  return { blocked: false };
}
