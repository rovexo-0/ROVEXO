import { logCronEvent, logOpsEvent } from "@/lib/ops/logger";
import { recordCronJobRun } from "@/lib/ops/production-status";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelPendingOrder } from "@/lib/orders/checkout";

export type OrderCleanupResult = {
  cleaned: number;
};

export async function runOrderCleanupJob(): Promise<OrderCleanupResult> {
  try {
    const cleaned = await cleanupExpiredOrders();
    const result = { cleaned };
    await recordCronJobRun({ jobName: "orders/cleanup", status: "success", result });
    logCronEvent("Order cleanup completed", result);
    return result;
  } catch (error) {
    await recordCronJobRun({
      jobName: "orders/cleanup",
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Order cleanup failed",
    });
    logOpsEvent({ category: "cron", message: "Order cleanup failed", error });
    throw error;
  }
}

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
