import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_PRODUCT_STATUSES = new Set(["published", "sold", "reserved"]);

/**
 * Ensure buyer↔seller conversation exists after a paid order (admin/webhook safe).
 */
export async function ensureOrderConversation(input: {
  buyerId: string;
  sellerId: string;
  productId: string;
  productSlug: string;
  orderNumber: string;
}): Promise<{ conversationId: string } | { error: string }> {
  const admin = createAdminClient();

  let product: { id: string; seller_id: string; status: string } | null = null;

  if (input.productId) {
    const { data } = await admin
      .from("products")
      .select("id, seller_id, status")
      .eq("id", input.productId)
      .maybeSingle();
    product = data;
  }

  if (!product) {
    const { data } = await admin
      .from("products")
      .select("id, seller_id, status")
      .eq("slug", input.productSlug)
      .maybeSingle();
    product = data;
  }

  if (!product || product.seller_id !== input.sellerId) {
    return { error: "Product not found for conversation." };
  }

  if (!ALLOWED_PRODUCT_STATUSES.has(product.status) && product.status !== "sold") {
    // Still allow conversation for any bought listing tied to this seller
  }

  const { data: existing } = await admin
    .from("conversations")
    .select("id")
    .eq("product_id", product.id)
    .eq("buyer_id", input.buyerId)
    .eq("seller_id", input.sellerId)
    .maybeSingle();

  let conversationId = existing?.id ?? null;

  if (!conversationId) {
    const { data: created, error } = await admin
      .from("conversations")
      .insert({
        product_id: product.id,
        buyer_id: input.buyerId,
        seller_id: input.sellerId,
        last_message: "Payment confirmed",
      })
      .select("id")
      .single();

    if (error || !created) {
      return { error: "Unable to create order conversation." };
    }
    conversationId = created.id;
  }

  const seeds = [
    `Payment confirmed for order ${input.orderNumber}.`,
    `Order ${input.orderNumber} has been created.`,
    "Tracking pending — updates appear here once the seller ships.",
  ];

  const { count } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId);

  if ((count ?? 0) === 0) {
    // Platform seed notes (buyer-attributed text; inbox schema has no system role yet).
    for (const content of seeds) {
      await admin.from("messages").insert({
        conversation_id: conversationId,
        sender_id: input.buyerId,
        sender_role: "buyer",
        kind: "text",
        content,
        status: "delivered",
      });
    }

    await admin
      .from("conversations")
      .update({ last_message: seeds[0], last_message_at: new Date().toISOString() })
      .eq("id", conversationId);
  }

  return { conversationId };
}
