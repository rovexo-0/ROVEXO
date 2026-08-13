/**
 * Inventory Engine v1.0 — reserve / release / mark-sold wrappers.
 * Release is idempotent: published + reserved=false is a no-op (never corrupts stock).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { isLowStock } from "@/lib/sell/inventory";
import { notifyLowStock } from "@/lib/inventory/notifications";

/** Purchasable = published + stock > 0. Reserved / sold / draft are never Buy Now. */
export function isPurchasable(stock: number, status: string): boolean {
  return status === "published" && stock > 0;
}

export function isReservedListing(status: string, reservedFlag?: boolean | null): boolean {
  return status === "reserved" || reservedFlag === true;
}

export type ReleaseInventoryResult = {
  released: boolean;
  reason:
    | "released"
    | "already_published"
    | "not_reserved"
    | "sold"
    | "deleted"
    | "not_found"
    | "rpc_error";
};

/**
 * Inventory Engine v1.0 — RESERVE (LEGACY RPC WRAPPER)
 *
 * Cod Sânge Checkout Race Condition: Buy Now / Checkout / Payment / Order
 * MUST NOT call this. Listing stays published until payment claim.
 * Retained only for heal/compat tooling — not a commerce path.
 */
export async function reserveProductInventory(
  productId: string,
  quantity = 1,
): Promise<{ success: boolean; error?: string }> {
  console.error(
    "[RVX][INVENTORY] FORBIDDEN commerce reserveProductInventory call",
    productId,
    quantity,
  );
  return {
    success: false,
    error: "Checkout Race Condition v1.0 — Buy Now must not reserve inventory.",
  };
}

/**
 * Inventory Engine v1.0 — UNLOCK (payment fail / timeout / expire / cancel)
 * reserved → published, reserved=false, stock unchanged.
 *
 * Idempotent: safe to call twice. Never increments stock. Never touches sold/deleted.
 */
export async function releaseProductInventory(
  productId: string,
  quantity = 1,
): Promise<ReleaseInventoryResult> {
  const admin = createAdminClient();

  const { data: product, error: readError } = await admin
    .from("products")
    .select("id, status, reserved")
    .eq("id", productId)
    .maybeSingle();

  if (readError || !product) {
    return { released: false, reason: "not_found" };
  }

  if (product.status === "sold") {
    return { released: false, reason: "sold" };
  }

  if (product.status === "deleted") {
    return { released: false, reason: "deleted" };
  }

  if (product.status === "published" && product.reserved !== true) {
    return { released: false, reason: "already_published" };
  }

  if (product.status !== "reserved" && product.reserved !== true) {
    return { released: false, reason: "not_reserved" };
  }

  const { error } = await admin.rpc("release_product_inventory", {
    p_product_id: productId,
    p_quantity: quantity,
  });

  if (error) {
    return { released: false, reason: "rpc_error" };
  }

  return { released: true, reason: "released" };
}

/**
 * Checkout Race Condition v1.0 — MARK SOLD (payment success claim only)
 * FOR UPDATE claim: decrement stock; remaining 0 → status=sold (marketplace hide).
 * Remaining > 0 → stay published. Concurrent loser → false (ITEM_JUST_SOLD).
 */
export async function markProductSold(
  productId: string,
  quantity = 1,
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("mark_product_sold", {
    p_product_id: productId,
    p_quantity: quantity,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "ITEM_JUST_SOLD" };
  }

  const { data: product } = await admin
    .from("products")
    .select("seller_id, title, stock, low_stock_alert")
    .eq("id", productId)
    .maybeSingle();

  if (
    product &&
    isLowStock(product.stock, product.low_stock_alert) &&
    product.stock > 0
  ) {
    await notifyLowStock({
      sellerId: product.seller_id,
      productId,
      productTitle: product.title,
      stock: product.stock,
    });
  }

  return { success: true };
}

/**
 * Rollback inventory claim when order insert / virtual debit fails after claim.
 */
