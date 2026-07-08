import { createAdminClient } from "@/lib/supabase/admin";
import { CommerceEngine } from "@/lib/commerce-engine";
import { createOrderStripeRefund } from "@/lib/stripe/refunds";
import { releaseProductInventory } from "@/lib/inventory/service";
import { notifyOrderRefunded } from "@/lib/orders/notifications";
import { onOrderRefunded } from "@/lib/trust/events";
import { recordAutomationLog } from "@/lib/resolution-engine/audit";
import { updateResolutionCaseStatus } from "@/lib/resolution-engine/cases";

export type AutoRefundType = "full" | "partial" | "shipping";

/**
 * Execute an automatic refund through certified Stripe + Commerce Engine paths.
 * No admin intervention. Idempotent per order.
 */
export async function executeAutomaticRefund(input: {
  orderId: string;
  caseId: string;
  ruleId: string;
  refundType?: AutoRefundType;
  amount?: number;
  reason?: string;
}): Promise<{ success: boolean; refundId?: string; error?: string }> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, order_number, buyer_id, seller_id, total, item_price, stripe_refund_id, order_items(product_id, quantity)",
    )
    .eq("id", input.orderId)
    .maybeSingle();

  if (!order) {
    return { success: false, error: "Order not found." };
  }

  if (order.stripe_refund_id) {
    await updateResolutionCaseStatus({
      caseId: input.caseId,
      status: "REFUNDED",
      decision: "already_refunded",
      refundAmount: Number(order.total),
      resolvedAt: new Date().toISOString(),
    });
    return { success: true, refundId: order.stripe_refund_id };
  }

  const refundResult = await createOrderStripeRefund(input.orderId);
  if ("error" in refundResult) {
    await recordAutomationLog({
      orderId: input.orderId,
      caseId: input.caseId,
      action: "refund_failed",
      ruleId: input.ruleId,
      decision: refundResult.error,
      stripeResponse: { error: refundResult.error },
    });
    return { success: false, error: refundResult.error };
  }

  const item = (
    order.order_items as Array<{ product_id: string | null; quantity: number }> | null
  )?.[0];
  if (item?.product_id) {
    await releaseProductInventory(item.product_id, item.quantity ?? 1);
  }

  const refundAmount = input.amount ?? Number(order.total);

  await CommerceEngine.refundSeller({
    orderId: input.orderId,
    sellerId: order.seller_id,
    buyerId: order.buyer_id,
    refundType: input.refundType ?? "full",
    amount: refundAmount,
    stripeRefundId: refundResult.refundId,
    reason: input.reason ?? "automatic_resolution",
  });

  const [{ data: buyerProfile }, { data: sellerProfile }] = await Promise.all([
    admin.from("profiles").select("email").eq("id", order.buyer_id).maybeSingle(),
    admin.from("profiles").select("email").eq("id", order.seller_id).maybeSingle(),
  ]);

  await notifyOrderRefunded({
    buyerId: order.buyer_id,
    buyerEmail: buyerProfile?.email ?? "",
    sellerId: order.seller_id,
    sellerEmail: sellerProfile?.email ?? "",
    orderNumber: order.order_number,
    amount: refundAmount,
  });

  void onOrderRefunded({
    orderId: input.orderId,
    buyerId: order.buyer_id,
    sellerId: order.seller_id,
  });

  await admin.from("orders").update({ status: "cancelled" }).eq("id", input.orderId);

  await updateResolutionCaseStatus({
    caseId: input.caseId,
    status: "REFUNDED",
    decision: "automatic_refund",
    refundAmount,
    resolvedAt: new Date().toISOString(),
  });

  await recordAutomationLog({
    orderId: input.orderId,
    caseId: input.caseId,
    action: "refund_completed",
    ruleId: input.ruleId,
    decision: "automatic_refund",
    stripeResponse: { refundId: refundResult.refundId },
    metadata: { refundType: input.refundType ?? "full", amount: refundAmount },
  });

  return { success: true, refundId: refundResult.refundId };
}
