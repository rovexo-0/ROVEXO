import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/products/types";
import { getEligibleListings } from "@/lib/listings/eligible-listings";

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

  const [{ data: sellerProfile }, storeListings] = await Promise.all([
    supabase
      .from("seller_profiles")
      .select("rating, review_count, listing_count, sales_count")
      .eq("id", profile.id)
      .maybeSingle(),
    // Canonical resolver: the seller store shows exactly the listings that are
    // publicly visible everywhere else (Homepage/Search/Category parity).
    getEligibleListings({
      surface: "seller",
      sellerId: profile.id,
      page: 1,
      pageSize: 12,
    }),
  ]);

  const listings: Product[] = storeListings.items;

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
