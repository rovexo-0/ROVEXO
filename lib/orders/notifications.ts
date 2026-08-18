import { emitSmartNotification } from "@/lib/notifications/events";
import { NOTIFICATION_ROUTES } from "@/lib/notifications/routing";

function orderHref(orderId?: string): string {
  return orderId ? NOTIFICATION_ROUTES.order(orderId) : NOTIFICATION_ROUTES.orders;
}

function trackingHref(orderId?: string): string {
  return orderId ? NOTIFICATION_ROUTES.orderTracking(orderId) : NOTIFICATION_ROUTES.orders;
}

export async function notifyOrderPaid(input: {
  buyerId: string;
  buyerEmail: string;
  sellerId: string;
  sellerEmail: string;
  orderId: string;
  orderNumber: string;
  productTitle: string;
  productImageUrl?: string;
  itemPrice?: number;
}): Promise<void> {
  const href = orderHref(input.orderId);
  const priceLabel =
    typeof input.itemPrice === "number" && Number.isFinite(input.itemPrice)
      ? `£${input.itemPrice.toFixed(2)}`
      : undefined;

  await Promise.all([
    emitSmartNotification({
      userId: input.buyerId,
      eventType: "new_order",
      idempotencyKey: `order-paid-buyer-${input.orderNumber}`,
      notificationType: "order",
      title: "Order paid",
      subtitle: priceLabel ?? `Payment received for ${input.productTitle}`,
      href,
      detail: priceLabel,
      avatarUrl: input.productImageUrl,
      avatarName: input.productTitle,
      payload: { orderId: input.orderId, orderNumber: input.orderNumber },
      email: {
        to: input.buyerEmail,
        subject: `Order confirmed — ${input.orderNumber}`,
        body: `Your payment for ${input.productTitle} was received. Order ${input.orderNumber}.`,
      },
    }),
    emitSmartNotification({
      userId: input.sellerId,
      eventType: "new_order",
      idempotencyKey: `order-paid-seller-${input.orderNumber}`,
      notificationType: "order",
      title: "New order",
      subtitle: `${input.orderNumber} — ${input.productTitle}`,
      href,
      detail: priceLabel,
      avatarUrl: input.productImageUrl,
      avatarName: input.productTitle,
      payload: { orderId: input.orderId, orderNumber: input.orderNumber },
      email: {
        to: input.sellerEmail,
        subject: `New order — ${input.orderNumber}`,
        body: `You received a new order (${input.orderNumber}) for ${input.productTitle}.`,
      },
    }),
  ]);
}

export async function notifyOrderShipped(input: {
  buyerId: string;
  buyerEmail: string;
  orderId: string;
  orderNumber: string;
  trackingNumber: string;
  productTitle?: string;
  productImageUrl?: string;
}): Promise<void> {
  await emitSmartNotification({
    userId: input.buyerId,
    eventType: "order_shipped",
    idempotencyKey: `order-shipped-${input.orderNumber}`,
    notificationType: "order",
    title: "Order shipped",
    subtitle: "Tracking available",
    href: trackingHref(input.orderId),
    detail: input.trackingNumber ? `Tracking ${input.trackingNumber}` : input.productTitle,
    avatarUrl: input.productImageUrl,
    avatarName: input.productTitle ?? undefined,
    payload: { orderId: input.orderId, orderNumber: input.orderNumber },
    email: {
      to: input.buyerEmail,
      subject: `Your order has shipped — ${input.orderNumber}`,
      body: `Tracking number: ${input.trackingNumber}`,
    },
  });
}

export async function notifyOrderDelivered(input: {
  buyerId: string;
  buyerEmail: string;
  orderId: string;
  orderNumber: string;
  productTitle?: string;
  productImageUrl?: string;
}): Promise<void> {
  await emitSmartNotification({
    userId: input.buyerId,
    eventType: "order_delivered",
    idempotencyKey: `order-delivered-${input.orderNumber}`,
    notificationType: "order",
    title: "Order delivered",
    subtitle: `Confirm receipt for ${input.orderNumber}`,
    href: orderHref(input.orderId),
    detail: input.productTitle,
    avatarUrl: input.productImageUrl,
    avatarName: input.productTitle,
    payload: { orderId: input.orderId, orderNumber: input.orderNumber },
    email: {
      to: input.buyerEmail,
      subject: `Order delivered — ${input.orderNumber}`,
      body: "Please confirm everything is OK in your ROVEXO orders.",
    },
  });
}

