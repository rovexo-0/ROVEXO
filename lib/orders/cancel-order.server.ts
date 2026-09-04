import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { CommerceEngine } from "@/lib/commerce-engine";
import { releaseShippingReserveForOrder } from "@/lib/commerce-engine/shipping-reserve";
import {
  healInventoryAfterCancelledOrder,
  restoreInventoryAfterOrderCancellation,
} from "@/lib/inventory/service";
import { cancelPendingOrder } from "@/lib/orders/checkout";
import {
  evaluateBuyerCancellationEligibility,
  evaluateSellerCancellationEligibility,
  resolveBuyerCancellationReason,
  resolveCancellationShipmentGate,
  resolveSellerCancellationReason,
} from "@/lib/orders/cancellation";
import {
  notifyBuyerOrderCancelledBySeller,
  notifyOrderCancelled,
  notifySellerOrderCancelledByBuyer,
} from "@/lib/orders/notifications";
import { onOrderCancelled } from "@/lib/trust/events";
import { markOrderCancellationRequested } from "@/lib/orders/refund-lifecycle.server";
import { createOrderStripeRefund, isZeroCaptureRefundError } from "@/lib/stripe/refunds";
import { createShippingAdminClient } from "@/lib/shipping/db-client";
import { listShipmentParcelsForOrder } from "@/lib/shipping/parcels-repository";
import { SendcloudService } from "@/lib/shipping/sendcloud/service";
import { getShippingRecord, updateShippingRecordStatus } from "@/lib/shipping/store";
import type { OrderStatus } from "@/lib/orders/types";
import type { ShippingStatus } from "@/lib/shipping/types";

type CancellationContext = {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  buyerId: string;
  sellerId: string;
  total: number;
  paidAt: string | null;
  stripePaymentIntentId: string | null;
  stripeRefundId: string | null;
  productId: string | null;
  productQuantity: number;
  productTitle: string;
  shippingRecordStatus: ShippingStatus | null;
  parcelStatuses: ShippingStatus[];
  hasReadyLabel: boolean;
  providerParcelIds: string[];
  parcelIdsToVoid: string[];
};

async function loadCancellationContext(orderId: string): Promise<CancellationContext | null> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      buyer_id,
      seller_id,
      total,
      paid_at,
      stripe_payment_intent_id,
      stripe_refund_id,
      order_items ( product_id, title, quantity )
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;

  const item = (
    order.order_items as Array<{ product_id: string | null; title: string; quantity: number }> | null
  )?.[0];

  const record = await getShippingRecord(orderId);
  const parcels = await listShipmentParcelsForOrder(orderId);
  const gate = resolveCancellationShipmentGate({
    shippingRecordStatus: record?.status ?? null,
    shippingRecordTracking: record?.trackingNumber ?? null,
    parcels,
  });

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    status: order.status as OrderStatus,
    buyerId: order.buyer_id,
    sellerId: order.seller_id,
    total: Number(order.total),
    paidAt: order.paid_at,
    stripePaymentIntentId: order.stripe_payment_intent_id,
    stripeRefundId: order.stripe_refund_id,
    productId: item?.product_id ?? null,
    productQuantity: item?.quantity ?? 1,
    productTitle: item?.title ?? "Item",
    shippingRecordStatus: gate.shippingRecordStatus,
    parcelStatuses: gate.parcelStatuses,
    hasReadyLabel: gate.hasReadyLabel,
    providerParcelIds: gate.providerParcelIds,
    parcelIdsToVoid: gate.parcelIdsToVoid,
  };
}

export async function getBuyerOrderCancellationEligibility(
  orderId: string,
  buyerId: string,
): Promise<{ canCancel: boolean; reason?: string }> {
  const context = await loadCancellationContext(orderId);
  if (!context || context.buyerId !== buyerId) {
    return { canCancel: false, reason: "Order not found." };
  }

  const eligibility = evaluateBuyerCancellationEligibility({
    status: context.status,
    shippingRecordStatus: context.shippingRecordStatus,
    parcelStatuses: context.parcelStatuses,
    hasReadyLabel: context.hasReadyLabel,
  });

  return { canCancel: eligibility.allowed, reason: eligibility.reason };
}

