import type { OrderTotals } from "@/lib/orders/types";

/** Central platform fee engine — the single user-facing fee (5.5%). */
export const PLATFORM_FEE_RATE = 0.055;
export const MIN_PLATFORM_FEE = 0.99;
export const MAX_PLATFORM_FEE = 9.99;
export const STANDARD_DELIVERY_COST = 4.99;
export const FREE_DELIVERY_THRESHOLD = 50;

export function calculatePlatformFee(itemPrice: number): number {
  const raw = itemPrice * PLATFORM_FEE_RATE;
  const clamped = Math.min(MAX_PLATFORM_FEE, Math.max(MIN_PLATFORM_FEE, raw));
  return Math.round(clamped * 100) / 100;
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