export async function notifyPayoutTransferred(input: {
  sellerId: string;
  sellerEmail: string;
  amount: number;
  orderNumber: string;
}): Promise<void> {
  await emitSmartNotification({
    userId: input.sellerId,
    eventType: "payout",
    idempotencyKey: `payout-transferred-${input.orderNumber}-${input.sellerId}`,
    notificationType: "system",
    title: "Payout sent",
    subtitle: `£${input.amount.toFixed(2)} for order ${input.orderNumber}`,
    href: NOTIFICATION_ROUTES.walletTransactions,
    payload: { orderNumber: input.orderNumber, amount: input.amount },
    email: {
      to: input.sellerEmail,
      subject: `Payout sent — ${input.orderNumber}`,
      body: `Your payout of £${input.amount.toFixed(2)} for order ${input.orderNumber} has been transferred to your Stripe Connect account. Stripe will deposit it to your bank automatically.`,
    },
  });
}

/** @deprecated Manual withdrawals removed in v1.0 — use notifyPayoutTransferred */
export async function notifyWithdrawalCompleted(input: {
  sellerId: string;
  sellerEmail: string;
  amount: number;
}): Promise<void> {
  await notifyPayoutTransferred({
    sellerId: input.sellerId,
    sellerEmail: input.sellerEmail,
    amount: input.amount,
    orderNumber: "withdrawal",
  });
}

export async function notifyOrderRefunded(input: {
  buyerId: string;
  buyerEmail: string;
  sellerId: string;
  sellerEmail: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  productImageUrl?: string;
}): Promise<void> {
  const href = orderHref(input.orderId);
  await Promise.all([
    emitSmartNotification({
      userId: input.buyerId,
      eventType: "refund",
      idempotencyKey: `order-refunded-buyer-${input.orderNumber}`,
      notificationType: "order",
      title: "Refund processed",
      subtitle: `Order ${input.orderNumber}`,
      href,
      avatarUrl: input.productImageUrl,
      payload: { orderId: input.orderId, orderNumber: input.orderNumber },
      email: {
        to: input.buyerEmail,
        subject: `Refund confirmation — ${input.orderNumber}`,
        body: `Your refund of £${input.amount.toFixed(2)} for order ${input.orderNumber} has been processed.`,
      },
    }),
    emitSmartNotification({
      userId: input.sellerId,
      eventType: "refund",
      idempotencyKey: `order-refunded-seller-${input.orderNumber}`,
      notificationType: "order",
      title: "Order refunded",
      subtitle: input.orderNumber,
      href,
      avatarUrl: input.productImageUrl,
      payload: { orderId: input.orderId, orderNumber: input.orderNumber },
      email: {
        to: input.sellerEmail,
        subject: `Order refunded — ${input.orderNumber}`,
        body: `Order ${input.orderNumber} was refunded to the buyer.`,
      },
    }),
  ]);
}

export async function notifyOrderCancelled(input: {
  buyerId: string;
  buyerEmail: string;
  orderId: string;
  orderNumber: string;
  reason?: string;
  productImageUrl?: string;
}): Promise<void> {
  await emitSmartNotification({
    userId: input.buyerId,
    eventType: "order_confirmed",
    idempotencyKey: `order-cancelled-${input.orderNumber}`,
    notificationType: "order",
    title: "Order cancelled",
    subtitle: input.orderNumber,
    href: orderHref(input.orderId),
    avatarUrl: input.productImageUrl,
    payload: { orderId: input.orderId, orderNumber: input.orderNumber },
    email: {
      to: input.buyerEmail,
      subject: `Order cancelled — ${input.orderNumber}`,
      body: `Your order ${input.orderNumber} was cancelled.${input.reason ? ` Reason: ${input.reason}` : ""}`,
    },
  });
}

export async function notifyBuyerOrderCancelledWithRefund(input: {
  buyerId: string;
  buyerEmail: string;
  orderId: string;
  orderNumber: string;
  refunded: boolean;
  amount?: number;
  productImageUrl?: string;
}): Promise<void> {
  const body = input.refunded
    ? `Your order ${input.orderNumber} has been cancelled and refunded${input.amount != null ? ` (£${input.amount.toFixed(2)})` : ""}.`
    : `Your order ${input.orderNumber} has been cancelled.`;

  await emitSmartNotification({
    userId: input.buyerId,
    eventType: input.refunded ? "refund" : "order_confirmed",
    idempotencyKey: `order-cancelled-buyer-${input.orderNumber}`,
    notificationType: "order",
    title: input.refunded ? "Order cancelled and refunded" : "Order cancelled",
    subtitle: input.orderNumber,
    href: orderHref(input.orderId),
    avatarUrl: input.productImageUrl,
    payload: { orderId: input.orderId, orderNumber: input.orderNumber },
    email: {
      to: input.buyerEmail,
      subject: input.refunded
        ? `Order cancelled and refunded — ${input.orderNumber}`
        : `Order cancelled — ${input.orderNumber}`,
      body,
    },
  });
}

