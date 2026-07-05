import type { OrderTotals } from "@/lib/orders/types";

const PROTECTION_RATE = 0.05;
const MIN_PROTECTION_FEE = 0.99;
const MAX_PROTECTION_FEE = 9.99;
export const STANDARD_DELIVERY_COST = 4.99;

export function calculateProtectedFee(itemPrice: number): number {
  const raw = itemPrice * PROTECTION_RATE;
  const clamped = Math.min(MAX_PROTECTION_FEE, Math.max(MIN_PROTECTION_FEE, raw));
  return Math.round(clamped * 100) / 100;
}

export function calculateOrderTotals(itemPrice: number, delivery: number | null = 0): OrderTotals {
  const deliveryFee = delivery ?? 0;
  const protectedFee = calculateProtectedFee(itemPrice);
  const total = Math.round((itemPrice + protectedFee + deliveryFee) * 100) / 100;

  return {
    itemPrice,
    protectedFee,
    delivery: deliveryFee,
    total,
  };
}
