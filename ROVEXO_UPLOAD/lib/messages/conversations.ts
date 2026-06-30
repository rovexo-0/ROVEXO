import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function findOrCreateConversation(input: {
  buyerId: string;
  productSlug: string;
}): Promise<{ conversationId: string } | { error: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: product } = await admin
    .from("products")
    .select("id, seller_id, status")
    .eq("slug", input.productSlug)
    .maybeSingle();

  if (!product || product.status !== "published") {
    return { error: "Product not found." };
  }

  if (product.seller_id === input.buyerId) {
    return { error: "You cannot message yourself." };
  }

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("product_id", product.id)
    .eq("buyer_id", input.buyerId)
    .eq("seller_id", product.seller_id)
    .maybeSingle();

  if (existing) {
    return { conversationId: existing.id };
  }

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      product_id: product.id,
      buyer_id: input.buyerId,
      seller_id: product.seller_id,
      last_message: "",
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: "Unable to start conversation." };
  }

  return { conversationId: created.id };
}
