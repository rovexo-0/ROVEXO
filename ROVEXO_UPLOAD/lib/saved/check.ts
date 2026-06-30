import { createClient } from "@/lib/supabase/server";

export async function isProductSaved(userId: string, productSlug: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("slug", productSlug)
    .maybeSingle();

  if (!product) return false;

  const { data } = await supabase
    .from("saved_items")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", product.id)
    .maybeSingle();

  return Boolean(data);
}
