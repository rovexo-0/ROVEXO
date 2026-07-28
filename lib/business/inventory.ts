import { createClient } from "@/lib/supabase/server";
import { requireAuthContext } from "@/lib/auth/session";

export type InventoryStatus = "active" | "low_stock" | "out_of_stock";

export type InventoryOverview = {
  totalProducts: number;
  availableListings: number;
  outOfStock: number;
  totalInventory: number;
  unitsSold: number;
  lowStock: number;
};

export type InventoryItem = {
  id: string;
  title: string;
  sku: string;
  stock: number;
  status: InventoryStatus;
  imageUrl: string;
};

function inventoryStatus(stock: number, lowStockAlert: number): InventoryStatus {
  if (stock <= 0) return "out_of_stock";
  if (stock <= lowStockAlert) return "low_stock";
  return "active";
}

export async function listInventoryItems(userId?: string): Promise<InventoryItem[]> {
  const resolvedUserId = userId ?? (await requireAuthContext()).user.id;
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, title, sku, stock, low_stock_alert")
    .eq("seller_id", resolvedUserId)
    .neq("status", "deleted")
    .order("updated_at", { ascending: false });

  if (!products?.length) {
    return [];
  }

  const productIds = products.map((product) => product.id);
  const { data: images } = await supabase
    .from("product_images")
    .select("product_id, url, is_primary, sort_order")
    .in("product_id", productIds);

  const imageByProduct = new Map<string, string>();
  for (const productId of productIds) {
    const productImages =
      images
        ?.filter((image) => image.product_id === productId)
        .sort(
          (a, b) =>
            Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
        ) ?? [];
    imageByProduct.set(productId, productImages[0]?.url ?? "");
  }

  return products.map((product) => ({
    id: product.id,
    title: product.title,
    sku: product.sku ?? `SKU-${product.id.slice(0, 8).toUpperCase()}`,
    stock: product.stock,
    status: inventoryStatus(product.stock, product.low_stock_alert),
    imageUrl: imageByProduct.get(product.id) ?? "",
  }));
}

export async function getInventoryOverview(userId?: string): Promise<InventoryOverview> {
  const resolvedUserId = userId ?? (await requireAuthContext()).user.id;
  const items = await listInventoryItems(resolvedUserId);
  const supabase = await createClient();

  const { data: orderRows } = await supabase
    .from("orders")
    .select("order_items(quantity)")
    .eq("seller_id", resolvedUserId);

  const unitsSold = (orderRows ?? []).reduce((sum, order) => {
    const lines = (order.order_items ?? []) as Array<{ quantity: number | null }>;
    return sum + lines.reduce((lineSum, line) => lineSum + Math.max(0, Number(line.quantity ?? 0)), 0);
  }, 0);

  return {
    totalProducts: items.length,
    availableListings: items.filter((item) => item.status !== "out_of_stock").length,
    outOfStock: items.filter((item) => item.status === "out_of_stock").length,
    totalInventory: items.reduce((sum, item) => sum + Math.max(0, item.stock), 0),
    unitsSold,
    lowStock: items.filter((item) => item.status === "low_stock").length,
  };
}

export async function getSkuByProductId(userId?: string): Promise<Record<string, string>> {
  const items = await listInventoryItems(userId);
  return Object.fromEntries(items.map((item) => [item.id, item.sku]));
}
