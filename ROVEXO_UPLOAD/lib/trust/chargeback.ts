import { createAdminClient } from "@/lib/supabase/admin";
import { onChargeback } from "@/lib/trust/events";

export async function syncChargebackTrustFromDispute(input: {
  disputeId: string;
  paymentIntentId: string | null;
}): Promise<void> {
  if (!input.paymentIntentId) return;

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, seller_id")
    .eq("stripe_payment_intent_id", input.paymentIntentId)
    .maybeSingle();

  if (!order?.seller_id) return;

  await onChargeback({
    orderId: order.id,
    sellerId: String(order.seller_id),
    disputeId: input.disputeId,
  });
}
