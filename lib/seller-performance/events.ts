import type { RecalculationTrigger } from "@/lib/seller-performance/master-spec";
import { enqueueSellerPerformanceEvent } from "@/lib/seller-performance/queue";

function buildIdempotencyKey(
  trigger: RecalculationTrigger,
  userId: string,
  metadata?: Record<string, unknown>,
): string {
  if (metadata?.orderId) return `${trigger}:${metadata.orderId}`;
  if (metadata?.reportId) return `${trigger}:${metadata.reportId}`;
  if (metadata?.milestone) return `${trigger}:${userId}:${metadata.milestone}`;
  return `${trigger}:${userId}:${Date.now()}`;
}

export async function triggerSellerPerformanceRecalculation(input: {
  userId: string;
  trigger: RecalculationTrigger;
  metadata?: Record<string, unknown>;
  reason?: string;
  idempotencyKey?: string;
}): Promise<void> {
  try {
    await enqueueSellerPerformanceEvent({
      userId: input.userId,
      trigger: input.trigger,
      metadata: input.metadata,
      reason: input.reason,
      idempotencyKey:
        input.idempotencyKey ?? buildIdempotencyKey(input.trigger, input.userId, input.metadata),
    });
  } catch (error) {
    console.error("[seller-performance] event enqueue failed", error);
  }
}

export async function onSellerOrderCompleted(input: {
  orderId: string;
  sellerId: string;
  buyerId: string;
}): Promise<void> {
  let completedOrders: number | undefined;
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { count } = await admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", input.sellerId)
      .eq("status", "completed");
    completedOrders = count ?? undefined;
  } catch {
    completedOrders = undefined;
  }

  await triggerSellerPerformanceRecalculation({
    userId: input.sellerId,
    trigger: "completed_order",
    metadata: { orderId: input.orderId, buyerId: input.buyerId },
    idempotencyKey: `completed_order:${input.orderId}`,
  });

  const count = completedOrders;
  if (count === 1) {
    await triggerSellerPerformanceRecalculation({
      userId: input.sellerId,
      trigger: "first_sale",
      metadata: { milestone: 1 },
      idempotencyKey: `first_sale:${input.sellerId}`,
    });
  }
  if (count === 10) {
    await triggerSellerPerformanceRecalculation({
      userId: input.sellerId,
      trigger: "sales_milestone_10",
      metadata: { milestone: 10 },
      idempotencyKey: `sales_milestone_10:${input.sellerId}`,
    });
  }
  if (count === 50) {
    await triggerSellerPerformanceRecalculation({
      userId: input.sellerId,
      trigger: "sales_milestone_50",
      metadata: { milestone: 50 },
      idempotencyKey: `sales_milestone_50:${input.sellerId}`,
    });
  }
  if (count === 100) {
    await triggerSellerPerformanceRecalculation({
      userId: input.sellerId,
      trigger: "sales_milestone_100",
      metadata: { milestone: 100 },
      idempotencyKey: `sales_milestone_100:${input.sellerId}`,
    });
  }
}

export async function onSellerOrderCancelled(input: {
  orderId: string;
  sellerId: string;
}): Promise<void> {
  await triggerSellerPerformanceRecalculation({
    userId: input.sellerId,
    trigger: "cancellation",
    metadata: { orderId: input.orderId },
    idempotencyKey: `cancellation:${input.orderId}`,
  });
}

export async function onSellerOrderRefunded(input: {
  orderId: string;
  sellerId: string;
}): Promise<void> {
  await triggerSellerPerformanceRecalculation({
    userId: input.sellerId,
    trigger: "refund",
    metadata: { orderId: input.orderId },
    idempotencyKey: `refund:${input.orderId}`,
  });
}

export async function onSellerDispatch(input: {
  orderId: string;
  sellerId: string;
  late?: boolean;
}): Promise<void> {
  await triggerSellerPerformanceRecalculation({
    userId: input.sellerId,
    trigger: "dispatch",
    metadata: { orderId: input.orderId, late: Boolean(input.late) },
    idempotencyKey: `dispatch:${input.orderId}`,
  });
}

export async function onSellerReview(input: {
  orderId: string;
  revieweeId: string;
  reviewerId: string;
  rating: number;
}): Promise<void> {
  await triggerSellerPerformanceRecalculation({
    userId: input.revieweeId,
    trigger: "review",
    metadata: { orderId: input.orderId, rating: input.rating, reviewerId: input.reviewerId },
    idempotencyKey: `review:${input.orderId}`,
  });
}

export async function onSellerMessageReply(input: { sellerId: string }): Promise<void> {
  await triggerSellerPerformanceRecalculation({
    userId: input.sellerId,
    trigger: "reply",
    idempotencyKey: `reply:${input.sellerId}:${Math.floor(Date.now() / 60_000)}`,
  });
}

export async function onSellerProfileUpdate(input: { userId: string }): Promise<void> {
  await triggerSellerPerformanceRecalculation({
    userId: input.userId,
    trigger: "profile_update",
    idempotencyKey: `profile_update:${input.userId}:${Math.floor(Date.now() / 300_000)}`,
  });
}

export async function onSellerIdentityVerified(input: { userId: string }): Promise<void> {
  await triggerSellerPerformanceRecalculation({
    userId: input.userId,
    trigger: "identity_verification",
    idempotencyKey: `identity_verification:${input.userId}`,
  });
}

export async function onSellerEmailVerified(input: { userId: string }): Promise<void> {
  await triggerSellerPerformanceRecalculation({
    userId: input.userId,
    trigger: "email_verification",
    idempotencyKey: `email_verification:${input.userId}`,
  });
}

export async function onSellerPhoneVerified(input: { userId: string }): Promise<void> {
  await triggerSellerPerformanceRecalculation({
    userId: input.userId,
    trigger: "phone_verification",
    idempotencyKey: `phone_verification:${input.userId}`,
  });
}

export async function onSellerBusinessVerified(input: { userId: string }): Promise<void> {
  await triggerSellerPerformanceRecalculation({
    userId: input.userId,
    trigger: "business_verification",
    idempotencyKey: `business_verification:${input.userId}`,
  });
}

export async function onSellerValidatedReport(input: {
  sellerId: string;
  reportId: string;
}): Promise<void> {
  await triggerSellerPerformanceRecalculation({
    userId: input.sellerId,
    trigger: "validated_report",
    metadata: { reportId: input.reportId },
    idempotencyKey: `validated_report:${input.reportId}`,
  });
}

export async function onSellerAccountInactivity(input: { userId: string }): Promise<void> {
  await triggerSellerPerformanceRecalculation({
    userId: input.userId,
    trigger: "account_inactivity",
    idempotencyKey: `account_inactivity:${input.userId}:${new Date().toISOString().slice(0, 10)}`,
  });
}

export async function onSellerAccountReactivation(input: { userId: string }): Promise<void> {
  await triggerSellerPerformanceRecalculation({
    userId: input.userId,
    trigger: "account_reactivation",
    idempotencyKey: `account_reactivation:${input.userId}:${new Date().toISOString().slice(0, 10)}`,
  });
}
