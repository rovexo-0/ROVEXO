import { createNotification } from "@/lib/notifications/create";

export async function notifyResolutionUpdate(input: {
  orderId: string;
  buyerId: string | null;
  sellerId: string | null;
  status: string;
  message: string;
}): Promise<void> {
  const href = `/orders/${input.orderId}`;

  if (input.buyerId) {
    await createNotification({
      userId: input.buyerId,
      type: "order",
      title: "Resolution update",
      subtitle: input.message,
      href,
    });
  }

  if (input.sellerId) {
    await createNotification({
      userId: input.sellerId,
      type: "order",
      title: "Resolution update",
      subtitle: input.message,
      href: `/seller/orders/${input.orderId}`,
    });
  }
}
