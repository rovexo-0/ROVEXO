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

/**
 * Inventory Engine v1.0 — RESERVE
 * Sets status=reserved + reserved=true. Never status=sold. Never stock=0.
 */
export async function reserveProductInventory(
  productId: string,
  quantity = 1,
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("reserve_product_inventory", {
    p_product_id: productId,
    p_quantity: quantity,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Insufficient stock." };
  }

  return { success: true };
}

/**
 * Inventory Engine v1.0 — UNLOCK (payment fail / timeout)
 * reserved → published, reserved=false, stock unchanged.
 */
export async function releaseProductInventory(
  productId: string,
  quantity = 1,
): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc("release_product_inventory", {
    p_product_id: productId,
    p_quantity: quantity,
  });
}

/**
 * Inventory Engine v1.0 — MARK SOLD (payment success only)
 * Decrements stock by quantity. Keeps listing published (including stock 0 = Out of Stock).
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
    return { success: false, error: "Unable to mark listing sold." };
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
