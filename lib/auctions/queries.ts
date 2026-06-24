import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/types/database";
import { isPromotionActive } from "@/lib/promotions/format";
import { refreshExpiredPromotions } from "@/lib/promotions/service";
import { getActiveMarket } from "@/lib/seo/markets";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";
import { AUCTION_CATEGORIES } from "@/lib/auctions/constants";
import {
  computeMinNextBid,
  isEndingWithin24Hours,
} from "@/lib/auctions/utils";
import type {
  AuctionCategoryCount,
  AuctionListing,
  AuctionsPageData,
  AuctionStats,
} from "@/lib/auctions/types";

type AuctionRow = Tables<"products"> & {
  profiles: Pick<Tables<"profiles">, "full_name" | "avatar_url" | "verified" | "username"> | null;
  product_images: Pick<Tables<"product_images">, "url" | "sort_order" | "is_primary">[];
  brands: Pick<Tables<"brands">, "name"> | null;
  categories: Pick<Tables<"categories">, "slug"> | null;
};

const AUCTION_SELECT = `
  *,
  profiles!products_seller_id_fkey ( full_name, avatar_url, verified, username ),
  product_images ( url, sort_order, is_primary ),
  brands ( name ),
  categories ( slug )
`;

function primaryImage(row: AuctionRow): string {
  const sorted = [...(row.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  return sorted[0]?.url ?? PRODUCT_IMAGE_FALLBACK;
}

function deriveTrustScore(rating: number, verified: boolean): number {
  const base = Math.round(45 + rating * 11);
  return Math.min(100, verified ? base + 5 : base);
}

function mapAuctionRow(row: AuctionRow): AuctionListing {
  const verified = row.profiles?.verified ?? false;
  const rating = Number(row.rating);
  const currentBid =
    row.current_bid != null
      ? Number(row.current_bid)
      : row.auction_start_price != null
        ? Number(row.auction_start_price)
        : Number(row.price);
  const buyNowPrice =
    row.accept_offers && Number(row.price) > currentBid ? Number(row.price) : null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : null,
    condition: row.condition,
    brand: row.brands?.name,
    sellerName: row.profiles?.full_name ?? "Seller",
    sellerId: row.seller_id,
    sellerAvatar: row.profiles?.avatar_url,
    sellerVerified: verified,
    sellerTrustScore: deriveTrustScore(rating, verified),
    sellerResponseRate: Math.min(100, Math.round(70 + rating * 6)),
    location: getActiveMarket().name,
    listingType: "auction",
    auctionEndsAt: row.auction_ends_at,
    auctionCurrentBid: currentBid,
    rating,
    reviewCount: row.review_count,
    views: row.views,
    likes: row.likes,
    imageUrl: primaryImage(row),
    sections: (row.sections ?? []) as AuctionListing["sections"],
    isFeatured: isPromotionActive(row.featured_until),
    isBumped: isPromotionActive(row.bumped_until),
    bidCount: row.bid_count ?? 0,
    watchers: Math.max(row.views ?? 0, row.likes ?? 0),
    minNextBid: computeMinNextBid(currentBid),
    buyNowPrice,
    reserveMet: row.reserve_price == null || currentBid >= Number(row.reserve_price),
    isEndingSoon: isEndingWithin24Hours(row.auction_ends_at),
    hasBuyNow: buyNowPrice != null && buyNowPrice > 0,
    categorySlug: row.categories?.slug ?? null,
    createdAtMs: new Date(row.created_at).getTime(),
  };
}

async function enrichTrustScores(auctions: AuctionListing[]): Promise<AuctionListing[]> {
  const sellerIds = [...new Set(auctions.map((item) => item.sellerId).filter(Boolean))] as string[];
  if (!sellerIds.length) return auctions;

  const admin = createAdminClient();
  const { data } = await admin
    .from("trust_scores")
    .select("user_id, score, tier")
    .in("user_id", sellerIds);

  const trustBySeller = new Map(
    (data ?? []).map((row) => [String(row.user_id), { score: Number(row.score), tier: String(row.tier) }]),
  );

  return auctions.map((auction) => {
    const trust = auction.sellerId ? trustBySeller.get(auction.sellerId) : undefined;
    if (!trust) return auction;
    return {
      ...auction,
      sellerTrustScore: trust.score,
      sellerTier: trust.tier,
    };
  });
}

function buildCategoryCounts(auctions: AuctionListing[]): AuctionCategoryCount[] {
  return AUCTION_CATEGORIES.map((category) => ({
    ...category,
    liveCount: auctions.filter((item) => item.categorySlug?.startsWith(category.slug)).length,
  }));
}

function buildStats(auctions: AuctionListing[]): AuctionStats {
  return {
    liveAuctions: auctions.length,
    endingSoon: auctions.filter((item) => item.isEndingSoon).length,
    activeBidders: auctions.reduce((sum, item) => sum + item.bidCount, 0),
    watchingNow: auctions.reduce((sum, item) => sum + item.watchers, 0),
  };
}

export async function getAuctionsPageData(): Promise<AuctionsPageData> {
  await refreshExpiredPromotions();

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("products")
    .select(AUCTION_SELECT)
    .eq("status", "published")
    .eq("listing_type", "auction")
    .gt("auction_ends_at", now)
    .order("auction_ends_at", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data as AuctionRow[] | null) ?? [];
  let auctions = await enrichTrustScores(rows.map(mapAuctionRow));

  if (auctions.length === 0) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("products")
      .select(AUCTION_SELECT)
      .eq("status", "published")
      .eq("listing_type", "auction")
      .order("created_at", { ascending: false })
      .limit(24);

    if (fallbackError) throw fallbackError;
    auctions = await enrichTrustScores(((fallbackData as AuctionRow[] | null) ?? []).map(mapAuctionRow));
  }

  const featured = auctions.filter((item) => item.isFeatured).slice(0, 6);
  const featuredOrTop = featured.length ? featured : auctions.slice(0, 4);

  return {
    stats: buildStats(auctions),
    categories: buildCategoryCounts(auctions),
    featured: featuredOrTop,
    endingSoon: [...auctions]
      .filter((item) => item.isEndingSoon)
      .sort((a, b) => {
        const aEnd = a.auctionEndsAt ? new Date(a.auctionEndsAt).getTime() : 0;
        const bEnd = b.auctionEndsAt ? new Date(b.auctionEndsAt).getTime() : 0;
        return aEnd - bEnd;
      })
      .slice(0, 8),
    newest: [...auctions].sort((a, b) => b.createdAtMs - a.createdAtMs).slice(0, 8),
    mostWatched: [...auctions].sort((a, b) => b.watchers - a.watchers).slice(0, 8),
    all: auctions,
  };
}
