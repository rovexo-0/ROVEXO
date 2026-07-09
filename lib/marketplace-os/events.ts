import { detectMarketplaceTrends } from "@/lib/marketplace-intelligence/trends";
import { evaluateInventoryBalance } from "@/lib/marketplace-intelligence/inventory-balance";
import { evaluateSearchQuality } from "@/lib/marketplace-intelligence/search-quality";
import { filterTopSellers, evaluateSellerHealth } from "@/lib/marketplace-intelligence/seller-health";
import { DEFAULT_THRESHOLDS } from "@/lib/marketplace-intelligence/config";
import type { MosThresholds } from "@/lib/marketplace-os/config";
import type { MarketplaceEvent } from "@/lib/marketplace-os/types";
import type { MarketplaceState } from "@/lib/marketplace-os/types";

/** Event Engine — detects marketplace events and triggers deterministic actions. */
export async function detectMarketplaceEvents(
  state: MarketplaceState,
  thresholds: MosThresholds,
): Promise<MarketplaceEvent[]> {
  const events: MarketplaceEvent[] = [];
  const intelThresholds = { ...DEFAULT_THRESHOLDS, minInventory: thresholds.minInventory };

  const [trends, gaps, search, sellers] = await Promise.all([
    detectMarketplaceTrends(10),
    evaluateInventoryBalance(),
    evaluateSearchQuality(intelThresholds),
    evaluateSellerHealth(intelThresholds),
  ]);

  if (state.trafficStatus === "high") {
    events.push({
      id: `event-traffic-${Date.now()}`,
      type: "traffic_spike",
      label: "Elevated marketplace traffic",
      severity: "info",
      detectedAt: new Date().toISOString(),
      actionsTriggered: ["refresh_homepage"],
    });
  }

  if (search.zeroResultSearches > thresholds.searchThreshold) {
    events.push({
      id: `event-search-spike-${Date.now()}`,
      type: "search_spike",
      label: "High zero-result search volume",
      severity: "warning",
      detectedAt: new Date().toISOString(),
      metric: search.zeroResultSearches,
      actionsTriggered: ["enable_search_recovery"],
    });
  }

  for (const gap of gaps.filter((entry) => entry.severity === "high").slice(0, 3)) {
    events.push({
      id: `event-supply-${gap.id}`,
      type: "supply_shortage",
      label: `Supply shortage: ${gap.label}`,
      severity: "critical",
      detectedAt: new Date().toISOString(),
      metric: gap.gapRatio,
      actionsTriggered: ["alert_super_admin", "surface_opportunities"],
    });
  }

  for (const trend of trends.filter((entry) => entry.score > 50).slice(0, 3)) {
    events.push({
      id: `event-trend-${trend.href}`,
      type:
        trend.type === "brand"
          ? "brand_growth"
          : trend.type === "category"
            ? "category_growth"
            : trend.type === "collection"
              ? "product_growth"
              : "product_growth",
      label: `Growing: ${trend.label}`,
      severity: "info",
      detectedAt: new Date().toISOString(),
      metric: trend.score,
      actionsTriggered: ["boost_discovery"],
    });
  }

  for (const seller of filterTopSellers(sellers).slice(0, 2)) {
    events.push({
      id: `event-store-${seller.sellerId}`,
      type: "store_growth",
      label: `Store growth: ${seller.sellerName}`,
      severity: "info",
      detectedAt: new Date().toISOString(),
      metric: seller.score,
      actionsTriggered: ["feature_store"],
    });
  }

  if (state.inventoryStatus === "low") {
    events.push({
      id: `event-inventory-${Date.now()}`,
      type: "demand_spike",
      label: "Inventory below healthy levels",
      severity: "warning",
      detectedAt: new Date().toISOString(),
      actionsTriggered: ["inventory_alert"],
    });
  }

  return events;
}

export function mapEventToActions(event: MarketplaceEvent): string[] {
  return event.actionsTriggered;
}
