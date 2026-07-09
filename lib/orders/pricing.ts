import type { OrderTotals } from "@/lib/orders/types";

/** Central platform fee engine — single user-facing fee (5.5% of product subtotal). */
export const PLATFORM_FEE_RATE = 0.055;
export const STANDARD_DELIVERY_COST = 4.99;
export const FREE_DELIVERY_THRESHOLD = 50;

/** PlatformFee = round(ProductSubtotal * 0.055, 2). No min/max cap. Shipping excluded. */
export function calculatePlatformFee(itemPrice: number): number {
  return Math.round(itemPrice * PLATFORM_FEE_RATE * 100) / 100;
}

export function calculateOrderTotals(itemPrice: number, delivery: number | null = null): OrderTotals {
  const platformFee = calculatePlatformFee(itemPrice);
  const deliveryPending = delivery === null;
  const deliveryFee = delivery ?? 0;
  const total = Math.round(
    (itemPrice + platformFee + (deliveryPending ? 0 : deliveryFee)) * 100,
  ) / 100;

  return {
    itemPrice,
    platformFee,
    delivery: deliveryFee,
    deliveryPending,
    total,
  };
}
