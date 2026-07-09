import type { Product } from "@/lib/products/types";
import { getAllCollectionSlugs, resolveCollectionPage } from "@/lib/seo/engine/collections";
import { detectTrendSignals } from "@/lib/seo/engine/trends";
import { computeProductRankingScore } from "@/lib/marketplace-intelligence/ranking";
import type { IntelligenceThresholds } from "@/lib/marketplace-intelligence/config";
import type { FeaturedCandidate } from "@/lib/marketplace-intelligence/types";
import { filterTopSellers, evaluateSellerHealth } from "@/lib/marketplace-intelligence/seller-health";
import { evaluateCategoryHealth } from "@/lib/marketplace-intelligence/category-health";

/** Featured Engine — determines featured entities via deterministic rules only. */
export async function determineFeaturedCandidates(
  products: Product[],
  thresholds: IntelligenceThresholds,
): Promise<FeaturedCandidate[]> {
  const candidates: FeaturedCandidate[] = [];

  for (const product of products) {
    const ranking = computeProductRankingScore(product, thresholds);
    if (
      ranking.score >= thresholds.featuredMinQualityScore &&
      (product.views ?? 0) >= thresholds.featuredMinViews
    ) {
      candidates.push({
        id: product.id,
        type: "product",
        label: product.title,
        href: `/listing/${product.slug}`,
        score: ranking.score,
        reason: "quality_and_views_threshold",
      });
    } else if (product.isFeatured || (product.promotionScore ?? 0) > 0) {
      candidates.push({
        id: product.id,
        type: "product",
        label: product.title,
        href: `/listing/${product.slug}`,
        score: ranking.score,
        reason: "promotion_active",
      });
    }
  }

  const [sellers, categories, trends] = await Promise.all([
    evaluateSellerHealth(thresholds),
    evaluateCategoryHealth(thresholds),
    detectTrendSignals(10),
  ]);

  for (const seller of filterTopSellers(sellers).slice(0, 5)) {
    candidates.push({
      id: seller.sellerId,
      type: "store",
      label: seller.sellerName,
      href: seller.username ? `/user/${seller.username}` : `/store/${seller.sellerId}`,
      score: seller.score,
      reason: "top_seller",
    });
  }

  for (const category of categories.filter((entry) => entry.status === "growing").slice(0, 4)) {
    candidates.push({
      id: category.slug,
      type: "category",
      label: category.name,
      href: `/category/${category.slug}`,
      score: category.score,
      reason: "growing_category",
    });
  }

  for (const slug of getAllCollectionSlugs().slice(0, 4)) {
    const page = resolveCollectionPage(slug);
    if (page) {
      candidates.push({
        id: slug,
        type: "collection",
        label: page.title.replace(/ \| ROVEXO$/, ""),
        href: page.path,
        score: 60,
        reason: "active_collection",
      });
    }
  }

  for (const signal of trends.filter((entry) => entry.type === "brand").slice(0, 4)) {
    candidates.push({
      id: signal.slug,
      type: "brand",
      label: signal.label,
      href: `/brand/${signal.slug}`,
      score: signal.score,
      reason: "trending_brand",
    });
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, 30);
}