export async function notifyBuyerOrderCancelledBySeller(input: {
  buyerId: string;
  buyerEmail: string;
  orderId: string;
  orderNumber: string;
  reason: string;
  refunded: boolean;
  amount?: number;
  productImageUrl?: string;
}): Promise<void> {
  const amountLabel =
    input.amount != null ? ` £${input.amount.toFixed(2)}` : "";
  const body = input.refunded
    ? `Order ${input.orderNumber} was cancelled by the seller. Reason: ${input.reason}. Refunded to Wallet${amountLabel}.`
    : `Order ${input.orderNumber} was cancelled by the seller. Reason: ${input.reason}.`;

  await emitSmartNotification({
    userId: input.buyerId,
    eventType: input.refunded ? "refund" : "order_confirmed",
    idempotencyKey: `order-cancelled-by-seller-${input.orderNumber}`,
    notificationType: "order",
    title: "Order cancelled by seller",
    subtitle: `Reason: ${input.reason}`,
    href: orderHref(input.orderId),
    avatarUrl: input.productImageUrl,
    payload: { orderId: input.orderId, orderNumber: input.orderNumber, reason: input.reason },
    email: {
      to: input.buyerEmail,
      subject: `Order cancelled by seller — ${input.orderNumber}`,
      body,
    },
  });
}

export async function notifySellerOrderCancelledByBuyer(input: {
  sellerId: string;
  sellerEmail: string;
  orderId: string;
  orderNumber: string;
  productTitle: string;
  refundInitiated?: boolean;
  productImageUrl?: string;
}): Promise<void> {
  const sellerBody = input.refundInitiated
    ? `The buyer cancelled order ${input.orderNumber} for ${input.productTitle} before shipment. Refund initiated. No action required.`
    : `The buyer cancelled order ${input.orderNumber} for ${input.productTitle} before shipment.`;

  await emitSmartNotification({
    userId: input.sellerId,
    eventType: input.refundInitiated ? "refund" : "order_confirmed",
    idempotencyKey: `order-cancelled-seller-${input.orderNumber}`,
    notificationType: "order",
    title: "Order cancelled by buyer",
    subtitle: input.refundInitiated
      ? `${input.orderNumber} — refund initiated`
      : `${input.orderNumber} — ${input.productTitle}`,
    href: orderHref(input.orderId),
    avatarUrl: input.productImageUrl,
    avatarName: input.productTitle,
    payload: { orderId: input.orderId, orderNumber: input.orderNumber },
    email: {
      to: input.sellerEmail,
      subject: `Buyer cancelled order — ${input.orderNumber}`,
      body: sellerBody,
    },
  });
}

export async function notifyRefundRequested(input: {
  sellerId: string;
  orderId: string;
  orderNumber: string;
  productTitle: string;
  productImageUrl?: string;
}): Promise<void> {
  await emitSmartNotification({
    userId: input.sellerId,
    eventType: "refund",
    idempotencyKey: `refund-requested-${input.orderNumber}`,
    notificationType: "order",
    title: "Refund requested",
    subtitle: "Buyer requested refund",
    href: orderHref(input.orderId),
    detail: input.productTitle,
    avatarUrl: input.productImageUrl,
    avatarName: input.productTitle,
    payload: { orderId: input.orderId, orderNumber: input.orderNumber },
  });
}

