/**
 * Blood XXIV — LISTING_LOCK_ENGINE
 * Inventory Engine v1.0: lock = RESERVED (never SOLD / never stock=0).
 */

import { isPurchasable, reserveProductInventory, releaseProductInventory } from "@/lib/inventory/service";
import { FINANCIAL_LOGGER } from "@/lib/checkout/engines/idempotency-engine-v1";

export async function LISTING_LOCK_ENGINE(input: {
  productId: string;
  stock: number;
  status: string;
  quantity?: number;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const quantity = Math.max(1, Math.floor(input.quantity ?? 1));
  if (!isPurchasable(input.stock, input.status)) {
    FINANCIAL_LOGGER("LOCK FAILED", "not purchasable");
    return { ok: false, reason: "Listing not purchasable." };
  }
  if (input.stock < quantity) {
    FINANCIAL_LOGGER("LOCK FAILED", "insufficient stock");
    return { ok: false, reason: "Insufficient stock." };
  }
  const reserved = await reserveProductInventory(input.productId, quantity);
  if (!reserved.success) {
    FINANCIAL_LOGGER("LOCK FAILED", reserved.error);
    return { ok: false, reason: reserved.error ?? "Unable to lock listing." };
  }
  FINANCIAL_LOGGER("LOCK PASS");
  return { ok: true };
}

export async function LISTING_UNLOCK_ENGINE(productId: string, quantity = 1): Promise<void> {
  await releaseProductInventory(productId, quantity);
}