export async function restoreProductInventoryClaim(
  productId: string,
  quantity = 1,
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("restore_product_inventory_claim", {
    p_product_id: productId,
    p_quantity: quantity,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Unable to restore inventory claim." };
  }

  return { success: true };
}

export type RestoreAfterCancellationResult = {
  restored: boolean;
  reason:
    | "restored_claim"
    | "released_reserve"
    | "already_available"
    | "deleted"
    | "inactive"
    | "not_found"
    | "restore_failed"
    | "not_applicable";
};

/**
 * Buyer cancellation inventory restore (canonical Inventory Engine).
 * Fail-closed: never republish deleted/paused/draft; never invent stock.
 * - reserved → releaseProductInventory
 * - sold (one-off claim) → restoreProductInventoryClaim
 * - published (multi-qty remaining after claim) → restoreProductInventoryClaim (qty only)
 */
export async function restoreInventoryAfterOrderCancellation(
  productId: string,
  quantity = 1,
): Promise<RestoreAfterCancellationResult> {
  const admin = createAdminClient();
  const { data: product, error: readError } = await admin
    .from("products")
    .select("id, status, reserved")
    .eq("id", productId)
    .maybeSingle();

  if (readError || !product) {
    return { restored: false, reason: "not_found" };
  }

  if (product.status === "deleted") {
    return { restored: false, reason: "deleted" };
  }

  if (product.status === "paused" || product.status === "draft") {
    return { restored: false, reason: "inactive" };
  }

  if (product.status === "reserved" || product.reserved === true) {
    const released = await releaseProductInventory(productId, quantity);
    if (released.released || released.reason === "already_published") {
      return {
        restored: released.released,
        reason: released.released ? "released_reserve" : "already_available",
      };
    }
    return { restored: false, reason: "not_applicable" };
  }

  if (product.status === "sold" || product.status === "published") {
    const restored = await restoreProductInventoryClaim(productId, quantity);
    if (!restored.success) {
      return { restored: false, reason: "restore_failed" };
    }
    return { restored: true, reason: "restored_claim" };
  }

  return { restored: false, reason: "not_applicable" };
}

/**
 * Heal path for already-cancelled orders: restore only when still sold/reserved.
 * Published → no-op (avoids double stock on retry after a successful restore).
 */
export async function healInventoryAfterCancelledOrder(
  productId: string,
  quantity = 1,
): Promise<RestoreAfterCancellationResult> {
  const admin = createAdminClient();
  const { data: product, error: readError } = await admin
    .from("products")
    .select("id, status, reserved")
    .eq("id", productId)
    .maybeSingle();

  if (readError || !product) {
    return { restored: false, reason: "not_found" };
  }

  if (product.status === "deleted" || product.status === "paused" || product.status === "draft") {
    return {
      restored: false,
      reason: product.status === "deleted" ? "deleted" : "inactive",
    };
  }

  if (product.status === "sold") {
    const restored = await restoreProductInventoryClaim(productId, quantity);
    return restored.success
      ? { restored: true, reason: "restored_claim" }
      : { restored: false, reason: "restore_failed" };
  }

  if (product.status === "reserved" || product.reserved === true) {
    const released = await releaseProductInventory(productId, quantity);
    return released.released
      ? { restored: true, reason: "released_reserve" }
      : { restored: false, reason: "not_applicable" };
  }

  return { restored: false, reason: "already_available" };
}

/** Claim every line before order insert. On any fail → restore successes → ITEM_JUST_SOLD. */
export async function claimProductsForPaidSale(
  lines: Array<{ productId: string; quantity: number }>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const claimed: Array<{ productId: string; quantity: number }> = [];

  for (const line of lines) {
    const qty = Math.max(1, Math.floor(line.quantity) || 1);
    const sold = await markProductSold(line.productId, qty);
    if (!sold.success) {
      await Promise.all(
        claimed.map((row) => restoreProductInventoryClaim(row.productId, row.quantity)),
      );
      return { ok: false, error: "ITEM_JUST_SOLD" };
    }
    claimed.push({ productId: line.productId, quantity: qty });
  }

  return { ok: true };
}
