/**
 * Checkout Absolute Law v1.0 FINAL LOCK — DONE readiness gate.
 * DONE must not exist until ALL gates PASS. Zero exceptions.
 */

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { TRANSACTION_ENGINE_fromOrderId } from "@/lib/checkout/engines/transaction-engine-v1";
import type { OrderStatus } from "@/lib/orders/types";

const PAID_ORDER_STATUSES = new Set<OrderStatus>([
  "awaiting_shipment",
  "shipped",
  "delivered",
  "completed",
  "issue_open",
]);

export type DoneReadinessGate = {
  paymentCaptured: boolean;
  orderCreated: boolean;
  transactionCreated: boolean;
  conversationCreated: boolean;
  systemMessagesCreated: boolean;
  paymentLifecycleCreated: boolean;
  allPass: boolean;
  conversationId: string | null;
  transactionId: string | null;
};

/**
 * Absolute Law golden rule:
 * If the user can see DONE → every gate below is PASS.
 */
export async function evaluateDoneReadinessGate(input: {
  orderId: string;
  buyerId: string;
}): Promise<DoneReadinessGate> {
  const admin = createAdminClient();
  const fail: DoneReadinessGate = {
    paymentCaptured: false,
    orderCreated: false,
    transactionCreated: false,
    conversationCreated: false,
    systemMessagesCreated: false,
    paymentLifecycleCreated: false,
    allPass: false,
    conversationId: null,
    transactionId: null,
  };

  const { data: order } = await admin
    .from("orders")
    .select(
      "id, buyer_id, seller_id, status, paid_at, stripe_payment_intent_id, stripe_session_id",
    )
    .eq("id", input.orderId)
    .maybeSingle();

  if (!order || order.buyer_id !== input.buyerId) {
    return fail;
  }

  const orderCreated = true;
  const paymentCaptured =
    PAID_ORDER_STATUSES.has(order.status as OrderStatus) &&
    (Boolean(order.paid_at) ||
      Boolean(order.stripe_payment_intent_id) ||
      Boolean(order.stripe_session_id) ||
      order.status === "awaiting_shipment" ||
      order.status === "shipped" ||
      order.status === "delivered" ||
      order.status === "completed");

  const paymentLifecycleCreated = PAID_ORDER_STATUSES.has(order.status as OrderStatus);

  const transactionId = TRANSACTION_ENGINE_fromOrderId(order.id);
  const transactionCreated = Boolean(transactionId);

  const { data: item } = await admin
    .from("order_items")
    .select("product_id")
    .eq("order_id", order.id)
    .limit(1)
    .maybeSingle();

  let conversationId: string | null = null;
  if (item?.product_id) {
    const { data: conversation } = await admin
      .from("conversations")
      .select("id")
      .eq("product_id", item.product_id)
      .eq("buyer_id", order.buyer_id)
      .eq("seller_id", order.seller_id)
      .maybeSingle();
    conversationId = conversation?.id ?? null;
  }

  const conversationCreated = Boolean(conversationId);

  let systemMessagesCreated = false;
  if (conversationId) {
    const { count } = await admin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId);
    systemMessagesCreated = (count ?? 0) > 0;
  }

  const allPass =
    paymentCaptured &&
    orderCreated &&
    transactionCreated &&
    conversationCreated &&
    systemMessagesCreated &&
    paymentLifecycleCreated;

  return {
    paymentCaptured,
    orderCreated,
    transactionCreated,
    conversationCreated,
    systemMessagesCreated,
    paymentLifecycleCreated,
    allPass,
    conversationId,
    transactionId,
  };
}
