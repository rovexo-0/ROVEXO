import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { CommerceEngine } from "@/lib/commerce-engine";
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
import {
  isRovexoWalletRefundCreditEligible,
  ROVEXO_WALLET_REFUND_METHOD,
} from "@/lib/wallet/security";
import { accumulateRefundedGbp } from "@/lib/stripe/refund-math-v1";

type ApplyRefundLifecycleInput = {
  orderId: string;
  refundId: string;
  /** This refund intent amount (not cumulative). Lifecycle accumulates. */
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
      "id, order_number, buyer_id, seller_id, refund_status, refund_created_at, stripe_refund_id, stripe_payment_intent_id, total, refunded_amount",
    )
    .eq("id", input.orderId)
    .maybeSingle();

  if (!existing) {
    return "failed";
  }

  const previousStatus = (existing.refund_status as OrderRefundStatus | null) ?? "none";
  const createdAt = existing.refund_created_at ?? now;
  const completedAt = mappedStatus === "completed" ? now : null;
  const alreadyRefunded = Number(existing.refunded_amount ?? 0);
  const thisAmount = Number(input.amount);
  const sameRefundId = Boolean(existing.stripe_refund_id) && existing.stripe_refund_id === input.refundId;

  /*
   * Same refundId retry: do not accumulate again.
   * New refundId (legitimate partial / remaining): accumulate this intent amount.
   */
  const cumulativeRefunded = sameRefundId
    ? alreadyRefunded
    : accumulateRefundedGbp(
        Number.isFinite(alreadyRefunded) ? alreadyRefunded : 0,
        Number.isFinite(thisAmount) && thisAmount > 0 ? thisAmount : 0,
      );

  const expectedAlready = Number.isFinite(alreadyRefunded) ? alreadyRefunded : 0;

  /*
   * CAS on refunded_amount — concurrent new intents cannot both accumulate the same base.
   * Same-refundId retries skip the amount predicate (status/metadata refresh only).
   */
  let updateQuery = admin
    .from("orders")
    .update({
      stripe_refund_id: input.refundId,
      refunded_amount: cumulativeRefunded,
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

  if (!sameRefundId) {
    if (existing.refunded_amount == null) {
      updateQuery = updateQuery.is("refunded_amount", null);
    } else {
      updateQuery = updateQuery.eq("refunded_amount", expectedAlready);
    }
  }

  const { data: claimed } = await updateQuery.select("id");

  if (!sameRefundId && !claimed?.length) {
    /* Concurrent accumulate lost the race — do not credit; caller may retry. */
    const { data: again } = await admin
      .from("orders")
      .select("stripe_refund_id, refund_status, refunded_amount")
      .eq("id", input.orderId)
      .maybeSingle();
    if (again?.stripe_refund_id === input.refundId) {
      return (again.refund_status as OrderRefundStatus) ?? mappedStatus;
    }
    return "failed";
  }

  if (input.notify === false) {
    return mappedStatus;
  }

  const [{ data: buyer }, { data: seller }] = await Promise.all([
    admin.from("profiles").select("email").eq("id", existing.buyer_id).maybeSingle(),
    admin.from("profiles").select("email").eq("id", existing.seller_id).maybeSingle(),
  ]);

  const { data: orderItem } = await admin
    .from("order_items")
    .select("title, image_url")
    .eq("order_id", input.orderId)
    .limit(1)
    .maybeSingle();

  const amount = Number.isFinite(thisAmount) && thisAmount > 0 ? thisAmount : 0;
  const orderNumber = existing.order_number;
  const productTitle = orderItem?.title ?? undefined;
  const productImageUrl = orderItem?.image_url ?? undefined;
  const isNewRefundIntent = !sameRefundId;

  if (
    isNewRefundIntent &&
    (mappedStatus === "initiated" ||
      mappedStatus === "processing" ||
      mappedStatus === "completed") &&
    !["initiated", "processing", "completed"].includes(previousStatus)
  ) {
    await notifyRefundInitiated({
      buyerId: existing.buyer_id,
      buyerEmail: buyer?.email ?? "",
      orderId: input.orderId,
      orderNumber,
      amount,
      reference,
      productTitle,
      productImageUrl,
      destination: isRovexoWalletRefundCreditEligible({
        refundId: input.refundId,
        paymentMethod: input.paymentMethod ?? null,
      })
        ? "wallet"
        : "card",
    });
    if (input.notifySeller !== false) {
      await notifySellerRefundInitiated({
        sellerId: existing.seller_id,
        sellerEmail: seller?.email ?? "",
        orderId: input.orderId,
        orderNumber,
        productImageUrl,
      });
    }
  }

  /*
   * Credit per refundId (idempotent). Allow completed→completed for additional
   * legitimate partials — do NOT gate on previousStatus !== "completed".
   */
  if (mappedStatus === "completed" && amount > 0) {
    if (
      isRovexoWalletRefundCreditEligible({
        refundId: input.refundId,
        paymentMethod: input.paymentMethod ?? null,
      })
    ) {
      await CommerceEngine.creditBuyerWallet({
        orderId: input.orderId,
        buyerId: existing.buyer_id,
        refundId: input.refundId,
        amount,
        orderNumber,
        productTitle: `Refund — ${orderNumber}`,
        productImageUrl,
        paymentMethod: input.paymentMethod ?? ROVEXO_WALLET_REFUND_METHOD,
        paymentId: existing.stripe_payment_intent_id ?? null,
      });
    }

    if (isNewRefundIntent || previousStatus !== "completed") {
      await notifyRefundCompleted({
        buyerId: existing.buyer_id,
        buyerEmail: buyer?.email ?? "",
        orderId: input.orderId,
        orderNumber,
        amount,
        reference,
        productTitle,
        productImageUrl,
        destination: isRovexoWalletRefundCreditEligible({
          refundId: input.refundId,
          paymentMethod: input.paymentMethod ?? null,
        })
          ? "wallet"
          : "card",
      });
    }
  }

  if (mappedStatus === "failed" && previousStatus !== "failed") {
    await notifyRefundFailed({
      buyerId: existing.buyer_id,
      buyerEmail: buyer?.email ?? "",
      orderId: input.orderId,
      orderNumber,
      productImageUrl,
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
