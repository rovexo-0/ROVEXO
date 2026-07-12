import { emitSmartNotification } from "@/lib/notifications/events";
import { NOTIFICATION_ROUTES } from "@/lib/notifications/routing";
import { formatCurrency } from "@/lib/wallet/utils";

export async function notifySellerFundsPending(input: {
  sellerId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
}): Promise<void> {
  void emitSmartNotification({
    userId: input.sellerId,
    eventType: "payment_received",
    idempotencyKey: `seller-funds-pending:${input.orderId}`,
    notificationType: "payment",
    title: "Funds pending",
    subtitle: `${formatCurrency(input.amount)} from order #${input.orderNumber} — waiting for successful delivery.`,
    href: NOTIFICATION_ROUTES.wallet,
    payload: { orderId: input.orderId, amount: input.amount },
  });
}

export async function notifySellerFundsReleased(input: {
  sellerId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
}): Promise<void> {
  void emitSmartNotification({
    userId: input.sellerId,
    eventType: "payout",
    idempotencyKey: `seller-funds-released:${input.orderId}`,
    notificationType: "payment",
    title: "Funds are now available",
    subtitle: `${formatCurrency(input.amount)} from order #${input.orderNumber} has been released.`,
    href: NOTIFICATION_ROUTES.wallet,
    payload: { orderId: input.orderId, amount: input.amount },
  });
}

export async function notifySellerWithdrawalCompleted(input: {
  sellerId: string;
  transactionId: string;
  amount: number;
}): Promise<void> {
  void emitSmartNotification({
    userId: input.sellerId,
    eventType: "payout",
    idempotencyKey: `seller-withdrawal:${input.transactionId}`,
    notificationType: "payment",
    title: "Withdrawal completed",
    subtitle: `${formatCurrency(input.amount)} has been sent to your bank account.`,
    href: NOTIFICATION_ROUTES.walletWithdrawal(input.transactionId),
    payload: { transactionId: input.transactionId, amount: input.amount },
  });
}
