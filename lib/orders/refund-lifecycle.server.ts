import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  estimateRefundArrival,
  formatRefundReference,
  mapStripeRefundStatus,
  type OrderRefundStatus,
} from "@/lib/orders/refund-status";
import {
  notifyRefundCompleted,
  notifyRefundFailed,
  notifyRefundInitiated,
  notifySellerRefundInitiated,
} from "@/lib/orders/notifications";

type ApplyRefundLifecycleInput = {
  orderId: string;
  refundId: string;
  amount: number;
  stripeStatus?: string | null;
  paymentMethod?: string | null;
  failureReason?: string | null;
  notify?: boolean;
  notifySeller?: boolean;
};

export async function markOrderCancellationRequested(orderId: string): Promise<void> {
  const now = new Date().toISOString();
  const admin = createAdminClient();
  await admin
    .from("orders")
    .update({
      refund_status: "cancellation_requested",
      refund_last_updated: now,
    })
    .eq("id", orderId);
}

export async function applyOrderRefundLifecycle(input: ApplyRefundLifecycleInput): Promise<OrderRefundStatus> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const mappedStatus = mapStripeRefundStatus(input.stripeStatus);
  const reference = formatRefundReference(input.refundId);
  const estimatedArrival = estimateRefundArrival(now);

  const { data: existing } = await admin
    .from("orders")
    .select(
      "id, order_number, buyer_id, seller_id, refund_status, refund_created_at, stripe_refund_id, total",
    )
    .eq("id", input.orderId)
    .maybeSingle();

  if (!existing) {
    return "failed";
  }

  const previousStatus = (existing.refund_status as OrderRefundStatus | null) ?? "none";
  const createdAt = existing.refund_created_at ?? now;
  const completedAt = mappedStatus === "completed" ? now : null;

  await admin
    .from("orders")
    .update({
      stripe_refund_id: input.refundId,
      refunded_amount: input.amount,
      refund_reference: reference,
      refund_status: mappedStatus,
      refund_created_at: createdAt,
      refund_completed_at: completedAt,
      refunded_at: completedAt,
      refund_payment_method: input.paymentMethod ?? "Original payment method",
      refund_estimated_arrival: mappedStatus === "completed" ? null : estimatedArrival,
      refund_failure_reason: mappedStatus === "failed" ? input.failureReason ?? "Refund could not be completed." : null,
      refund_last_updated: now,
    })
    .eq("id", input.orderId);

  if (input.notify === false) {
    return mappedStatus;
  }

  const [{ data: buyer }, { data: seller }] = await Promise.all([
    admin.from("profiles").select("email").eq("id", existing.buyer_id).maybeSingle(),
    admin.from("profiles").select("email").eq("id", existing.seller_id).maybeSingle(),
  ]);

  const amount = input.amount || Number(existing.total);
  const orderNumber = existing.order_number;

  if (
    mappedStatus === "initiated" ||
    mappedStatus === "processing" ||
    (mappedStatus === "completed" && !["initiated", "processing", "completed"].includes(previousStatus))
  ) {
    if (!["initiated", "processing", "completed"].includes(previousStatus)) {
      await notifyRefundInitiated({
        buyerId: existing.buyer_id,
        buyerEmail: buyer?.email ?? "",
        orderNumber,
        amount,
        reference,
      });
      if (input.notifySeller !== false) {
        await notifySellerRefundInitiated({
          sellerId: existing.seller_id,
          sellerEmail: seller?.email ?? "",
          orderNumber,
        });
      }
    }
  }

  if (mappedStatus === "completed" && previousStatus !== "completed") {
    await notifyRefundCompleted({
      buyerId: existing.buyer_id,
      buyerEmail: buyer?.email ?? "",
      orderNumber,
      amount,
      reference,
    });
  }

  if (mappedStatus === "failed" && previousStatus !== "failed") {
    await notifyRefundFailed({
      buyerId: existing.buyer_id,
      buyerEmail: buyer?.email ?? "",
      orderNumber,
    });
  }

  return mappedStatus;
}

export async function syncOrderRefundFromStripe(input: {
  paymentIntentId: string;
  refundId: string;
  amount: number;
  stripeStatus?: string | null;
  failureReason?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, stripe_refund_id, refund_status")
    .eq("stripe_payment_intent_id", input.paymentIntentId)
    .maybeSingle();

  if (!order) return;

  await applyOrderRefundLifecycle({
    orderId: order.id,
    refundId: input.refundId,
    amount: input.amount,
    stripeStatus: input.stripeStatus,
    failureReason: input.failureReason,
    notify: true,
  });
}
