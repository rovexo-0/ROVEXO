import { createAdminClient } from "@/lib/supabase/admin";
import { isLowStock } from "@/lib/sell/inventory";
import { notifyLowStock } from "@/lib/inventory/notifications";

export function isPurchasable(stock: number, status: string): boolean {
  return status === "published" && stock > 0;
}

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
