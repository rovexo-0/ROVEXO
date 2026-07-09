import { evaluateCategoryHealth } from "@/lib/marketplace-intelligence/category-health";
import { evaluateInventoryBalance } from "@/lib/marketplace-intelligence/inventory-balance";
import { DEFAULT_THRESHOLDS } from "@/lib/marketplace-intelligence/config";
import type { MosThresholds } from "@/lib/marketplace-os/config";
import type { BalanceReport } from "@/lib/marketplace-os/types";

/** Balance Engine — detects oversupply, undersupply, and market imbalances. */
export async function evaluateMarketplaceBalance(thresholds: MosThresholds): Promise<BalanceReport> {
  const intelThresholds = {
    ...DEFAULT_THRESHOLDS,
    lowInventoryThreshold: thresholds.minInventory,
    oversaturatedListingsPerCategory: thresholds.categoryLimit * 10,
  };

  const [categories, gaps] = await Promise.all([
    evaluateCategoryHealth(intelThresholds),
    evaluateInventoryBalance(),
  ]);

  const oversupplied = categories
    .filter((entry) => entry.status === "oversaturated")
    .map((entry) => ({
      label: entry.name,
      supply: entry.activeListings,
      threshold: intelThresholds.oversaturatedListingsPerCategory,
    }));

  const undersupplied = categories
    .filter((entry) => entry.status === "low_inventory")
    .map((entry) => ({
      label: entry.name,
      supply: entry.activeListings,
      demand: entry.demandScore,
    }));

  const growingMarkets = categories
    .filter((entry) => entry.status === "growing")
    .map((entry) => ({ label: entry.name, growthRate: entry.demandScore }));

  const decliningMarkets = categories
    .filter((entry) => entry.status === "declining")
    .map((entry) => ({ label: entry.name, declineRate: 100 - entry.score }));

  const locationImbalance = gaps
    .filter((gap) => gap.dimension === "location")
    .map((gap) => ({ label: gap.label, gap: gap.gapRatio }));

  return {
    oversupplied,
    undersupplied,
    growingMarkets,
    decliningMarkets,
    locationImbalance,
  };
}
