import { buildMarketplaceIntelligenceDashboard } from "@/lib/marketplace-intelligence/dashboard";
import {
  getMarketplaceIntelligenceSnapshotForAdmin,
  readLiveMarketplaceIntelligenceDocument,
} from "@/lib/marketplace-intelligence/engine";

export async function getMarketplaceIntelligenceSnapshot() {
  const [dashboard, config] = await Promise.all([
    buildMarketplaceIntelligenceDashboard(),
    getMarketplaceIntelligenceSnapshotForAdmin(),
  ]);

  return { dashboard, ...config };
}

export async function getPublicIntelligenceThresholds() {
  const document = await readLiveMarketplaceIntelligenceDocument();
  return {
    thresholds: document.thresholds,
    rankingWeights: document.rankingWeights,
  };
}

export type { MarketplaceIntelligenceSnapshot } from "@/lib/marketplace-intelligence/types";
