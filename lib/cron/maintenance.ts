import { cleanupAbandonedCartItems } from "@/lib/cart/cleanup";
import { refreshExpiredPromotions } from "@/lib/promotions/service";
import { cleanupExpiredOrders } from "@/lib/orders/cleanup";
import { sendQueuedEmails } from "@/lib/email/service";
import { releaseSellerPendingBalances } from "@/lib/wallet/sales";

export type MaintenanceResult = {
  expiredOrders: number;
  walletReleased: number;
  cartItemsRemoved: number;
  promotionsRefreshed: boolean;
  emailsSent: number;
  emailsFailed: number;
};

export async function runProductionMaintenance(): Promise<MaintenanceResult> {
  await refreshExpiredPromotions();
  const expiredOrders = await cleanupExpiredOrders();
  const walletReleased = await releaseSellerPendingBalances();
  const cartItemsRemoved = await cleanupAbandonedCartItems();
  const emailResult = await sendQueuedEmails(50);

  return {
    expiredOrders,
    walletReleased,
    cartItemsRemoved,
    promotionsRefreshed: true,
    emailsSent: emailResult.sent,
    emailsFailed: emailResult.failed,
  };
}
