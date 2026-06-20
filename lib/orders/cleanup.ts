import { createAdminClient } from "@/lib/supabase/admin";
import { cancelPendingOrder } from "@/lib/orders/checkout";

export async function cleanupExpiredOrders(): Promise<number> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: expired } = await admin
    .from("orders")
    .select("id")
    .eq("status", "awaiting_payment")
    .lt("reserved_until", now);

  if (!expired?.length) {
    return 0;
  }

  for (const order of expired) {
    await cancelPendingOrder(order.id);
  }

  return expired.length;
}
