/**
 * COD SÂNGE — Checkout Race Condition Engine v1.0 (P0)
 *
 * Winner = first successful payment + atomic order commit.
 * Buy Now / open Checkout MUST NOT hide listings (no marketplace-visible reserved).
 */

export const CHECKOUT_RACE_CONDITION_V1 = {
  version: "1.0",
  id: "checkout-race-condition-v1",
  status: "IMPLEMENTATION",
  equation:
    "PUBLISHED → BUY NOW (stay published) → CHECKOUT → PAYMENT SUCCESS → ATOMIC ORDER+SOLD",
  winner: "first_payment_confirmed_and_order_committed",
  httpConflict: 409 as const,
  conflictMessage: "This item has just been sold.",
  conflictCode: "ITEM_JUST_SOLD" as const,
  forbidden: [
    "Buy Now → status=reserved hides marketplace",
    "Checkout session → status change away from published",
    "Duplicate orders for same listing sale",
  ] as const,
} as const;

export type CheckoutRaceConditionV1 = typeof CHECKOUT_RACE_CONDITION_V1;

export function isItemJustSoldError(raw: string | null | undefined): boolean {
  const text = (raw ?? "").trim().toLowerCase();
  if (!text) return false;
  return (
    text.includes(CHECKOUT_RACE_CONDITION_V1.conflictCode.toLowerCase()) ||
    text.includes("just been sold") ||
    text.includes("item_just_sold")
  );
}

export function itemJustSoldPayload() {
  return {
    success: false as const,
    code: CHECKOUT_RACE_CONDITION_V1.conflictCode,
    error: CHECKOUT_RACE_CONDITION_V1.conflictMessage,
  };
}
