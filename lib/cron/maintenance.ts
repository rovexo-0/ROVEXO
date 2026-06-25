import { cleanupAbandonedCartItems } from "@/lib/cart/cleanup";
import { processSavedSearchNotifications } from "@/lib/launch/saved-search-notifications";
import { logCronEvent, logOpsEvent } from "@/lib/ops/logger";
import { recordCronJobRun } from "@/lib/ops/production-status";
import { activateScheduledPromotions, refreshExpiredPromotions } from "@/lib/promotions/service";
import { cleanupExpiredOrders } from "@/lib/orders/cleanup";
import { sendQueuedEmails } from "@/lib/email/service";
import { releaseSellerPendingBalances } from "@/lib/wallet/sales";

export type MaintenanceResult = {
  expiredOrders: number;
  /** Automatic Connect transfers completed this run. */
  walletReleased: number;
  payoutsTransferred: number;
  cartItemsRemoved: number;
  promotionsRefreshed: boolean;
  scheduledPromotionsActivated: number;
  savedSearchNotifications: number;
  emailsSent: number;
  emailsFailed: number;
};

export async function runProductionMaintenance(): Promise<MaintenanceResult> {
  try {
    await refreshExpiredPromotions();
    const scheduledPromotionsActivated = await activateScheduledPromotions();
    const expiredOrders = await cleanupExpiredOrders();
    const walletReleased = await releaseSellerPendingBalances();
    const cartItemsRemoved = await cleanupAbandonedCartItems();
    const emailResult = await sendQueuedEmails(50);
    const savedSearchResult = await processSavedSearchNotifications();

    const result = {
      expiredOrders,
      walletReleased,
      payoutsTransferred: walletReleased,
      cartItemsRemoved,
      promotionsRefreshed: true,
      scheduledPromotionsActivated,
      savedSearchNotifications: savedSearchResult.notificationsSent,
      emailsSent: emailResult.sent,
      emailsFailed: emailResult.failed,
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
