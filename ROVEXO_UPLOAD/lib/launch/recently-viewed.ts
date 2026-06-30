import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/products/types";

type RecentlyViewedRow = {
  viewed_at: string;
  products: {
    id: string;
    slug: string;
    title: string;
    price: number;
    condition: string;
    rating: number;
    review_count: number;
    views: number;
    likes: number;
    profiles: { full_name: string; avatar_url: string | null; verified: boolean } | null;
    product_images: Array<{ url: string; is_primary: boolean; sort_order: number }>;
  };
};

function mapProduct(row: RecentlyViewedRow["products"]): Product {
  const images = [...(row.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: Number(row.price),
    originalPrice: null,
    condition: row.condition,
    sellerName: row.profiles?.full_name ?? "Seller",
    sellerAvatar: row.profiles?.avatar_url,
    sellerVerified: row.profiles?.verified ?? false,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    views: row.views,
    likes: row.likes,
    imageUrl: images[0]?.url ?? "",
    sections: [],
  };
}

export async function recordRecentlyViewed(userId: string, productSlug: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: product } = await supabase.from("products").select("id").eq("slug", productSlug).maybeSingle();
    if (!product) return;

    await supabase.from("recently_viewed").upsert(
      {
        user_id: userId,
        product_id: product.id,
        viewed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,product_id" },
    );
  } catch {
    // Non-blocking launch feature.
  }
}

export async function listRecentlyViewed(userId: string, limit = 12): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("recently_viewed")
      .select(
        `
        viewed_at,
        products (
          id, slug, title, price, condition, rating, review_count, views, likes,
          profiles!products_seller_id_fkey ( full_name, avatar_url, verified ),
          product_images ( url, is_primary, sort_order )
        )
      `,
      )
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(limit);

    return ((data as RecentlyViewedRow[] | null) ?? [])
      .map((row) => (row.products ? mapProduct(row.products) : null))
      .filter((product): product is Product => product !== null);
  } catch {
    return [];
  }
}
