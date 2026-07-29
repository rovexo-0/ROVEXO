import "server-only";

import { createClient } from "@/lib/supabase/server";
import { fetchOrderForUser } from "@/lib/orders/queries";
import { buildOrderConversationHref } from "@/lib/orders/order-conversation-href";

/**
 * Server resolve: order id → Conversation Hub (direct when possible).
 * Used by /orders/[id] and /seller/orders/[id] redirects.
 */
export async function resolveOrderConversationHrefForUser(
  orderId: string,
  userId: string,
  options?: { focus?: "tracking" },
): Promise<string> {
  const order = await fetchOrderForUser(orderId, userId);
  if (!order) {
    return "/orders";
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select("id")
    .eq("product_id", order.product.id)
    .eq("buyer_id", order.buyer.id)
    .eq("seller_id", order.seller.id)
    .maybeSingle();

  return buildOrderConversationHref({
    orderId: order.id,
    conversationId: data?.id ?? null,
    focus: options?.focus,
  });
}
