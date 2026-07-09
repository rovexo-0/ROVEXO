import { filterAtRiskSellers } from "@/lib/marketplace-intelligence/seller-health";
import { evaluateSellerHealth } from "@/lib/marketplace-intelligence/seller-health";
import { evaluateSearchQuality } from "@/lib/marketplace-intelligence/search-quality";
import { DEFAULT_THRESHOLDS } from "@/lib/marketplace-intelligence/config";
import type { MosThresholds } from "@/lib/marketplace-os/config";
import type { MarketplaceEvent, MarketplaceState, MosAlert } from "@/lib/marketplace-os/types";
import type { BalanceReport } from "@/lib/marketplace-os/types";

/** Marketplace Alert Engine — generates Super Admin alerts deterministically. */
export async function generateMarketplaceAlerts(input: {
  state: MarketplaceState;
  events: MarketplaceEvent[];
  balance: BalanceReport;
  thresholds: MosThresholds;
}): Promise<MosAlert[]> {
  const alerts: MosAlert[] = [];
  const now = new Date().toISOString();
  const intelThresholds = { ...DEFAULT_THRESHOLDS, inactiveSellerDays: input.thresholds.maxInactivityDays };

  if (input.state.inventoryStatus === "critical") {
    alerts.push({
      id: `alert-inv-${Date.now()}`,
      type: "inventory_shortage",
      severity: "critical",
      title: "Critical inventory shortage",
      message: "Multiple categories below minimum inventory thresholds.",
      createdAt: now,
      acknowledged: false,
    });
  }

  for (const entry of input.balance.undersupplied.slice(0, 3)) {
    alerts.push({
      id: `alert-cat-${entry.label.replace(/\s+/g, "-")}`,
      type: "category_imbalance",
      severity: "warning",
      title: `Low inventory: ${entry.label}`,
      message: `Only ${entry.supply} listings vs demand score ${entry.demand}.`,
      createdAt: now,
      acknowledged: false,
    });
  }

  const sellers = await evaluateSellerHealth(intelThresholds);
  for (const seller of filterAtRiskSellers(sellers).slice(0, 3)) {
    alerts.push({
      id: `alert-seller-${seller.sellerId}`,
      type: "seller_inactivity",
      severity: "warning",
      title: `At-risk seller: ${seller.sellerName}`,
      message: `Seller health score ${seller.score} — status ${seller.status}.`,
      createdAt: now,
      acknowledged: false,
    });
  }

  if (input.state.trafficStatus === "high") {
    alerts.push({
      id: `alert-traffic-${Date.now()}`,
      type: "traffic_anomaly",
      severity: "info",
      title: "Traffic spike detected",
      message: "Marketplace traffic above normal levels.",
      createdAt: now,
      acknowledged: false,
    });
  }

  if (input.state.conversionStatus === "critical") {
    alerts.push({
      id: `alert-conversion-${Date.now()}`,
      type: "conversion_drop",
      severity: "critical",
      title: "Conversion rate critical",
      message: "Buyer conversion below configured minimum.",
      createdAt: now,
      acknowledged: false,
    });
  }

  const search = await evaluateSearchQuality(intelThresholds);
  if (search.zeroResultRate > 0.2) {
    alerts.push({
      id: `alert-search-${Date.now()}`,
      type: "search_failure",
      severity: "warning",
      title: "High zero-result search rate",
      message: `${(search.zeroResultRate * 100).toFixed(1)}% of searches return zero results.`,
      createdAt: now,
      acknowledged: false,
    });
  }

  if (input.state.trustScore < input.thresholds.minTrustScore) {
    alerts.push({
      id: `alert-trust-${Date.now()}`,
      type: "trust_issue",
      severity: "warning",
      title: "Marketplace trust below threshold",
      message: `Trust score ${input.state.trustScore} below minimum ${input.thresholds.minTrustScore}.`,
      createdAt: now,
      acknowledged: false,
    });
  }

  for (const event of input.events.filter((entry) => entry.severity === "critical")) {
    alerts.push({
      id: `alert-event-${event.id}`,
      type: "marketplace_risk",
      severity: "critical",
      title: event.label,
      message: `Event ${event.type} triggered: ${event.actionsTriggered.join(", ")}`,
      createdAt: event.detectedAt,
      acknowledged: false,
    });
  }

  return alerts;
}
