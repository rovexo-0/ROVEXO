import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPurchasable } from "@/lib/inventory/service";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";

export type CartItem = {
  id: string;
  productId: string;
  slug: string;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stock: number;
  available: boolean;
};

export type CartSummary = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
};

const CART_SELECT = `
  id,
  product_id,
  quantity,
  products:product_id (
    id,
    slug,
    title,
    price,
    stock,
    status,
    product_images ( url, is_primary, sort_order )
  )
`;

function mapCartRow(row: {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    slug: string;
    title: string;
    price: number;
    stock: number;
    status: string;
    product_images?: Array<{ url: string; is_primary: boolean; sort_order: number }>;
  } | null;
}): CartItem | null {
  if (!row.products) {
    return null;
  }

  const images = [...(row.products.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );

  return {
    id: row.id,
    productId: row.products.id,
    slug: row.products.slug,
    title: row.products.title,
    price: Number(row.products.price),
    imageUrl: images[0]?.url ?? PRODUCT_IMAGE_FALLBACK,
    quantity: row.quantity,
    stock: row.products.stock,
    available: isPurchasable(row.products.stock, row.products.status),
  };
}

export async function getCartSummary(userId: string): Promise<CartSummary> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cart_items")
    .select(CART_SELECT)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  const items = (data ?? [])
    .map((row) => mapCartRow(row as Parameters<typeof mapCartRow>[0]))
    .filter((item): item is CartItem => item !== null);

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
}

export async function addToCart(
  userId: string,
  productSlug: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id, stock, status, seller_id")
    .eq("slug", productSlug)
    .maybeSingle();

  if (!product) {
    return { success: false, error: "Product not found." };
  }

  if (product.seller_id === userId) {
    return { success: false, error: "You cannot add your own listing to cart." };
  }

  if (!isPurchasable(product.stock, product.status)) {
    return { success: false, error: "This item is out of stock." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", product.id)
    .maybeSingle();

  if (existing) {
    if (existing.quantity >= product.stock) {
      return { success: false, error: "Maximum available quantity already in cart." };
    }

    await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + 1 })
      .eq("id", existing.id);

    return { success: true };
  }

  const { error } = await supabase.from("cart_items").insert({
    user_id: userId,
    product_id: product.id,
    quantity: 1,
  });

  if (error) {
    return { success: false, error: "Unable to add to cart." };
  }

  return { success: true };
}

export async function removeFromCart(userId: string, productSlug: string): Promise<void> {
  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id")
    .eq("slug", productSlug)
    .maybeSingle();

  if (!product) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", product.id);
}

export async function clearCart(userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("cart_items").delete().eq("user_id", userId);
}
