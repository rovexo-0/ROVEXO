"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EnterpriseEngineAdminShell } from "@/features/super-admin/components/premium/EnterpriseEngineAdminShell";
import { cn } from "@/lib/cn";
import type { PaymentsEngineDocument, PaymentsEngineHistoryEntry, PaymentsEngineSnapshot } from "@/lib/payments-engine/types";

type PaymentsEngineAdminProps = {
  initialSnapshot: PaymentsEngineSnapshot;
};

type AdminTab = "methods" | "providers" | "payouts" | "fraud" | "integrations" | "notifications" | "analytics" | "ai" | "future" | "history";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "methods", label: "Payment Methods" },
  { id: "providers", label: "Providers" },
  { id: "payouts", label: "Payout Methods" },
  { id: "fraud", label: "Fraud Prevention" },
  { id: "integrations", label: "Integrations" },
  { id: "notifications", label: "Notifications" },
  { id: "analytics", label: "Analytics" },
  { id: "ai", label: "AI Assistant" },
  { id: "future", label: "Future Ready" },
  { id: "history", label: "History" },
];

export function PaymentsEngineAdmin({ initialSnapshot }: PaymentsEngineAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState(initialSnapshot.draft);
  const [activeTab, setActiveTab] = useState<AdminTab>("integrations");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = useCallback(
    (action: "save-draft" | "publish" | "rollback" | "reset-draft" | "export", historyId?: string) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/payments-engine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, document: draft, historyId }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          draft?: PaymentsEngineDocument;
          snapshot?: PaymentsEngineSnapshot;
          error?: string;
          document?: PaymentsEngineDocument;
        };
        if (!response.ok) {
          setMessage(data.error ?? "Payments Engine action failed.");
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
          anchor.download = `rovexo-payments-engine-${Date.now()}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
        }
        setMessage(action === "publish" ? "Payments configuration published." : "Action complete.");
      });
    },
    [draft],
  );

  return (
    <EnterpriseEngineAdminShell
      moduleId="payments-engine"
      eyebrow="Payments Engine"
      subtitle={`Enterprise payment orchestration · ${draft.marketplaceVersion} · ${draft.primaryCountry} · ${draft.currency}`}
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
      {activeTab === "methods" ? <ListPanel title="Payment Methods" items={draft.paymentMethods.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "providers" ? <ListPanel title="Payment Providers" items={draft.providers.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "payouts" ? <ListPanel title="Payout Methods" items={draft.payoutMethods.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "fraud" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">Fraud Prevention</h2>
          <div className="ea-chip-row">
            {Object.entries(draft.fraudPrevention).map(([key, enabled]) => (
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
      {activeTab === "notifications" ? (
        <ListPanel title="Payment Notifications" items={draft.notifications.map((n) => ({ name: n.event, meta: n.audience, enabled: n.enabled }))} />
      ) : null}
      {activeTab === "analytics" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">Analytics</h2>
          <span className={cn("ea-chip", draft.analyticsEnabled && "ea-chip--active")}>{draft.analyticsEnabled ? "Enabled" : "Disabled"}</span>
        </section>
      ) : null}
      {activeTab === "ai" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">AI Assistant (optional)</h2>
          <p className="text-sm text-text-secondary mb-ds-3">Global: {draft.aiAssistant.globalEnabled ? "ON" : "OFF"} · {draft.aiAssistant.execution}</p>
          <div className="ea-chip-row">
            <span className={cn("ea-chip", draft.aiAssistant.paymentSummaries && "ea-chip--active")}>Summaries</span>
            <span className={cn("ea-chip", draft.aiAssistant.financialReports && "ea-chip--active")}>Reports</span>
            <span className={cn("ea-chip", draft.aiAssistant.fraudIndicators && "ea-chip--active")}>Fraud</span>
            <span className={cn("ea-chip", draft.aiAssistant.revenueInsights && "ea-chip--active")}>Revenue</span>
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
            {snapshot.history.map((entry: PaymentsEngineHistoryEntry) => (
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
        Public payments hub: <Link href="/payments" className="ea-link">/payments</Link>
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
          <div key={item.name} className="pe-list__row">
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
