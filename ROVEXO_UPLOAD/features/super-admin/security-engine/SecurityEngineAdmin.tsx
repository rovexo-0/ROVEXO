"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EnterpriseEngineAdminShell } from "@/features/super-admin/components/premium/EnterpriseEngineAdminShell";
import { cn } from "@/lib/cn";
import type {
  SecurityEngineDocument,
  SecurityEngineHistoryEntry,
  SecurityEngineSnapshot,
} from "@/lib/security-engine/types";

type SecurityEngineAdminProps = { initialSnapshot: SecurityEngineSnapshot };

type AdminTab =
  | "modules"
  | "auth"
  | "roles"
  | "platform"
  | "api"
  | "fraud"
  | "compliance"
  | "sessions"
  | "integrations"
  | "ai"
  | "future"
  | "history";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "modules", label: "Modules" },
  { id: "auth", label: "Authentication" },
  { id: "roles", label: "Roles" },
  { id: "platform", label: "Platform Security" },
  { id: "api", label: "API Security" },
  { id: "fraud", label: "Fraud Detection" },
  { id: "compliance", label: "Compliance" },
  { id: "sessions", label: "Session Policy" },
  { id: "integrations", label: "Integrations" },
  { id: "ai", label: "AI Assistant" },
  { id: "future", label: "Future Ready" },
  { id: "history", label: "History" },
];

export function SecurityEngineAdmin({ initialSnapshot }: SecurityEngineAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState(initialSnapshot.draft);
  const [activeTab, setActiveTab] = useState<AdminTab>("integrations");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = useCallback(
    (action: "save-draft" | "publish" | "rollback" | "reset-draft" | "export", historyId?: string) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/security-engine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, document: draft, historyId }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          draft?: SecurityEngineDocument;
          snapshot?: SecurityEngineSnapshot;
          error?: string;
          document?: SecurityEngineDocument;
        };
        if (!response.ok) {
          setMessage(data.error ?? "Security Engine action failed.");
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
          anchor.download = `rovexo-security-engine-${Date.now()}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
        }
        setMessage(action === "publish" ? "Security configuration published." : "Action complete.");
      });
    },
    [draft],
  );

  return (
    <EnterpriseEngineAdminShell
      moduleId="security-engine"
      eyebrow="Security Engine"
      subtitle={`Enterprise security & compliance · ${draft.marketplaceVersion} · ${draft.primaryCountry}`}
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
      {activeTab === "modules" ? <ListPanel title="Security Modules" items={draft.modules.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "auth" ? <ListPanel title="Authentication Methods" items={draft.authMethods.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "roles" ? <ListPanel title="User Roles" items={draft.roles.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "platform" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">Platform Security</h2>
          <div className="ea-chip-row">
            {Object.entries(draft.platformSecurity).map(([key, enabled]) => (
              <span key={key} className={cn("ea-chip", enabled && "ea-chip--active")}>{key}</span>
            ))}
          </div>
        </section>
      ) : null}
      {activeTab === "api" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">API Security</h2>
          <div className="ea-chip-row">
            {Object.entries(draft.apiSecurity).map(([key, enabled]) => (
              <span key={key} className={cn("ea-chip", enabled && "ea-chip--active")}>{key}</span>
            ))}
          </div>
        </section>
      ) : null}
      {activeTab === "fraud" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">Fraud Detection</h2>
          <div className="ea-chip-row">
            {Object.entries(draft.fraudDetection).map(([key, enabled]) => (
              <span key={key} className={cn("ea-chip", enabled && "ea-chip--active")}>{key}</span>
            ))}
          </div>
        </section>
      ) : null}
      {activeTab === "compliance" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">Compliance</h2>
          <div className="ea-chip-row">
            {Object.entries(draft.compliance).map(([key, enabled]) => (
              <span key={key} className={cn("ea-chip", enabled && "ea-chip--active")}>{key}</span>
            ))}
          </div>
        </section>
      ) : null}
      {activeTab === "sessions" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">Session Policy</h2>
          <div className="sec-stats-grid">
            <div className="ea-chip"><p className="text-xs">Idle timeout</p><p className="font-semibold">{draft.sessionPolicy.idleTimeoutMinutes}m</p></div>
            <div className="ea-chip"><p className="text-xs">Expiration</p><p className="font-semibold">{draft.sessionPolicy.sessionExpirationHours}h</p></div>
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
            <span className={cn("ea-chip", draft.aiAssistant.threatDetection && "ea-chip--active")}>Threat</span>
            <span className={cn("ea-chip", draft.aiAssistant.fraudDetection && "ea-chip--active")}>Fraud</span>
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
            {snapshot.history.map((entry: SecurityEngineHistoryEntry) => (
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
        Public security hub: <Link href="/security" className="ea-link">/security</Link> · Security center: <Link href="/super-admin/security" className="ea-link">/super-admin/security</Link>
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
          <div key={`${item.name}-${item.meta}`} className="sec-list__row">
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
