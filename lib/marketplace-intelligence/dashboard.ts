import { createAdminClient } from "@/lib/supabase/admin";
import { MARKETPLACE_INTELLIGENCE_VERSION } from "@/lib/marketplace-intelligence/config";
import { readLiveMarketplaceIntelligenceDocument } from "@/lib/marketplace-intelligence/engine";
import { evaluateMarketplaceHealth } from "@/lib/marketplace-intelligence/marketplace-health";
import { evaluateCategoryHealth } from "@/lib/marketplace-intelligence/category-health";
import { evaluateSellerHealth } from "@/lib/marketplace-intelligence/seller-health";
import { evaluateSearchQuality } from "@/lib/marketplace-intelligence/search-quality";
import { evaluateBuyerActivity } from "@/lib/marketplace-intelligence/buyer-activity";
import { evaluateInventoryBalance } from "@/lib/marketplace-intelligence/inventory-balance";
import { detectMarketplaceOpportunities } from "@/lib/marketplace-intelligence/opportunity";
import { detectMarketplaceTrends } from "@/lib/marketplace-intelligence/trends";
import { determineFeaturedCandidates } from "@/lib/marketplace-intelligence/featured";
import { evaluateProductListingQuality } from "@/lib/marketplace-intelligence/listing-quality";
import type { MarketplaceIntelligenceSnapshot } from "@/lib/marketplace-intelligence/types";
import type { Product } from "@/lib/products/types";

async function samplePublishedProducts(limit = 20): Promise<Product[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("products")
      .select("id, slug, title, price, views, likes, rating, review_count, stock, created_at, updated_at, seller_id, promotion_score, profiles!products_seller_id_fkey(verified, username)")
      .eq("status", "published")
      .order("views", { ascending: false })
      .limit(limit);

    return (data ?? []).map(
      (row): Product => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        price: Number(row.price),
        views: row.views ?? 0,
        likes: row.likes ?? 0,
        rating: Number(row.rating ?? 0),
        reviewCount: row.review_count ?? 0,
        createdAt: row.created_at,
        sellerId: row.seller_id,
        promotionScore: row.promotion_score ?? 0,
        sellerVerified: (row.profiles as { verified: boolean | null } | null)?.verified ?? false,
        imageUrl: "/placeholder-product.svg",
        condition: "Used",
        sellerName: "Seller",
        sections: [],
      }),
    );
  } catch {
    return [];
  }
}

/** Marketplace Intelligence Dashboard — Super Admin snapshot. */
export async function buildMarketplaceIntelligenceDashboard(): Promise<MarketplaceIntelligenceSnapshot> {
  const document = await readLiveMarketplaceIntelligenceDocument();
  const thresholds = document.thresholds;

  const [
    marketplaceHealth,
    categoryHealth,
    sellerHealth,
    searchQuality,
    buyerActivity,
    inventoryGaps,
    opportunities,
    trends,
    products,
  ] = await Promise.all([
    evaluateMarketplaceHealth(thresholds),
    evaluateCategoryHealth(thresholds),
    evaluateSellerHealth(thresholds),
    evaluateSearchQuality(thresholds),
    evaluateBuyerActivity(thresholds),
    evaluateInventoryBalance(),
    detectMarketplaceOpportunities(thresholds),
    detectMarketplaceTrends(12),
    samplePublishedProducts(15),
  ]);

  const listingQualitySample = products.map((product) =>
    evaluateProductListingQuality(product, thresholds),
  );
  const featured = await determineFeaturedCandidates(products, thresholds);

  return {
    scannedAt: new Date().toISOString(),
    engineVersion: MARKETPLACE_INTELLIGENCE_VERSION,
    document,
    marketplaceHealth: {
      ...marketplaceHealth,
      factors: {
        ...marketplaceHealth.factors,
        buyers: buyerActivity.healthScore,
      },
    },
    categoryHealth: categoryHealth.slice(0, 12),
    sellerHealth: sellerHealth.slice(0, 12),
    searchQuality,
    inventoryGaps: inventoryGaps.slice(0, 12),
    opportunities,
    featured: featured.slice(0, 12),
    listingQualitySample,
    trends,
  };
}