function isIdempotentSendcloudCancelError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already cancelled") ||
    normalized.includes("already canceled") ||
    normalized.includes("parcel is cancelled") ||
    normalized.includes("parcel is canceled") ||
    normalized.includes("not found")
  );
}

/**
 * Cancel announced Sendcloud parcels. Idempotent for already-cancelled / missing parcels.
 * Must ONLY run after a confirmed Stripe refund (or when no payment refund is required).
 */
async function cancelSendcloudParcels(providerParcelIds: string[]): Promise<void> {
  for (const rawId of providerParcelIds) {
    const parcelId = Number.parseInt(rawId, 10);
    if (!Number.isFinite(parcelId) || parcelId <= 0) continue;
    try {
      await SendcloudService.cancelParcel(parcelId);
    } catch (error) {
      if (isIdempotentSendcloudCancelError(error)) continue;
      throw error;
    }
  }
}

async function voidLocalShippingArtifacts(
  orderId: string,
  reason: string,
  parcelIdsToVoid: string[],
): Promise<void> {
  const record = await getShippingRecord(orderId);
  if (!record) return;

  const shippingAdmin = createShippingAdminClient();
  const now = new Date().toISOString();

  const voidIds = new Set(parcelIdsToVoid);
  if (voidIds.size > 0) {
    await shippingAdmin
      .from("shipping_labels_v1")
      .update({ label_status: "void", updated_at: now })
      .eq("shipping_record_id", record.id)
      .in("shipment_parcel_id", [...voidIds])
      .not("label_status", "eq", "void");
  }

  const parcels = await listShipmentParcelsForOrder(orderId);
  for (const parcel of parcels) {
    if (!voidIds.has(parcel.id)) continue;
    if (parcel.status === "cancelled" || parcel.status === "failed") continue;
    await shippingAdmin
      .from("shipment_parcels")
      .update({ status: "cancelled", updated_at: now })
      .eq("id", parcel.id);
  }

  if (record.status !== "cancelled") {
    await updateShippingRecordStatus({
      orderId,
      status: "cancelled",
      title: "Order cancelled",
      description: reason,
    });
  }
}

/**
 * Refund succeeded but carrier cancel failed — never reverse the refund.
 * Use existing shipping status `failed` for reconciliation (do not mark cancelled).
 */
async function markCarrierCancellationFailed(orderId: string, detail: string): Promise<void> {
  const record = await getShippingRecord(orderId);
  if (!record) return;
  if (record.status === "cancelled") return;

  await updateShippingRecordStatus({
    orderId,
    status: "failed",
    title: "Carrier cancellation pending",
    description: `Buyer refund completed. Sendcloud parcel cancellation requires reconciliation: ${detail}`.slice(
      0,
      500,
    ),
  });
}

async function markOrderCancelled(input: {
  orderId: string;
  reason: string;
}): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  await admin
    .from("orders")
    .update({
      status: "cancelled",
      cancelled_at: now,
      cancellation_reason: input.reason,
    })
    .eq("id", input.orderId);
}

/**
 * Cancel may proceed with £0 when capture/virtual debit is proven zero.
 * Lookup failure remains fail-closed — do not cancel a possibly paid order.
 */
async function refundCapturedPaymentOrZero(
  orderId: string,
  reason: "OTHER" | "SELLER_CANCEL" = "OTHER",
): Promise<{ ok: true; refundId: string | null } | { ok: false; error: string }> {
  const refundResult = await createOrderStripeRefund(orderId, {
    notifySeller: false,
    // Cancel retains Buyer Protection fee (not PLATFORM_ERROR).
    reason,
  });
  if ("error" in refundResult) {
    if (isZeroCaptureRefundError(refundResult.error)) {
      return { ok: true, refundId: null };
    }
    return { ok: false, error: refundResult.error };
  }
  return { ok: true, refundId: refundResult.refundId };
}

