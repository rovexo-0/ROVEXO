import { emitSmartNotification } from "@/lib/notifications/events";

export async function notifyLowStock(input: {
  sellerId: string;
  productId: string;
  productTitle: string;
  stock: number;
}): Promise<void> {
  await emitSmartNotification({
    userId: input.sellerId,
    eventType: "listing_expiring",
    idempotencyKey: `low-stock-${input.productId}-${input.stock}`,
    notificationType: "system",
    title: "Low stock alert",
    subtitle: `${input.productTitle} has ${input.stock} left`,
    href: `/seller/listings/${input.productId}/edit`,
    payload: { productId: input.productId, stock: input.stock },
  });
}
