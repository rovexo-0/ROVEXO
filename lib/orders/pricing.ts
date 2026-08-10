import type { OrderTotals } from "@/lib/orders/types";

/** Central platform fee engine — single user-facing fee (5.5% of product subtotal). */
export const PLATFORM_FEE_RATE = 0.055;
/** 5.5% as integer basis points of pence (55 / 1000). */
export const PLATFORM_FEE_RATE_BPS = 55;
export const STANDARD_DELIVERY_COST = 4.99;
export const FREE_DELIVERY_THRESHOLD = 50;

/** Convert pounds to integer minor units (pence). */
export function toPence(pounds: number): number {
  return Math.round(Number(pounds) * 100);
}

/** Convert integer pence to pounds (2 d.p.). */
export function fromPence(pence: number): number {
  return Math.round(Number(pence)) / 100;
}

/**
 * Canonical platform fee in pence.
 * Fee = round(itemPence × 55 / 1000). Shipping excluded from fee base.
 * Example: £6.99 → 699p → round(38.445) → 38p → £0.38
 */
export function calculatePlatformFeePence(itemPricePence: number): number {
  const pence = Math.round(Number(itemPricePence));
  if (!Number.isFinite(pence) || pence <= 0) return 0;
  return Math.round((pence * PLATFORM_FEE_RATE_BPS) / 1000);
}

/** PlatformFee = fromPence(calculatePlatformFeePence(toPence(item))). No min/max cap. */
export function calculatePlatformFee(itemPrice: number): number {
  return fromPence(calculatePlatformFeePence(toPence(itemPrice)));
}

export function calculateOrderTotals(itemPrice: number, delivery: number | null = null): OrderTotals {
  const itemPence = toPence(itemPrice);
  const platformFeePence = calculatePlatformFeePence(itemPence);
  const platformFee = fromPence(platformFeePence);
  const deliveryPending = delivery === null;
  const deliveryFee = delivery ?? 0;
  const deliveryPence = deliveryPending ? 0 : toPence(deliveryFee);
  const total = fromPence(itemPence + platformFeePence + deliveryPence);

  return {
    itemPrice: fromPence(itemPence),
    platformFee,
    delivery: deliveryPending ? 0 : fromPence(deliveryPence),
    deliveryPending,
    total,
  };
}
