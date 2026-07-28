import { logCronEvent, logOpsEvent } from "@/lib/ops/logger";
import { recordCronJobRun } from "@/lib/ops/production-status";
import { AUTO_CANCEL_ENGINE_run } from "@/lib/checkout/engines/auto-cancel-engine-v1";

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

/** Blood XXIV + Master Architecture — AUTO_CANCEL_ENGINE (120s sessions + legacy PENDING_PAYMENT drain). */
export async function cleanupExpiredOrders(): Promise<number> {
  const result = await AUTO_CANCEL_ENGINE_run();
  return result.cancelled;
}