export async function notifyRefundInitiated(input: {
  buyerId: string;
  buyerEmail: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  reference: string;
  productTitle?: string;
  productImageUrl?: string;
  destination?: "wallet" | "card";
}): Promise<void> {
  const amountLabel = `£${input.amount.toFixed(2)}`;
  const body =
    input.destination === "wallet"
      ? `Your refund of ${amountLabel} has been successfully initiated. The funds will appear in your ROVEXO Wallet when the refund is confirmed.`
      : `Your refund of ${amountLabel} has been successfully initiated. The money will be returned to your original payment method. Most refunds arrive within 3–5 business days. Some banks may take up to 10 business days.`;

  await emitSmartNotification({
    userId: input.buyerId,
    eventType: "refund",
    idempotencyKey: `refund-initiated-${input.orderNumber}`,
    notificationType: "order",
    title: "Refund initiated",
    subtitle: `Refund in progress — ${amountLabel}`,
    href: orderHref(input.orderId),
    detail: body,
    avatarUrl: input.productImageUrl,
    avatarName: input.productTitle,
    payload: { orderId: input.orderId, orderNumber: input.orderNumber },
    email: {
      to: input.buyerEmail,
      subject: `Refund initiated — ${input.orderNumber}`,
      body,
    },
  });
}

export async function notifyRefundCompleted(input: {
  buyerId: string;
  buyerEmail: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  reference: string;
  productTitle?: string;
  productImageUrl?: string;
  destination?: "wallet" | "card";
}): Promise<void> {
  const amountLabel = `£${input.amount.toFixed(2)}`;
  const body =
    input.destination === "wallet"
      ? `Your refund of ${amountLabel} has been credited to your ROVEXO Wallet. You can withdraw the available balance to your saved bank account. Reference: ${input.reference}.`
      : `Your refund of ${amountLabel} has been completed successfully. The funds have been returned to your original payment method. Reference: ${input.reference}.`;

  await emitSmartNotification({
    userId: input.buyerId,
    eventType: "refund",
    idempotencyKey: `refund-completed-${input.orderNumber}`,
    notificationType: "order",
    title: "Refund completed",
    subtitle: `${amountLabel} refunded`,
    href: orderHref(input.orderId),
    detail: body,
    avatarUrl: input.productImageUrl,
    avatarName: input.productTitle,
    payload: { orderId: input.orderId, orderNumber: input.orderNumber },
    email: {
      to: input.buyerEmail,
      subject: `Refund completed — ${input.orderNumber}`,
      body,
    },
  });
}

export async function notifyRefundFailed(input: {
  buyerId: string;
  buyerEmail: string;
  orderId: string;
  orderNumber: string;
  productImageUrl?: string;
}): Promise<void> {
  const body =
    "We were unable to complete your refund automatically. Our team has been notified. No further action is required from you.";

  await emitSmartNotification({
    userId: input.buyerId,
    eventType: "refund",
    idempotencyKey: `refund-failed-${input.orderNumber}`,
    notificationType: "order",
    title: "Refund failed",
    subtitle: input.orderNumber,
    href: orderHref(input.orderId),
    detail: body,
    avatarUrl: input.productImageUrl,
    payload: { orderId: input.orderId, orderNumber: input.orderNumber },
    email: {
      to: input.buyerEmail,
      subject: `Refund failed — ${input.orderNumber}`,
      body,
    },
  });
}

export async function notifySellerRefundInitiated(input: {
  sellerId: string;
  sellerEmail: string;
  orderId: string;
  orderNumber: string;
  productImageUrl?: string;
}): Promise<void> {
  await emitSmartNotification({
    userId: input.sellerId,
    eventType: "refund",
    idempotencyKey: `seller-refund-initiated-${input.orderNumber}`,
    notificationType: "order",
    title: "Refund initiated",
    subtitle: `${input.orderNumber} — buyer cancellation`,
    href: orderHref(input.orderId),
    avatarUrl: input.productImageUrl,
    payload: { orderId: input.orderId, orderNumber: input.orderNumber },
    email: {
      to: input.sellerEmail,
      subject: `Refund initiated — ${input.orderNumber}`,
      body: `The buyer cancelled order ${input.orderNumber}. Refund initiated. No action required.`,
    },
  });
}

export async function notifyPromotionPurchased(input: {
  sellerId: string;
  sellerEmail: string;
  productTitle: string;
  type: string;
  amountCents: number;
}): Promise<void> {
  await emitSmartNotification({
    userId: input.sellerId,
    eventType: "promotion",
    idempotencyKey: `promotion-purchased-${input.sellerId}-${input.type}-${input.productTitle}`,
    notificationType: "system",
    title: "Promotion activated",
    subtitle: `${input.type} — ${input.productTitle}`,
    href: "/sell",
    payload: { type: input.type, amountCents: input.amountCents },
    email: {
      to: input.sellerEmail,
      subject: `Promotion purchased — ${input.productTitle}`,
      body: `Your ${input.type} promotion for "${input.productTitle}" is active. Amount paid: £${(input.amountCents / 100).toFixed(2)}.`,
    },
  });
}
