import { detectGrowthOpportunities } from "@/lib/organic-growth/opportunity";
import { evaluateInventoryBalance } from "@/lib/marketplace-intelligence/inventory-balance";
import { filterTopSellers, evaluateSellerHealth } from "@/lib/marketplace-intelligence/seller-health";
import { evaluateCategoryHealth } from "@/lib/marketplace-intelligence/category-health";
import type { IntelligenceThresholds } from "@/lib/marketplace-intelligence/config";
import type { MarketplaceOpportunity } from "@/lib/marketplace-intelligence/types";

/** Marketplace Opportunity Engine — identifies growth opportunities deterministically. */
export async function detectMarketplaceOpportunities(
  thresholds: IntelligenceThresholds,
): Promise<MarketplaceOpportunity[]> {
  const [organic, gaps, categories, sellers] = await Promise.all([
    detectGrowthOpportunities(15),
    evaluateInventoryBalance(),
    evaluateCategoryHealth(thresholds),
    evaluateSellerHealth(thresholds),
  ]);

  const opportunities: MarketplaceOpportunity[] = organic.map((entry) => ({
    id: entry.id,
    type:
      entry.type === "search_demand_gap"
        ? "demand_supply_gap"
        : entry.type === "brand_landing"
          ? "growing_brand"
          : entry.type === "city_discovery"
            ? "growing_location"
            : entry.type === "new_collection"
              ? "missing_category"
              : "fast_growing_store",
    title: entry.title,
    description: entry.description,
    priority: entry.priority,
    actionPath: entry.actionPath,
  }));

  for (const gap of gaps.filter((entry) => entry.severity === "high").slice(0, 5)) {
    opportunities.push({
      id: gap.id,
      type: gap.supply === 0 ? "popular_search_no_inventory" : "demand_supply_gap",
      title: `Supply gap: ${gap.label}`,
      description: `Demand ${gap.demand} vs supply ${gap.supply} (${gap.dimension})`,
      priority: "high",
      actionPath: `/search?q=${encodeURIComponent(gap.label)}`,
    });
  }

  for (const category of categories.filter((entry) => entry.status === "low_inventory").slice(0, 3)) {
    opportunities.push({
      id: `missing-cat-${category.slug}`,
      type: "missing_category",
      title: `Low inventory: ${category.name}`,
      description: `Only ${category.activeListings} active listings — recruit sellers.`,
      priority: "medium",
      actionPath: `/category/${category.slug}`,
    });
  }

  for (const seller of filterTopSellers(sellers).slice(0, 3)) {
    opportunities.push({
      id: `fast-store-${seller.sellerId}`,
      type: "fast_growing_store",
      title: `Fast growing: ${seller.sellerName}`,
      description: `Seller score ${seller.score} with ${seller.factors.listings} listings.`,
      priority: "medium",
      actionPath: seller.username ? `/user/${seller.username}` : undefined,
    });
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return opportunities.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 20);
}
