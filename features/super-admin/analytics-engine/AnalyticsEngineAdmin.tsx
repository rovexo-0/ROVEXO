"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EnterpriseEngineAdminShell } from "@/features/super-admin/components/premium/EnterpriseEngineAdminShell";
import { cn } from "@/lib/cn";
import type {
  AnalyticsEngineDocument,
  AnalyticsEngineHistoryEntry,
  AnalyticsEngineSnapshot,
} from "@/lib/analytics-engine/types";

type AnalyticsEngineAdminProps = { initialSnapshot: AnalyticsEngineSnapshot };

type AdminTab =
  | "modules"
  | "live"
  | "reports"
  | "exports"
  | "google"
  | "api"
  | "performance"
  | "integrations"
  | "ai"
  | "future"
  | "history";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "modules", label: "Modules" },
  { id: "live", label: "Live Dashboard" },
  { id: "reports", label: "Reports" },
  { id: "exports", label: "Exports" },
  { id: "google", label: "Google Analytics" },
  { id: "api", label: "API Monitoring" },
  { id: "performance", label: "Performance" },
  { id: "integrations", label: "Integrations" },
  { id: "ai", label: "AI Assistant" },
  { id: "future", label: "Future Ready" },
  { id: "history", label: "History" },
];

export function AnalyticsEngineAdmin({ initialSnapshot }: AnalyticsEngineAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState(initialSnapshot.draft);
  const [activeTab, setActiveTab] = useState<AdminTab>("integrations");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = useCallback(
    (action: "save-draft" | "publish" | "rollback" | "reset-draft" | "export", historyId?: string) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/analytics-engine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, document: draft, historyId }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          draft?: AnalyticsEngineDocument;
          snapshot?: AnalyticsEngineSnapshot;
          error?: string;
          document?: AnalyticsEngineDocument;
        };
        if (!response.ok) {
          setMessage(data.error ?? "Analytics Engine action failed.");
          return;
        }
        if (data.draft) {
          setDraft(data.draft);
          setSnapshot((c) => ({ ...c, draft: data.draft! }));
        }
        if (data.snapshot) setSnapshot(data.snapshot);
        if (action === "export" && data.document) {
          const blob = new Blob([JSON.stringify(data.document, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const anchor = window.document.createElement("a");
          anchor.href = url;
          anchor.download = `rovexo-analytics-engine-${Date.now()}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
        }
        setMessage(action === "publish" ? "Analytics configuration published." : "Action complete.");
      });
    },
    [draft],
  );

  return (
    <EnterpriseEngineAdminShell
      moduleId="analytics-engine"
      eyebrow="Analytics Engine"
      subtitle={`Enterprise business intelligence · ${draft.marketplaceVersion} · ${draft.primaryCountry} · ${draft.currency}`}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as AdminTab)}
      actions={
        <>
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("reset-draft")}>Reset</Button>
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("export")}>Export</Button>
          <Button size="sm" disabled={isPending} onClick={() => runAction("save-draft")}>Save Draft</Button>
          <Button size="sm" disabled={isPending} onClick={() => runAction("publish")}>Publish</Button>
        </>
      }
      message={message}
      isPending={isPending}
    >
      {activeTab === "modules" ? <ListPanel title="Analytics Modules" items={draft.modules.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "live" ? (
        <>
          <ListPanel title="Live Metrics" items={draft.liveMetrics.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} />
          <ListPanel title="Live Charts" items={draft.liveCharts.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} />
        </>
      ) : null}
      {activeTab === "reports" ? <ListPanel title="Report Periods" items={draft.reportPeriods.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "exports" ? <ListPanel title="Export Formats" items={draft.exportFormats.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "google" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">Google Analytics Integration</h2>
          <div className="ea-chip-row">
            <span className={cn("ea-chip", draft.googleAnalytics.ga4Enabled && "ea-chip--active")}>GA4</span>
            <span className={cn("ea-chip", draft.googleAnalytics.gtmEnabled && "ea-chip--active")}>GTM</span>
            <span className={cn("ea-chip", draft.googleAnalytics.searchConsoleEnabled && "ea-chip--active")}>Search Console</span>
            <span className={cn("ea-chip", draft.googleAnalytics.adsConversionEnabled && "ea-chip--active")}>Ads Conversion</span>
          </div>
          <p className="text-sm text-text-muted mt-ds-3">Measurement ID: {draft.googleAnalytics.measurementId}</p>
        </section>
      ) : null}
      {activeTab === "api" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">API Monitoring</h2>
          <div className="ea-chip-row">
            {Object.entries(draft.apiMonitoring).map(([key, enabled]) => (
              <span key={key} className={cn("ea-chip", enabled && "ea-chip--active")}>{key}</span>
            ))}
          </div>
        </section>
      ) : null}
      {activeTab === "performance" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">Performance Monitoring</h2>
          <div className="ea-chip-row">
            {Object.entries(draft.performanceMonitoring).map(([key, enabled]) => (
              <span key={key} className={cn("ea-chip", enabled && "ea-chip--active")}>{key}</span>
            ))}
          </div>
        </section>
      ) : null}
      {activeTab === "integrations" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">Platform Integrations</h2>
          <div className="ea-chip-row">
            {Object.entries(draft.integrations).map(([key, enabled]) => (
              <span key={key} className={cn("ea-chip", enabled && "ea-chip--active")}>{key}</span>
            ))}
          </div>
        </section>
      ) : null}
      {activeTab === "ai" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">AI Assistant (optional)</h2>
          <p className="text-sm text-text-secondary mb-ds-3">Global: {draft.aiAssistant.globalEnabled ? "ON" : "OFF"} · {draft.aiAssistant.execution}</p>
          <div className="ea-chip-row">
            <span className={cn("ea-chip", draft.aiAssistant.trendAnalysis && "ea-chip--active")}>Trends</span>
            <span className={cn("ea-chip", draft.aiAssistant.revenueForecasts && "ea-chip--active")}>Forecasts</span>
            <span className={cn("ea-chip", draft.aiAssistant.anomalyDetection && "ea-chip--active")}>Anomalies</span>
          </div>
        </section>
      ) : null}
      {activeTab === "future" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">Future Ready</h2>
          <div className="ea-chip-row">
            {draft.futureReady.map((item) => (
              <span key={item} className="ea-chip">{item}</span>
            ))}
          </div>
        </section>
      ) : null}
      {activeTab === "history" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">Configuration History</h2>
          <div className="mc-theme-studio__history">
            {snapshot.history.map((entry: AnalyticsEngineHistoryEntry) => (
              <div key={entry.id} className="mc-theme-studio__history-row">
                <div>
                  <p className="font-semibold">{entry.label}</p>
                  <p className="text-sm text-text-secondary">{new Date(entry.publishedAt).toLocaleString()}</p>
                </div>
                {entry.rollbackAvailable ? (
                  <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("rollback", entry.id)}>Rollback</Button>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-sm text-text-muted">
        Public analytics hub: <Link href="/analytics" className="ea-link">/analytics</Link> · Platform dashboard: <Link href="/super-admin/analytics" className="ea-link">/super-admin/analytics</Link>
      </p>
    </EnterpriseEngineAdminShell>
  );
}

function ListPanel({ title, items }: { title: string; items: { name: string; meta: string; enabled: boolean }[] }) {
  return (
    <section className="ea-panel">
      <h2 className="ea-panel__title">{title}</h2>
      <div className="ea-list">
        {items.map((item) => (
          <div key={`${item.name}-${item.meta}`} className="ae-list__row">
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-text-secondary">{item.meta}</p>
            </div>
            <span className={cn("ea-chip", item.enabled && "ea-chip--active")}>{item.enabled ? "Enabled" : "Disabled"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
