import type { CartItem } from "@/lib/cart/store";
import { calculatePlatformFee } from "@/lib/orders/pricing";

export type CartSellerGroup = {
  sellerId: string;
  sellerName: string;
  items: CartItem[];
  subtotal: number;
  platformFee: number;
  itemCount: number;
};

/** Groups cart lines by seller — each seller becomes a separate order at checkout. */
export function groupCartItemsBySeller(items: CartItem[]): CartSellerGroup[] {
  const groups = new Map<string, CartSellerGroup>();

  for (const item of items) {
    const sellerId = item.sellerId ?? "unknown";
    const sellerName = item.sellerName?.trim() || "Seller";
    const existing = groups.get(sellerId);

    if (existing) {
      existing.items.push(item);
      existing.subtotal += item.price * item.quantity;
      existing.platformFee += calculatePlatformFee(item.price) * item.quantity;
      existing.itemCount += item.quantity;
      continue;
    }

    groups.set(sellerId, {
      sellerId,
      sellerName,
      items: [item],
      subtotal: item.price * item.quantity,
      platformFee: calculatePlatformFee(item.price) * item.quantity,
      itemCount: item.quantity,
    });
  }

  return Array.from(groups.values());
}

export function countCartSellerGroups(items: CartItem[]): number {
  return groupCartItemsBySeller(items).length;
}
