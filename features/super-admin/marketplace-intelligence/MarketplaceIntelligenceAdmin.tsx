"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EnterpriseAdminShell } from "@/features/super-admin/components/premium/EnterpriseAdminShell";
import type { MarketplaceIntelligenceSnapshot } from "@/lib/marketplace-intelligence/types";
import type { MarketplaceIntelligenceDocument } from "@/lib/marketplace-intelligence/types";

type MarketplaceIntelligenceAdminProps = {
  initialSnapshot: MarketplaceIntelligenceSnapshot;
  draftDocument: MarketplaceIntelligenceDocument;
};

export function MarketplaceIntelligenceAdmin({
  initialSnapshot,
  draftDocument,
}: MarketplaceIntelligenceAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/marketplace-intelligence");
      if (!response.ok) return;
      const payload = (await response.json()) as { dashboard: MarketplaceIntelligenceSnapshot };
      setSnapshot(payload.dashboard);
      setMessage("Intelligence dashboard refreshed.");
    } finally {
      setBusy(false);
    }
  };

  const runAutomation = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/marketplace-intelligence", { method: "POST" });
      if (!response.ok) return;
      const payload = (await response.json()) as { dashboard: MarketplaceIntelligenceSnapshot };
      setSnapshot(payload.dashboard);
      setMessage("Automation cycle completed.");
    } finally {
      setBusy(false);
    }
  };

  const healthVariant =
    snapshot.marketplaceHealth.status === "healthy"
      ? "success"
      : snapshot.marketplaceHealth.status === "warning"
        ? "warning"
        : "danger";

  return (
    <EnterpriseAdminShell
      moduleId="marketplace-intelligence"
      eyebrow="Marketplace Intelligence"
      title="Marketplace Intelligence"
      description={`v${snapshot.engineVersion} · deterministic rules engine · no AI`}
      message={message}
      actions={
        <div className="flex gap-ds-2">
          <Button variant="secondary" onClick={refresh} disabled={busy}>
            Refresh
          </Button>
          <Button onClick={runAutomation} disabled={busy}>
            Run Automation
          </Button>
        </div>
      }
    >
    <div className="space-y-ds-6">
      <div className="flex flex-wrap gap-ds-2">
        <Badge variant={healthVariant}>Marketplace {snapshot.marketplaceHealth.status}</Badge>
        <Badge variant="default">Score {snapshot.marketplaceHealth.score}/100</Badge>
        <Badge variant="default">Search {snapshot.searchQuality.healthScore}/100</Badge>
      </div>

      <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Zero-result rate</p>
          <p className="mt-ds-1 text-3xl font-bold">{(snapshot.searchQuality.zeroResultRate * 100).toFixed(1)}%</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Inventory gaps</p>
          <p className="mt-ds-1 text-3xl font-bold">{snapshot.inventoryGaps.length}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Opportunities</p>
          <p className="mt-ds-1 text-3xl font-bold">{snapshot.opportunities.length}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Featured candidates</p>
          <p className="mt-ds-1 text-3xl font-bold">{snapshot.featured.length}</p>
        </Card>
      </div>

      <div className="grid gap-ds-4 lg:grid-cols-3">
        <Card className="p-ds-4">
          <h3 className="font-semibold">Configuration thresholds</h3>
          <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
            <li>Min inventory: {draftDocument.thresholds.minInventory}</li>
            <li>Min quality: {draftDocument.thresholds.minQualityScore}</li>
            <li>Min listing completeness: {draftDocument.thresholds.minListingCompleteness}</li>
            <li>Featured min quality: {draftDocument.thresholds.featuredMinQualityScore}</li>
            <li>Refresh interval: {draftDocument.refreshIntervalMinutes}m</li>
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Search quality</h3>
          <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
            <li>Total searches: {snapshot.searchQuality.totalSearches}</li>
            <li>Zero results: {snapshot.searchQuality.zeroResultSearches}</li>
            <li>Low results: {snapshot.searchQuality.lowResultSearches}</li>
            <li>CTR: {(snapshot.searchQuality.clickThroughRate * 100).toFixed(1)}%</li>
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Health factors</h3>
          <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
            {Object.entries(snapshot.marketplaceHealth.factors).map(([key, value]) => (
              <li key={key}>
                {key}: {Math.round(value)}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-ds-4 lg:grid-cols-2">
        <Card className="p-ds-4">
          <h3 className="font-semibold">Category health</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {snapshot.categoryHealth.slice(0, 8).map((category) => (
              <li key={category.slug}>
                <span className="text-text-primary">{category.name}</span>
                <span className="ml-ds-2 text-text-muted">
                  {category.score} · {category.status} · {category.activeListings} listings
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Seller health</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {snapshot.sellerHealth.slice(0, 8).map((seller) => (
              <li key={seller.sellerId}>
                <span className="text-text-primary">{seller.sellerName}</span>
                <span className="ml-ds-2 text-text-muted">
                  {seller.score} · {seller.status}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-ds-4 lg:grid-cols-2">
        <Card className="p-ds-4">
          <h3 className="font-semibold">Listing quality sample</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {snapshot.listingQualitySample.slice(0, 6).map((listing) => (
              <li key={listing.listingId}>
                <span className="text-text-primary">{listing.title}</span>
                <span className="ml-ds-2 text-text-muted">
                  {listing.score}/100 · {listing.completeness}% complete
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Marketplace opportunities</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {snapshot.opportunities.slice(0, 6).map((opp) => (
              <li key={opp.id}>
                <Badge variant={opp.priority === "high" ? "warning" : "default"}>{opp.priority}</Badge>
                <span className="ml-ds-2 text-text-secondary">{opp.title}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-ds-4">
        <h3 className="font-semibold">Trending</h3>
        <ul className="mt-ds-3 flex flex-wrap gap-ds-2 text-sm">
          {snapshot.trends.slice(0, 10).map((trend) => (
            <li key={trend.href} className="rounded-full border border-border px-ds-3 py-ds-1 text-text-secondary">
              {trend.label} ({trend.score})
            </li>
          ))}
        </ul>
      </Card>
    </div>
    </EnterpriseAdminShell>
  );
}
