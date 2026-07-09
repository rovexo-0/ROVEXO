import { detectMarketplaceTrends } from "@/lib/marketplace-intelligence/trends";
import { determineFeaturedCandidates } from "@/lib/marketplace-intelligence/featured";
import { evaluateCategoryHealth } from "@/lib/marketplace-intelligence/category-health";
import { filterTopSellers, evaluateSellerHealth } from "@/lib/marketplace-intelligence/seller-health";
import { DEFAULT_THRESHOLDS } from "@/lib/marketplace-intelligence/config";
import type { MosThresholds } from "@/lib/marketplace-os/config";
import type { PriorityAssignment } from "@/lib/marketplace-os/types";
import type { Product } from "@/lib/products/types";

/** Priority Engine — assigns dynamic priorities via deterministic rules. */
export async function assignMarketplacePriorities(
  thresholds: MosThresholds,
  products: Product[] = [],
): Promise<PriorityAssignment[]> {
  const intelThresholds = { ...DEFAULT_THRESHOLDS, minInventory: thresholds.minInventory };
  const priorities: PriorityAssignment[] = [];

  const [trends, categories, sellers, featured] = await Promise.all([
    detectMarketplaceTrends(thresholds.discoveryLimit),
    evaluateCategoryHealth(intelThresholds),
    evaluateSellerHealth(intelThresholds),
    determineFeaturedCandidates(products, intelThresholds),
  ]);

  for (const trend of trends.slice(0, thresholds.discoveryLimit)) {
    priorities.push({
      entityType: trend.type === "brand" ? "brand" : trend.type === "collection" ? "collection" : trend.type === "location" ? "location" : trend.type === "category" ? "category" : "product",
      entityId: trend.href,
      label: trend.label,
      href: trend.href,
      priority: trend.score,
      reason: "trend_signal",
    });
  }

  for (const category of categories.filter((entry) => entry.status === "growing").slice(0, 8)) {
    priorities.push({
      entityType: "category",
      entityId: category.slug,
      label: category.name,
      href: `/category/${category.slug}`,
      priority: category.score,
      reason: "growing_category",
    });
  }

  for (const seller of filterTopSellers(sellers).slice(0, 6)) {
    priorities.push({
      entityType: "store",
      entityId: seller.sellerId,
      label: seller.sellerName,
      href: seller.username ? `/user/${seller.username}` : `/store/${seller.sellerId}`,
      priority: seller.score,
      reason: "top_seller",
    });
  }

  for (const candidate of featured.slice(0, thresholds.homepageSlots)) {
    priorities.push({
      entityType: candidate.type === "store" ? "store" : candidate.type === "category" ? "category" : candidate.type === "brand" ? "brand" : candidate.type === "collection" ? "collection" : "product",
      entityId: candidate.id,
      label: candidate.label,
      href: candidate.href,
      priority: candidate.score,
      reason: candidate.reason,
    });
  }

  return priorities.sort((a, b) => b.priority - a.priority);
}
