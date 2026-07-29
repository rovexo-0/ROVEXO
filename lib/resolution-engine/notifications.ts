import { emitSmartNotification } from "@/lib/notifications/events";
import { getMessageHref } from "@/lib/orders/status";

export async function notifyResolutionUpdate(input: {
  orderId: string;
  buyerId: string | null;
  sellerId: string | null;
  status: string;
  message: string;
}): Promise<void> {
  const buyerHref = getMessageHref(input.orderId, "buyer");
  const sellerHref = getMessageHref(input.orderId, "seller");

  if (input.buyerId) {
    await emitSmartNotification({
      userId: input.buyerId,
      eventType: "buyer_reported_issue",
      idempotencyKey: `resolution-${input.orderId}-buyer-${input.status}`,
      notificationType: "order",
      title: "Resolution update",
      subtitle: input.message,
      href: buyerHref,
      payload: { orderId: input.orderId, status: input.status },
    });
  }

  if (input.sellerId) {
    await emitSmartNotification({
      userId: input.sellerId,
      eventType: "buyer_reported_issue",
      idempotencyKey: `resolution-${input.orderId}-seller-${input.status}`,
      notificationType: "order",
      title: "Resolution update",
      subtitle: input.message,
      href: sellerHref,
      payload: { orderId: input.orderId, status: input.status },
    });
  }
}
