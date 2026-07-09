"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { MosControlCenterSnapshot } from "@/lib/marketplace-os/types";
import type { MosDocument } from "@/lib/marketplace-os/types";

type MosControlCenterProps = {
  initialSnapshot: MosControlCenterSnapshot;
  draftDocument: MosDocument;
};

export function MosControlCenter({ initialSnapshot, draftDocument }: MosControlCenterProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/marketplace-os");
      if (!response.ok) return;
      const payload = (await response.json()) as { snapshot: MosControlCenterSnapshot };
      setSnapshot(payload.snapshot);
      setMessage("MOS control center refreshed.");
    } finally {
      setBusy(false);
    }
  };

  const runOrchestration = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/marketplace-os", { method: "POST" });
      if (!response.ok) return;
      const payload = (await response.json()) as { snapshot: MosControlCenterSnapshot };
      setSnapshot(payload.snapshot);
      setMessage("Orchestration cycle completed.");
    } finally {
      setBusy(false);
    }
  };

  const statusVariant =
    snapshot.marketplaceState.status === "operational"
      ? "success"
      : snapshot.marketplaceState.status === "degraded"
        ? "warning"
        : "danger";

  return (
    <div className="space-y-ds-6">
      <div className="flex flex-wrap items-center justify-between gap-ds-3">
        <div>
          <h2 className="text-xl font-semibold">Marketplace Operating System</h2>
          <p className="text-sm text-text-secondary">
            MOS v{snapshot.engineVersion} · deterministic orchestration · zero AI
          </p>
        </div>
        <div className="flex gap-ds-2">
          <Button variant="secondary" onClick={refresh} disabled={busy}>
            Refresh
          </Button>
          <Button onClick={runOrchestration} disabled={busy}>
            Run Orchestration
          </Button>
        </div>
      </div>

      {message && <p className="text-sm text-text-secondary">{message}</p>}

      <div className="flex flex-wrap gap-ds-2">
        <Badge variant={statusVariant}>Marketplace {snapshot.marketplaceState.status}</Badge>
        <Badge variant="default">Health {snapshot.marketplaceState.healthScore}/100</Badge>
        <Badge variant="default">Trust {snapshot.marketplaceState.trustScore}/100</Badge>
        <Badge variant="default">{snapshot.activeRules.length} active rules</Badge>
      </div>

      <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Balance score</p>
          <p className="mt-ds-1 text-3xl font-bold">{snapshot.marketplaceState.balanceScore}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Buyer activity</p>
          <p className="mt-ds-1 text-3xl font-bold">{snapshot.marketplaceState.buyerActivityScore}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Seller activity</p>
          <p className="mt-ds-1 text-3xl font-bold">{snapshot.marketplaceState.sellerActivityScore}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Alerts</p>
          <p className="mt-ds-1 text-3xl font-bold">{snapshot.alerts.length}</p>
        </Card>
      </div>

      <div className="grid gap-ds-4 lg:grid-cols-3">
        <Card className="p-ds-4">
          <h3 className="font-semibold">Marketplace state</h3>
          <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
            <li>Inventory: {snapshot.marketplaceState.inventoryStatus}</li>
            <li>Growth: {snapshot.marketplaceState.growthStatus}</li>
            <li>Traffic: {snapshot.marketplaceState.trafficStatus}</li>
            <li>Conversion: {snapshot.marketplaceState.conversionStatus}</li>
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Configuration</h3>
          <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
            <li>Min inventory: {draftDocument.thresholds.minInventory}</li>
            <li>Homepage slots: {draftDocument.thresholds.homepageSlots}</li>
            <li>Discovery limit: {draftDocument.thresholds.discoveryLimit}</li>
            <li>Refresh: {draftDocument.thresholds.orchestrationIntervalMinutes}m</li>
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Performance</h3>
          <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
            <li>Scan time: {snapshot.performance.orchestrationMs}ms</li>
            <li>Subsystems online: {snapshot.performance.subsystemsOnline}</li>
            <li>Automation: {draftDocument.automationEnabled ? "enabled" : "disabled"}</li>
            <li>Audit: {draftDocument.auditEnabled ? "enabled" : "disabled"}</li>
          </ul>
        </Card>
      </div>

      <div className="grid gap-ds-4 lg:grid-cols-2">
        <Card className="p-ds-4">
          <h3 className="font-semibold">Active rules</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {snapshot.activeRules.slice(0, 8).map((rule) => (
              <li key={rule.id}>
                <span className="text-text-primary">{rule.name}</span>
                <span className="ml-ds-2 text-text-muted">p{rule.priority}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Automation queue</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {snapshot.automationQueue.slice(0, 8).map((item) => (
              <li key={item.id}>
                <span className="text-text-primary">{item.name}</span>
                <span className="ml-ds-2 text-text-muted">{item.status}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-ds-4 lg:grid-cols-2">
        <Card className="p-ds-4">
          <h3 className="font-semibold">Alerts</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {snapshot.alerts.slice(0, 6).map((alert) => (
              <li key={alert.id}>
                <Badge variant={alert.severity === "critical" ? "danger" : alert.severity === "warning" ? "warning" : "default"}>
                  {alert.severity}
                </Badge>
                <span className="ml-ds-2 text-text-secondary">{alert.title}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Recent decisions</h3>
          <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
            {snapshot.recentDecisions.slice(0, 6).map((entry) => (
              <li key={entry.id}>
                {entry.ruleId}: {entry.reason}
              </li>
            ))}
            {snapshot.recentDecisions.length === 0 && <li>No decisions logged yet.</li>}
          </ul>
        </Card>
      </div>

      {snapshot.orchestration && (
        <Card className="p-ds-4">
          <h3 className="font-semibold">Last orchestration</h3>
          <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
            <li>Status: {snapshot.orchestration.status}</li>
            <li>Rules executed: {snapshot.orchestration.rulesExecuted}</li>
            <li>Events: {snapshot.orchestration.eventsDetected}</li>
            <li>Subsystems: {snapshot.orchestration.subsystemsCoordinated.join(", ")}</li>
          </ul>
        </Card>
      )}
    </div>
  );
}
