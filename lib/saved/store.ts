import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types/database";
import { getProductCategorySlug } from "@/lib/saved/categories";
import type { SavedItem } from "@/lib/saved/types";
import type { Product } from "@/lib/products/types";

type SavedRow = Tables<"saved_items"> & {
  products: Tables<"products"> & {
    profiles: Pick<Tables<"profiles">, "full_name" | "avatar_url" | "verified"> | null;
    product_images: Pick<Tables<"product_images">, "url" | "is_primary" | "sort_order">[];
    categories: Pick<Tables<"categories">, "slug"> | null;
  };
};

function mapSavedRow(row: SavedRow): SavedItem {
  const images = [...(row.products.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );

  const product: Product = {
    id: row.products.id,
    slug: row.products.slug,
    title: row.products.title,
    price: Number(row.products.price),
    originalPrice: row.products.original_price != null ? Number(row.products.original_price) : null,
    condition: row.products.condition,
    sellerName: row.products.profiles?.full_name ?? "Seller",
    sellerAvatar: row.products.profiles?.avatar_url,
    sellerVerified: row.products.profiles?.verified,
    rating: Number(row.products.rating),
    reviewCount: row.products.review_count,
    views: row.products.views,
    likes: row.products.likes,
    imageUrl: images[0]?.url ?? "",
    sections: (row.products.sections ?? []) as Product["sections"],
  };

  return {
    productSlug: row.products.slug,
    savedAt: row.saved_at,
    lastViewedAt: row.last_viewed_at ?? row.saved_at,
    categorySlug: row.products.categories?.slug ?? getProductCategorySlug(row.products.slug),
    product,
  };
}

export async function listSavedItems(userId: string): Promise<SavedItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_items")
    .select(
      `
      *,
      products (
        *,
        profiles!products_seller_id_fkey ( full_name, avatar_url, verified ),
        product_images ( url, is_primary, sort_order ),
        categories ( slug )
      )
    `,
    )
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  return ((data as SavedRow[] | null) ?? []).map(mapSavedRow);
}

export async function removeSavedItems(
  userId: string,
  productSlugs: string[],
): Promise<SavedItem[]> {
  if (!productSlugs.length) {
    return listSavedItems(userId);
  }

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, slug")
    .in("slug", productSlugs);

  const productIds = products?.map((product) => product.id) ?? [];
  if (productIds.length) {
    await supabase
      .from("saved_items")
      .delete()
      .eq("user_id", userId)
      .in("product_id", productIds);
  }

  return listSavedItems(userId);
}

export async function saveItem(userId: string, productSlug: string): Promise<void> {
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("slug", productSlug)
    .single();

  if (!product) {
    return;
  }

  await supabase.from("saved_items").upsert({
    user_id: userId,
    product_id: product.id,
    saved_at: new Date().toISOString(),
  });
}
