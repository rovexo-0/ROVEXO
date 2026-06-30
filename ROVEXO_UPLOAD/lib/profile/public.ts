import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/products/types";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";

export type PublicSellerProfile = {
  id: string;
  fullName: string;
  username: string;
  rating: number;
  reviewCount: number;
  listingCount: number;
  salesCount: number;
  listings: Product[];
};

export async function getPublicSellerProfile(
  username: string,
): Promise<PublicSellerProfile | null> {
  const supabase = await createClient();
  const normalized = username.trim().toLowerCase();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, username, role")
    .eq("username", normalized)
    .maybeSingle();

  if (!profile || !["seller", "business", "admin"].includes(profile.role)) {
    return null;
  }

  const [{ data: sellerProfile }, { data: products }] = await Promise.all([
    supabase
      .from("seller_profiles")
      .select("rating, review_count, listing_count, sales_count")
      .eq("id", profile.id)
      .maybeSingle(),
    supabase
      .from("products")
      .select(
        "id, slug, title, price, original_price, condition, rating, review_count, views, likes, sections, featured_until, bumped_until, product_images(url, is_primary, sort_order), profiles!products_seller_id_fkey(full_name, avatar_url, verified)",
      )
      .eq("seller_id", profile.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const listings: Product[] = (products ?? []).map((row) => {
    const images = [...(row.product_images ?? [])].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
    );
    const seller = row.profiles as {
      full_name: string;
      avatar_url: string | null;
      verified: boolean;
    } | null;

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      price: Number(row.price),
      originalPrice: row.original_price != null ? Number(row.original_price) : null,
      condition: row.condition,
      sellerName: seller?.full_name ?? profile.full_name,
      sellerAvatar: seller?.avatar_url ?? undefined,
      sellerVerified: seller?.verified ?? false,
      rating: Number(row.rating),
      reviewCount: row.review_count,
      views: row.views,
      likes: row.likes,
      imageUrl: images[0]?.url ?? PRODUCT_IMAGE_FALLBACK,
      sections: row.sections as Product["sections"],
      isFeatured: Boolean(row.featured_until && new Date(row.featured_until) > new Date()),
      isBumped: Boolean(row.bumped_until && new Date(row.bumped_until) > new Date()),
    };
  });

  return {
    id: profile.id,
    fullName: profile.full_name,
    username: profile.username,
    rating: Number(sellerProfile?.rating ?? 0),
    reviewCount: sellerProfile?.review_count ?? 0,
    listingCount: sellerProfile?.listing_count ?? listings.length,
    salesCount: sellerProfile?.sales_count ?? 0,
    listings,
  };
}
