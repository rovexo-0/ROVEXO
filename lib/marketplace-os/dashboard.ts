import { MOS_VERSION } from "@/lib/marketplace-os/config";
import { readLiveMosDocument } from "@/lib/marketplace-os/engine";
import { evaluateMarketplaceState } from "@/lib/marketplace-os/state";
import { evaluateMarketplaceBalance } from "@/lib/marketplace-os/balance";
import { getActiveRules } from "@/lib/marketplace-os/rules";
import { getRecentAuditLog } from "@/lib/marketplace-os/audit";
import { detectMarketplaceEvents } from "@/lib/marketplace-os/events";
import { generateMarketplaceAlerts } from "@/lib/marketplace-os/alerts";
import { detectMarketplaceOpportunities } from "@/lib/marketplace-intelligence/opportunity";
import { DEFAULT_THRESHOLDS } from "@/lib/marketplace-intelligence/config";
import type { MosControlCenterSnapshot } from "@/lib/marketplace-os/types";

/** MOS Control Center — Super Admin dashboard snapshot. */
export async function buildMosControlCenterSnapshot(
  orchestration: MosControlCenterSnapshot["orchestration"] = null,
): Promise<MosControlCenterSnapshot> {
  const start = Date.now();
  const document = await readLiveMosDocument();
  const thresholds = document.thresholds;

  const state = await evaluateMarketplaceState(thresholds);
  const [balance, events, opportunities] = await Promise.all([
    evaluateMarketplaceBalance(thresholds),
    detectMarketplaceEvents(state, thresholds),
    detectMarketplaceOpportunities({ ...DEFAULT_THRESHOLDS, minInventory: thresholds.minInventory }),
  ]);

  const alerts = await generateMarketplaceAlerts({ state, events, balance, thresholds });

  const automationQueue = getActiveRules(document.rules).map((rule) => ({
    id: rule.id,
    name: rule.name,
    status: rule.enabled ? "pending" : "disabled",
    priority: rule.priority,
  }));

  return {
    engineVersion: MOS_VERSION,
    scannedAt: new Date().toISOString(),
    document,
    marketplaceState: state,
    orchestration,
    activeRules: getActiveRules(document.rules),
    recentDecisions: getRecentAuditLog(20),
    alerts,
    opportunities: opportunities.slice(0, 10).map((entry) => ({ title: entry.title, priority: entry.priority })),
    automationQueue,
    performance: {
      orchestrationMs: Date.now() - start,
      subsystemsOnline: 12,
    },
  };
}
