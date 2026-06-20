import { createNotification } from "@/lib/notifications/create";

export async function notifyLowStock(input: {
  sellerId: string;
  productId: string;
  productTitle: string;
  stock: number;
}): Promise<void> {
  await createNotification({
    userId: input.sellerId,
    type: "system",
    title: "Low stock alert",
    subtitle: `${input.productTitle} has ${input.stock} left`,
    href: `/seller/listings/${input.productId}/edit`,
  });
}
