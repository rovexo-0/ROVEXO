"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EnterpriseEngineAdminShell } from "@/features/super-admin/components/premium/EnterpriseEngineAdminShell";
import { cn } from "@/lib/cn";
import type {
  AiEngineDocument,
  AiEngineHistoryEntry,
  AiEngineSnapshot,
} from "@/lib/ai-engine/types";

type AiEngineAdminProps = { initialSnapshot: AiEngineSnapshot };

type AdminTab =
  | "modules"
  | "marketplace"
  | "image"
  | "language"
  | "buyer"
  | "seller"
  | "business"
  | "support"
  | "moderation"
  | "analytics"
  | "automation"
  | "providers"
  | "permissions"
  | "performance"
  | "security"
  | "execution"
  | "integrations"
  | "future"
  | "history";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "modules", label: "Modules" },
  { id: "marketplace", label: "Marketplace AI" },
  { id: "image", label: "Image AI" },
  { id: "language", label: "Language AI" },
  { id: "buyer", label: "Buyer AI" },
  { id: "seller", label: "Seller AI" },
  { id: "business", label: "Business AI" },
  { id: "support", label: "Support AI" },
  { id: "moderation", label: "Moderation AI" },
  { id: "analytics", label: "Analytics AI" },
  { id: "automation", label: "Automation" },
  { id: "providers", label: "Providers" },
  { id: "permissions", label: "Permissions" },
  { id: "performance", label: "Performance" },
  { id: "security", label: "Security" },
  { id: "execution", label: "Execution Policy" },
  { id: "integrations", label: "Integrations" },
  { id: "future", label: "Future Ready" },
  { id: "history", label: "History" },
];

export function AiEngineAdmin({ initialSnapshot }: AiEngineAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState(initialSnapshot.draft);
  const [activeTab, setActiveTab] = useState<AdminTab>("integrations");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = useCallback(
    (action: "save-draft" | "publish" | "rollback" | "reset-draft" | "export", historyId?: string) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/ai-engine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, document: draft, historyId }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          draft?: AiEngineDocument;
          snapshot?: AiEngineSnapshot;
          error?: string;
          document?: AiEngineDocument;
        };
        if (!response.ok) {
          setMessage(data.error ?? "AI Engine action failed.");
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
          anchor.download = `rovexo-ai-engine-${Date.now()}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
        }
        setMessage(action === "publish" ? "AI configuration published." : "Action complete.");
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
      moduleId="ai-engine"
      eyebrow="AI Engine"
      subtitle={`Enterprise AI orchestration · ${draft.marketplaceVersion} · Global: ${draft.globalEnabled ? "ON" : "OFF"}`}
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
      {activeTab === "modules" ? <ListPanel title="AI Modules" items={draft.modules.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "marketplace" ? flagPanel("Marketplace AI", draft.marketplaceAi) : null}
      {activeTab === "image" ? flagPanel("Image AI", draft.imageAi) : null}
      {activeTab === "language" ? flagPanel("Language AI", draft.languageAi) : null}
      {activeTab === "buyer" ? flagPanel("Buyer AI", draft.buyerAi) : null}
      {activeTab === "seller" ? flagPanel("Seller AI", draft.sellerAi) : null}
      {activeTab === "business" ? flagPanel("Business AI", draft.businessAi) : null}
      {activeTab === "support" ? flagPanel("Support AI", draft.supportAi) : null}
      {activeTab === "moderation" ? flagPanel("Moderation AI", draft.moderationAi) : null}
      {activeTab === "analytics" ? flagPanel("Analytics AI", draft.analyticsAi) : null}
      {activeTab === "automation" ? flagPanel("Automation", draft.automation) : null}
      {activeTab === "providers" ? <ListPanel title="AI Providers" items={draft.providers.map((t) => ({ name: t.label, meta: t.execution, enabled: t.enabled }))} /> : null}
      {activeTab === "permissions" ? <ListPanel title="AI Permissions" items={draft.permissions.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "performance" ? flagPanel("Performance", draft.performance) : null}
      {activeTab === "security" ? flagPanel("AI Security", draft.security) : null}
      {activeTab === "execution" ? flagPanel("Execution Policy", draft.executionPolicy) : null}
      {activeTab === "integrations" ? flagPanel("Platform Integrations", draft.integrations) : null}
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
            {snapshot.history.map((entry: AiEngineHistoryEntry) => (
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
        Public AI hub: <Link href="/ai" className="ea-link">/ai</Link> · AI Manager: <Link href="/super-admin/ai-manager" className="ea-link">/super-admin/ai-manager</Link> · Operations: <Link href="/super-admin/operations" className="ea-link">/super-admin/operations</Link>
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
          <div key={`${item.name}-${item.meta}`} className="aie-list__row">
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
