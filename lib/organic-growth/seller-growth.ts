import { createAdminClient } from "@/lib/supabase/admin";
import { computePopularityScore, popularityFromProduct } from "@/lib/organic-growth/popularity";
import type { Product } from "@/lib/products/types";

export type SellerGrowthProfile = {
  sellerId: string;
  sellerUsername: string | null;
  sellerName: string;
  listingCount: number;
  totalViews: number;
  totalFavorites: number;
  growthScore: number;
  isVerified: boolean;
  isPremium: boolean;
  isNew: boolean;
  storePath: string;
};

export type SellerGrowthReport = {
  generatedAt: string;
  fastGrowingSellers: SellerGrowthProfile[];
  newSuccessfulSellers: SellerGrowthProfile[];
  verifiedSellers: SellerGrowthProfile[];
  premiumSellers: SellerGrowthProfile[];
  topRatedSellers: SellerGrowthProfile[];
  discoveryPages: { label: string; href: string }[];
};

function mapRowToProfile(row: {
  seller_id: string;
  profiles: { username: string | null; full_name: string | null; verified: boolean | null } | null;
  listingCount: number;
  totalViews: number;
  totalFavorites: number;
  isNew: boolean;
  isPremium: boolean;
}): SellerGrowthProfile {
  const username = row.profiles?.username ?? null;
  const storePath = username ? `/user/${username}` : `/store/${row.seller_id}`;
  const growthScore = Math.round(
    row.totalViews * 0.3 + row.totalFavorites * 2 + row.listingCount * 5 + (row.isNew ? 20 : 0),
  );

  return {
    sellerId: row.seller_id,
    sellerUsername: username,
    sellerName: row.profiles?.full_name ?? "Seller",
    listingCount: row.listingCount,
    totalViews: row.totalViews,
    totalFavorites: row.totalFavorites,
    growthScore,
    isVerified: row.profiles?.verified ?? false,
    isPremium: row.isPremium,
    isNew: row.isNew,
    storePath,
  };
}

/** Seller Growth Engine — identifies high-potential sellers for discovery pages. */
export async function buildSellerGrowthReport(): Promise<SellerGrowthReport> {
  try {
    const admin = createAdminClient();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();

    const { data: products } = await admin
      .from("products")
      .select("seller_id, views, likes, created_at, promotion_score, profiles!products_seller_id_fkey(username, full_name, verified)")
      .eq("status", "published")
      .limit(500);

    const sellerMap = new Map<
      string,
      {
        seller_id: string;
        profiles: { username: string | null; full_name: string | null; verified: boolean | null } | null;
        listingCount: number;
        totalViews: number;
        totalFavorites: number;
        isNew: boolean;
        isPremium: boolean;
      }
    >();

    for (const row of products ?? []) {
      const profile = row.profiles as {
        username: string | null;
        full_name: string | null;
        verified: boolean | null;
      } | null;
      const existing = sellerMap.get(row.seller_id);
      const isNew = row.created_at >= thirtyDaysAgo;
      const isPremium = (row.promotion_score ?? 0) > 0;
      if (!existing) {
        sellerMap.set(row.seller_id, {
          seller_id: row.seller_id,
          profiles: profile,
          listingCount: 1,
          totalViews: row.views ?? 0,
          totalFavorites: row.likes ?? 0,
          isNew,
          isPremium,
        });
      } else {
        existing.listingCount += 1;
        existing.totalViews += row.views ?? 0;
        existing.totalFavorites += row.likes ?? 0;
        if (isNew) existing.isNew = true;
        if (isPremium) existing.isPremium = true;
      }
    }

    const profiles = [...sellerMap.values()].map(mapRowToProfile);
    profiles.sort((a, b) => b.growthScore - a.growthScore);

    const newSuccessful = profiles.filter((entry) => entry.isNew && entry.listingCount >= 3);
    const verified = profiles.filter((entry) => entry.isVerified);
    const premium = profiles.filter((entry) => entry.isPremium);
    const topRated = profiles.filter((entry) => entry.totalFavorites > 5).slice(0, 10);

    return {
      generatedAt: new Date().toISOString(),
      fastGrowingSellers: profiles.slice(0, 10),
      newSuccessfulSellers: newSuccessful.slice(0, 10),
      verifiedSellers: verified.slice(0, 10),
      premiumSellers: premium.slice(0, 10),
      topRatedSellers: topRated,
      discoveryPages: [
        { label: "Verified Sellers", href: "/collections/verified-sellers" },
        { label: "New Sellers", href: "/collections/new-sellers" },
        { label: "Top Rated Stores", href: "/collections/top-rated-stores" },
        { label: "Fast Growing Stores", href: "/collections/fastest-growing-stores" },
        { label: "Featured Stores", href: "/collections/featured-stores" },
        { label: "Premium Stores", href: "/collections/premium-stores" },
      ],
    };
  } catch {
    return {
      generatedAt: new Date().toISOString(),
      fastGrowingSellers: [],
      newSuccessfulSellers: [],
      verifiedSellers: [],
      premiumSellers: [],
      topRatedSellers: [],
      discoveryPages: [
        { label: "Verified Sellers", href: "/collections/verified-sellers" },
        { label: "New Sellers", href: "/collections/new-sellers" },
      ],
    };
  }
}

export function scoreSellerFromProducts(products: Product[]): number {
  if (!products.length) return 0;
  const totals = products.reduce(
    (acc, product) => {
      const signals = popularityFromProduct(product);
      acc.views += signals.views;
      acc.favorites += signals.favorites;
      return acc;
    },
    { views: 0, favorites: 0 },
  );
  return computePopularityScore({
    views: totals.views,
    favorites: totals.favorites,
    shares: 0,
    purchases: 0,
    conversionRate: 0,
    freshnessDays: 7,
    isVerifiedSeller: products.some((product) => product.sellerVerified),
    isPremium: products.some((product) => product.isFeatured),
    recentActivityScore: 80,
  }).normalized;
}
