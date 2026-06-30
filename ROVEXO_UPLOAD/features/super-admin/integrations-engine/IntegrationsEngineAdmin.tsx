"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EnterpriseEngineAdminShell } from "@/features/super-admin/components/premium/EnterpriseEngineAdminShell";
import { cn } from "@/lib/cn";
import type {
  IntegrationsEngineDocument,
  IntegrationsEngineHistoryEntry,
  IntegrationsEngineSnapshot,
} from "@/lib/integrations-engine/types";

type IntegrationsEngineAdminProps = { initialSnapshot: IntegrationsEngineSnapshot };

type AdminTab =
  | "modules"
  | "payments"
  | "shipping"
  | "maps"
  | "google"
  | "apple"
  | "microsoft"
  | "email"
  | "sms"
  | "push"
  | "storage"
  | "api"
  | "webhooks"
  | "secrets"
  | "performance"
  | "security"
  | "ai"
  | "integrations"
  | "future"
  | "history";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "modules", label: "Modules" },
  { id: "payments", label: "Payments" },
  { id: "shipping", label: "Shipping" },
  { id: "maps", label: "Maps" },
  { id: "google", label: "Google" },
  { id: "apple", label: "Apple" },
  { id: "microsoft", label: "Microsoft" },
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "push", label: "Push" },
  { id: "storage", label: "Storage" },
  { id: "api", label: "API" },
  { id: "webhooks", label: "Webhooks" },
  { id: "secrets", label: "Secrets" },
  { id: "performance", label: "Performance" },
  { id: "security", label: "Security" },
  { id: "ai", label: "AI Assistant" },
  { id: "integrations", label: "Engine Links" },
  { id: "future", label: "Future Ready" },
  { id: "history", label: "History" },
];

export function IntegrationsEngineAdmin({ initialSnapshot }: IntegrationsEngineAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState(initialSnapshot.draft);
  const [activeTab, setActiveTab] = useState<AdminTab>("integrations");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = useCallback(
    (action: "save-draft" | "publish" | "rollback" | "reset-draft" | "export", historyId?: string) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/integrations-engine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, document: draft, historyId }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          draft?: IntegrationsEngineDocument;
          snapshot?: IntegrationsEngineSnapshot;
          error?: string;
          document?: IntegrationsEngineDocument;
        };
        if (!response.ok) {
          setMessage(data.error ?? "Integrations Engine action failed.");
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
          anchor.download = `rovexo-integrations-engine-${Date.now()}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
        }
        setMessage(action === "publish" ? "Integration configuration published." : "Action complete.");
      });
    },
    [draft],
  );

  const flagPanel = (title: string, flags: Record<string, boolean>) => (
    <section className="ea-panel">
      <h2 className="ea-panel__title">{title}</h2>
      <div className="ea-chip-row">
        {Object.entries(flags).map(([key, enabled]) => (
          <span key={key} className={cn("ea-chip", enabled && "ea-chip--active")}>{key}</span>
        ))}
      </div>
    </section>
  );

  return (
    <EnterpriseEngineAdminShell
      moduleId="integrations-engine"
      eyebrow="Integrations Engine"
      subtitle={`Enterprise external services · ${draft.marketplaceVersion} · ${draft.primaryCountry}`}
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
      {activeTab === "modules" ? <ListPanel title="Integration Modules" items={draft.modules.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "payments" ? flagPanel("Payment Providers", draft.paymentProviders) : null}
      {activeTab === "shipping" ? flagPanel("Shipping Providers", draft.shippingProviders) : null}
      {activeTab === "maps" ? flagPanel("Maps & Location", draft.mapsLocation) : null}
      {activeTab === "google" ? flagPanel("Google Services", draft.googleServices) : null}
      {activeTab === "apple" ? flagPanel("Apple Services", draft.appleServices) : null}
      {activeTab === "microsoft" ? flagPanel("Microsoft Services", draft.microsoftServices) : null}
      {activeTab === "email" ? flagPanel("Email Services", draft.emailServices) : null}
      {activeTab === "sms" ? flagPanel("SMS Services", draft.smsServices) : null}
      {activeTab === "push" ? flagPanel("Push Notifications", draft.pushNotifications) : null}
      {activeTab === "storage" ? flagPanel("File Storage", draft.fileStorage) : null}
      {activeTab === "api" ? flagPanel("API Management", draft.apiManagement) : null}
      {activeTab === "webhooks" ? flagPanel("Webhooks", draft.webhooks) : null}
      {activeTab === "secrets" ? flagPanel("Secrets Management", draft.secretsManagement) : null}
      {activeTab === "performance" ? flagPanel("Performance", draft.performance) : null}
      {activeTab === "security" ? flagPanel("Integration Security", draft.security) : null}
      {activeTab === "ai" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">AI Assistant (optional)</h2>
          <p className="text-sm text-text-secondary mb-ds-3">Global: {draft.aiAssistant.globalEnabled ? "ON" : "OFF"}</p>
          <div className="ea-chip-row">
            <span className={cn("ea-chip", draft.aiAssistant.healthAnalysis && "ea-chip--active")}>Health</span>
            <span className={cn("ea-chip", draft.aiAssistant.failureDetection && "ea-chip--active")}>Failures</span>
            <span className={cn("ea-chip", draft.aiAssistant.automaticDiagnostics && "ea-chip--active")}>Diagnostics</span>
          </div>
        </section>
      ) : null}
      {activeTab === "integrations" ? flagPanel("Platform Engine Links", draft.integrations) : null}
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
            {snapshot.history.map((entry: IntegrationsEngineHistoryEntry) => (
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
        Public hub: <Link href="/integrations" className="ea-link">/integrations</Link> · Monitoring: <Link href="/super-admin/monitoring" className="ea-link">/super-admin/monitoring</Link>
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
          <div key={`${item.name}-${item.meta}`} className="integ-list__row">
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
