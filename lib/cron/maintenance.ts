import { cleanupAbandonedCartItems } from "@/lib/cart/cleanup";
import { processSavedSearchNotifications } from "@/lib/launch/saved-search-notifications";
import { logCronEvent, logOpsEvent } from "@/lib/ops/logger";
import { recordCronJobRun } from "@/lib/ops/production-status";
import { activateScheduledPromotions, refreshExpiredPromotions } from "@/lib/promotions/service";
import { cleanupExpiredOrders } from "@/lib/orders/cleanup";
import { sendQueuedEmails } from "@/lib/email/service";
import { CommerceEngine } from "@/lib/commerce-engine";
import { ResolutionEngine } from "@/lib/resolution-engine";

export type MaintenanceResult = {
  expiredOrders: number;
  /** Automatic Connect transfers completed this run. */
  walletReleased: number;
  /** Resolution cases processed automatically this run. */
  resolutionProcessed: number;
  payoutsTransferred: number;
  cartItemsRemoved: number;
  promotionsRefreshed: boolean;
  scheduledPromotionsActivated: number;
  savedSearchNotifications: number;
  emailsSent: number;
  emailsFailed: number;
  pushRetriesProcessed: number;
  pushRetriesSucceeded: number;
  pushRetriesFailed: number;
};

export async function runProductionMaintenance(): Promise<MaintenanceResult> {
  try {
    await refreshExpiredPromotions();
    const scheduledPromotionsActivated = await activateScheduledPromotions();
    const expiredOrders = await cleanupExpiredOrders();
    // Commerce Engine auto-release worker (spec §10): Delivered + 24h, no claims.
    const walletReleased = await CommerceEngine.releaseEligiblePendingBalances();
    const resolutionProcessed = await ResolutionEngine.processPendingCases();
    const cartItemsRemoved = await cleanupAbandonedCartItems();
    const emailResult = await sendQueuedEmails(50);
    const savedSearchResult = await processSavedSearchNotifications();
    const { processPushDeliveryRetries } = await import("@/lib/push/retry");
    const pushRetryResult = await processPushDeliveryRetries(50);

    const result = {
      expiredOrders,
      walletReleased,
      resolutionProcessed,
      payoutsTransferred: walletReleased,
      cartItemsRemoved,
      promotionsRefreshed: true,
      scheduledPromotionsActivated,
      savedSearchNotifications: savedSearchResult.notificationsSent,
      emailsSent: emailResult.sent,
      emailsFailed: emailResult.failed,
      pushRetriesProcessed: pushRetryResult.processed,
      pushRetriesSucceeded: pushRetryResult.succeeded,
      pushRetriesFailed: pushRetryResult.failed,
    };

    await recordCronJobRun({ jobName: "maintenance", status: "success", result });
    logCronEvent("Maintenance completed", result);

    return result;
  } catch (error) {
    await recordCronJobRun({
      jobName: "maintenance",
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Maintenance failed",
    });
    logOpsEvent({ category: "cron", message: "Maintenance failed", error });
    throw error;
  }
}
