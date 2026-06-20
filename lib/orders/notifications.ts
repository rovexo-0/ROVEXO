import { queueEmail } from "@/lib/email/service";
import { createNotification } from "@/lib/notifications/create";

export async function notifyOrderPaid(input: {
  buyerId: string;
  buyerEmail: string;
  sellerId: string;
  sellerEmail: string;
  orderNumber: string;
  productTitle: string;
}): Promise<void> {
  await Promise.all([
    createNotification({
      userId: input.buyerId,
      type: "order",
      title: "Order confirmed",
      subtitle: `Payment received for ${input.productTitle}`,
      href: "/orders",
    }),
    createNotification({
      userId: input.sellerId,
      type: "order",
      title: "New order",
      subtitle: `${input.orderNumber} — ${input.productTitle}`,
      href: "/seller/orders",
    }),
    queueEmail({
      to: input.buyerEmail,
      subject: `Order confirmed — ${input.orderNumber}`,
      body: `Your payment for ${input.productTitle} was received. Order ${input.orderNumber}.`,
      template: "order_confirmation",
      metadata: { orderNumber: input.orderNumber },
    }),
    queueEmail({
      to: input.sellerEmail,
      subject: `New order — ${input.orderNumber}`,
      body: `You received a new order (${input.orderNumber}) for ${input.productTitle}.`,
      template: "seller_new_order",
      metadata: { orderNumber: input.orderNumber },
    }),
  ]);
}

export async function notifyOrderShipped(input: {
  buyerId: string;
  buyerEmail: string;
  orderNumber: string;
  trackingNumber: string;
}): Promise<void> {
  await Promise.all([
    createNotification({
      userId: input.buyerId,
      type: "order",
      title: "Order shipped",
      subtitle: `Tracking ${input.trackingNumber}`,
      href: "/orders",
    }),
    queueEmail({
      to: input.buyerEmail,
      subject: `Your order has shipped — ${input.orderNumber}`,
      body: `Tracking number: ${input.trackingNumber}`,
      template: "order_shipped",
      metadata: { orderNumber: input.orderNumber, trackingNumber: input.trackingNumber },
    }),
  ]);
}

export async function notifyOrderDelivered(input: {
  buyerId: string;
  buyerEmail: string;
  orderNumber: string;
}): Promise<void> {
  await Promise.all([
    createNotification({
      userId: input.buyerId,
      type: "order",
      title: "Order delivered",
      subtitle: `Confirm receipt for ${input.orderNumber}`,
      href: "/orders",
    }),
    queueEmail({
      to: input.buyerEmail,
      subject: `Order delivered — ${input.orderNumber}`,
      body: "Please confirm everything is OK in your ROVEXO orders.",
      template: "order_delivered",
      metadata: { orderNumber: input.orderNumber },
    }),
  ]);
}

export async function notifyWithdrawalCompleted(input: {
  sellerId: string;
  sellerEmail: string;
  amount: number;
}): Promise<void> {
  await Promise.all([
    createNotification({
      userId: input.sellerId,
      type: "system",
      title: "Withdrawal completed",
      subtitle: `£${input.amount.toFixed(2)} sent to your account`,
      href: "/seller/wallet",
    }),
    queueEmail({
      to: input.sellerEmail,
      subject: "Withdrawal completed",
      body: `Your withdrawal of £${input.amount.toFixed(2)} has been processed.`,
      template: "withdrawal_completed",
    }),
  ]);
}

export async function notifyOrderRefunded(input: {
  buyerId: string;
  buyerEmail: string;
  sellerId: string;
  sellerEmail: string;
  orderNumber: string;
  amount: number;
}): Promise<void> {
  await Promise.all([
    createNotification({
      userId: input.buyerId,
      type: "order",
      title: "Refund processed",
      subtitle: `Order ${input.orderNumber}`,
      href: "/orders",
    }),
    createNotification({
      userId: input.sellerId,
      type: "order",
      title: "Order refunded",
      subtitle: input.orderNumber,
      href: "/seller/orders",
    }),
    queueEmail({
      to: input.buyerEmail,
      subject: `Refund confirmation — ${input.orderNumber}`,
      body: `Your refund of £${input.amount.toFixed(2)} for order ${input.orderNumber} has been processed.`,
      template: "refund_confirmation",
      metadata: { orderNumber: input.orderNumber },
    }),
    queueEmail({
      to: input.sellerEmail,
      subject: `Order refunded — ${input.orderNumber}`,
      body: `Order ${input.orderNumber} was refunded to the buyer.`,
      template: "seller_order_refunded",
      metadata: { orderNumber: input.orderNumber },
    }),
  ]);
}

export async function notifyOrderCancelled(input: {
  buyerId: string;
  buyerEmail: string;
  orderNumber: string;
  reason?: string;
}): Promise<void> {
  await Promise.all([
    createNotification({
      userId: input.buyerId,
      type: "order",
      title: "Order cancelled",
      subtitle: input.orderNumber,
      href: "/orders",
    }),
    queueEmail({
      to: input.buyerEmail,
      subject: `Order cancelled — ${input.orderNumber}`,
      body: `Your order ${input.orderNumber} was cancelled.${input.reason ? ` Reason: ${input.reason}` : ""}`,
      template: "order_cancelled",
      metadata: { orderNumber: input.orderNumber },
    }),
  ]);
}

export async function notifyPromotionPurchased(input: {
  sellerId: string;
  sellerEmail: string;
  productTitle: string;
  type: string;
  amountCents: number;
}): Promise<void> {
  await Promise.all([
    createNotification({
      userId: input.sellerId,
      type: "system",
      title: "Promotion activated",
      subtitle: `${input.type} — ${input.productTitle}`,
      href: "/seller/listings",
    }),
    queueEmail({
      to: input.sellerEmail,
      subject: `Promotion purchased — ${input.productTitle}`,
      body: `Your ${input.type} promotion for "${input.productTitle}" is active. Amount paid: £${(input.amountCents / 100).toFixed(2)}.`,
      template: "promotion_purchased",
    }),
  ]);
}