async function claimOrderCancellation(
  orderId: string,
): Promise<"claimed" | "already" | "failed"> {
  const admin = createAdminClient();
  const claimKey = `cancel:${orderId}`;
  const { data: claimed, error: claimError } = await admin
    .from("orders")
    .update({ cancel_claim_key: claimKey })
    .eq("id", orderId)
    .is("cancel_claim_key", null)
    .neq("status", "cancelled")
    .select("id");
  if (claimError?.code === "23505") {
    return "already";
  }
  if (!claimed?.length) {
    const { data: again } = await admin
      .from("orders")
      .select("status, cancel_claim_key")
      .eq("id", orderId)
      .maybeSingle();
    if (again?.status === "cancelled" || again?.cancel_claim_key) {
      return "already";
    }
    return "failed";
  }
  return "claimed";
}

async function releaseOrderCancellationClaim(orderId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("orders")
    .update({ cancel_claim_key: null })
    .eq("id", orderId)
    .eq("cancel_claim_key", `cancel:${orderId}`)
    .neq("status", "cancelled");
}

/**
 * Buyer-initiated order cancellation with automatic Stripe refund when payment succeeded.
 * Idempotent when the order is already cancelled.
 */
export async function cancelBuyerOrder(input: {
  orderId: string;
  buyerId: string;
  /** Canonical reason option id from BUYER_CANCELLATION_REASON_OPTIONS. */
  cancellationReasonId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const cancellationReason = resolveBuyerCancellationReason(input.cancellationReasonId);
  const context = await loadCancellationContext(input.orderId);
  if (!context || context.buyerId !== input.buyerId) {
    return { success: false, error: "Order not found." };
  }

  if (context.status === "cancelled") {
    /* Heal sold/reserved inventory without double-incrementing published stock. */
    if (context.productId) {
      await healInventoryAfterCancelledOrder(context.productId, context.productQuantity);
    }
    return { success: true };
  }

  const eligibility = evaluateBuyerCancellationEligibility({
    status: context.status,
    shippingRecordStatus: context.shippingRecordStatus,
    parcelStatuses: context.parcelStatuses,
    hasReadyLabel: context.hasReadyLabel,
  });

  if (!eligibility.allowed) {
    return { success: false, error: eligibility.reason ?? "Order cannot be cancelled." };
  }

  /* P1-B — single-effect cancel claim (unique cancel_claim_key). */
  {
    const claim = await claimOrderCancellation(input.orderId);
    if (claim === "already") {
      const latest = await loadCancellationContext(input.orderId);
      if (latest?.status === "cancelled") {
        return { success: true };
      }
      return { success: false, error: "Cancellation is already in progress." };
    }
    if (claim === "failed") {
      return { success: false, error: "Unable to claim cancellation." };
    }
  }

  if (context.status === "awaiting_payment") {
    await cancelPendingOrder(input.orderId, cancellationReason, { initiatedBy: "buyer" });

    const admin = createAdminClient();
    await admin
      .from("orders")
      .update({
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancellationReason,
      })
      .eq("id", input.orderId);

    const [{ data: buyerProfile }, { data: sellerProfile }] = await Promise.all([
      admin.from("profiles").select("email").eq("id", context.buyerId).maybeSingle(),
      admin.from("profiles").select("email").eq("id", context.sellerId).maybeSingle(),
    ]);

    await notifyOrderCancelled({
      buyerId: context.buyerId,
      buyerEmail: buyerProfile?.email ?? "",
      orderId: input.orderId,
      orderNumber: context.orderNumber,
      reason: cancellationReason,
    });
    await notifySellerOrderCancelledByBuyer({
      sellerId: context.sellerId,
      sellerEmail: sellerProfile?.email ?? "",
      orderId: input.orderId,
      orderNumber: context.orderNumber,
      productTitle: context.productTitle,
    });

    return { success: true };
  }

  // Financial authority first: never cancel the carrier parcel before a confirmed refund.
  // If refund fails → preserve Sendcloud shipment. If refund OK + Sendcloud fails → keep refund.
  let stripeRefundId = context.stripeRefundId;

  if (context.paidAt || context.stripePaymentIntentId) {
    await markOrderCancellationRequested(input.orderId);
    const refundResult = await refundCapturedPaymentOrZero(input.orderId);
    if (!refundResult.ok) {
      await releaseOrderCancellationClaim(input.orderId);
      return { success: false, error: refundResult.error };
    }
    stripeRefundId = refundResult.refundId;
  }

  await CommerceEngine.refundSeller({
    orderId: input.orderId,
    sellerId: context.sellerId,
    buyerId: context.buyerId,
    refundType: "full",
    amount: context.total,
    stripeRefundId,
    reason: "buyer_cancelled",
  });

  await releaseShippingReserveForOrder({ orderId: input.orderId });

  /*
   * Mark cancelled before inventory restore so retries hit the idempotent cancelled
   * branch (heal sold/reserved only — never double-increment published stock).
   */
  await markOrderCancelled({ orderId: input.orderId, reason: cancellationReason });

  if (context.productId) {
    await restoreInventoryAfterOrderCancellation(context.productId, context.productQuantity);
  }

  let carrierCancelOk = true;
  if (context.providerParcelIds.length > 0) {
    try {
      await cancelSendcloudParcels(context.providerParcelIds);
    } catch (error) {
      carrierCancelOk = false;
      const message = error instanceof Error ? error.message : String(error);
      console.error("[orders/cancel] Sendcloud cancel failed after refund — reconciliation required:", {
        orderId: input.orderId,
        message,
      });
      await markCarrierCancellationFailed(input.orderId, message);
    }
  }

  if (carrierCancelOk) {
    await voidLocalShippingArtifacts(input.orderId, cancellationReason, context.parcelIdsToVoid);
  }

  const admin = createAdminClient();
  const [{ data: buyerProfile }, { data: sellerProfile }] = await Promise.all([
    admin.from("profiles").select("email").eq("id", context.buyerId).maybeSingle(),
    admin.from("profiles").select("email").eq("id", context.sellerId).maybeSingle(),
  ]);

  await notifyOrderCancelled({
    buyerId: context.buyerId,
    buyerEmail: buyerProfile?.email ?? "",
    orderId: input.orderId,
    orderNumber: context.orderNumber,
    reason: cancellationReason,
  });
  await notifySellerOrderCancelledByBuyer({
    sellerId: context.sellerId,
    sellerEmail: sellerProfile?.email ?? "",
    orderId: input.orderId,
    orderNumber: context.orderNumber,
    productTitle: context.productTitle,
    refundInitiated: Boolean(stripeRefundId),
  });

  return { success: true };
}

export async function getSellerOrderCancellationEligibility(
  orderId: string,
  sellerId: string,
): Promise<{ canCancel: boolean; reason?: string }> {
  const context = await loadCancellationContext(orderId);
  if (!context || context.sellerId !== sellerId) {
    return { canCancel: false, reason: "Order not found." };
  }

  const eligibility = evaluateSellerCancellationEligibility({
    status: context.status,
    shippingRecordStatus: context.shippingRecordStatus,
    parcelStatuses: context.parcelStatuses,
    alreadyRefunded: Boolean(context.stripeRefundId) && context.status !== "cancelled",
  });

  return { canCancel: eligibility.allowed, reason: eligibility.reason };
}

/**
 * Seller-initiated cancellation while awaiting shipment and before carrier handover.
 * Reuses the paid buyer-cancel refund / wallet / Sendcloud helpers.
 */
export async function cancelSellerOrder(input: {
  orderId: string;
  sellerId: string;
  cancellationReasonId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const cancellationReason = resolveSellerCancellationReason(input.cancellationReasonId);
  if (!cancellationReason) {
    return { success: false, error: "Select a valid cancellation reason." };
  }

  const context = await loadCancellationContext(input.orderId);
  if (!context) {
    return { success: false, error: "Order not found." };
  }
  if (context.sellerId !== input.sellerId) {
    return { success: false, error: "Forbidden." };
  }

  if (context.status === "cancelled") {
    if (context.productId) {
      await healInventoryAfterCancelledOrder(context.productId, context.productQuantity);
    }
    return { success: true };
  }

  const eligibility = evaluateSellerCancellationEligibility({
    status: context.status,
    shippingRecordStatus: context.shippingRecordStatus,
    parcelStatuses: context.parcelStatuses,
  });

  if (!eligibility.allowed) {
    return { success: false, error: eligibility.reason ?? "Order cannot be cancelled." };
  }

  /* Same cancel_claim_key CAS as buyer — one economic cancel effect. */
  {
    const claim = await claimOrderCancellation(input.orderId);
    if (claim === "already") {
      const latest = await loadCancellationContext(input.orderId);
      if (latest?.status === "cancelled") {
        return { success: true };
      }
      return { success: false, error: "Cancellation is already in progress." };
    }
    if (claim === "failed") {
      return { success: false, error: "Unable to claim cancellation." };
    }
  }

  let stripeRefundId = context.stripeRefundId;

  if (context.paidAt || context.stripePaymentIntentId) {
    await markOrderCancellationRequested(input.orderId);
    const refundResult = await refundCapturedPaymentOrZero(input.orderId, "SELLER_CANCEL");
    if (!refundResult.ok) {
      await releaseOrderCancellationClaim(input.orderId);
      return { success: false, error: refundResult.error };
    }
    stripeRefundId = refundResult.refundId;
  }

  await CommerceEngine.refundSeller({
    orderId: input.orderId,
    sellerId: context.sellerId,
    buyerId: context.buyerId,
    refundType: "full",
    amount: context.total,
    stripeRefundId,
    reason: "seller_cancelled",
  });

  await releaseShippingReserveForOrder({ orderId: input.orderId });
  await markOrderCancelled({ orderId: input.orderId, reason: cancellationReason });

  if (context.productId) {
    await restoreInventoryAfterOrderCancellation(context.productId, context.productQuantity);
  }

  let carrierCancelOk = true;
  if (context.providerParcelIds.length > 0) {
    try {
      await cancelSendcloudParcels(context.providerParcelIds);
    } catch (error) {
      carrierCancelOk = false;
      const message = error instanceof Error ? error.message : String(error);
      console.error("[orders/cancel] Sendcloud cancel failed after seller refund — reconciliation required:", {
        orderId: input.orderId,
        message,
      });
      await markCarrierCancellationFailed(input.orderId, message);
    }
  }

  if (carrierCancelOk) {
    await voidLocalShippingArtifacts(input.orderId, cancellationReason, context.parcelIdsToVoid);
  }

  const admin = createAdminClient();
  const { data: buyerProfile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", context.buyerId)
    .maybeSingle();

  await notifyBuyerOrderCancelledBySeller({
    buyerId: context.buyerId,
    buyerEmail: buyerProfile?.email ?? "",
    orderId: input.orderId,
    orderNumber: context.orderNumber,
    reason: cancellationReason,
    refunded: Boolean(stripeRefundId),
    amount: context.total,
  });

  void onOrderCancelled({
    orderId: input.orderId,
    buyerId: context.buyerId,
    sellerId: context.sellerId,
    initiatedBy: "seller",
  });

  return { success: true };
}
