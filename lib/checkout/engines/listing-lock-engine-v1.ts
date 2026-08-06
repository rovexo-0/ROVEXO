/**
 * Blood XXIV — LISTING_LOCK_ENGINE (Checkout Race Condition v1.0)
 *
 * Buy Now verifies availability only. Does NOT set status=reserved.
 * Marketplace visibility stays published until payment + atomic sold claim.
 */

import { isPurchasable, releaseProductInventory } from "@/lib/inventory/service";
import { FINANCIAL_LOGGER } from "@/lib/checkout/engines/idempotency-engine-v1";
import { INVENTORY_LIFECYCLE_LOG } from "@/lib/checkout/engines/checkout-session-engine-v1";

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
  // Checkout Race Condition v1.0 — no inventory reserve at Buy Now.
  INVENTORY_LIFECYCLE_LOG("skip", {
    listingId: input.productId,
    reason: "buy_now_verify_only_no_reserve",
  });
  FINANCIAL_LOGGER("LOCK PASS");
  return { ok: true };
}

export async function LISTING_UNLOCK_ENGINE(productId: string, quantity = 1): Promise<void> {
  // Idempotent: no-op when never reserved (published + reserved=false).
  const result = await releaseProductInventory(productId, quantity);
  INVENTORY_LIFECYCLE_LOG(result.released ? "release" : "skip", {
    listingId: productId,
    reason: result.released ? "listing_unlock" : result.reason,
  });
  if (result.released) {
    INVENTORY_LIFECYCLE_LOG("restore", {
      listingId: productId,
      reason: "listing_unlock",
    });
  }
}
