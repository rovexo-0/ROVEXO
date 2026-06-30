import { createAdminClient } from "@/lib/supabase/admin";

const STALE_CART_DAYS = 30;

export async function cleanupAbandonedCartItems(): Promise<number> {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - STALE_CART_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: staleItems, error } = await admin
    .from("cart_items")
    .select("id")
    .lt("updated_at", cutoff);

  if (error || !staleItems?.length) {
    return 0;
  }

  await admin
    .from("cart_items")
    .delete()
    .in(
      "id",
      staleItems.map((item) => item.id),
    );

  return staleItems.length;
}
