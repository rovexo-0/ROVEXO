"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EnterpriseEngineAdminShell } from "@/features/super-admin/components/premium/EnterpriseEngineAdminShell";
import { cn } from "@/lib/cn";
import type {
  NotificationsEngineDocument,
  NotificationsEngineHistoryEntry,
  NotificationsEngineSnapshot,
} from "@/lib/notifications-engine/types";

type NotificationsEngineAdminProps = { initialSnapshot: NotificationsEngineSnapshot };

type AdminTab =
  | "types"
  | "channels"
  | "events"
  | "templates"
  | "badges"
  | "preferences"
  | "admin-alerts"
  | "integrations"
  | "ai"
  | "future"
  | "history";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "types", label: "Types" },
  { id: "channels", label: "Channels" },
  { id: "events", label: "Events" },
  { id: "templates", label: "Templates" },
  { id: "badges", label: "Badges" },
  { id: "preferences", label: "Preferences" },
  { id: "admin-alerts", label: "Admin Alerts" },
  { id: "integrations", label: "Integrations" },
  { id: "ai", label: "AI Assistant" },
  { id: "future", label: "Future Ready" },
  { id: "history", label: "History" },
];

export function NotificationsEngineAdmin({ initialSnapshot }: NotificationsEngineAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState(initialSnapshot.draft);
  const [activeTab, setActiveTab] = useState<AdminTab>("integrations");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = useCallback(
    (action: "save-draft" | "publish" | "rollback" | "reset-draft" | "export", historyId?: string) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/notifications-engine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, document: draft, historyId }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          draft?: NotificationsEngineDocument;
          snapshot?: NotificationsEngineSnapshot;
          error?: string;
          document?: NotificationsEngineDocument;
        };
        if (!response.ok) {
          setMessage(data.error ?? "Notifications Engine action failed.");
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
          anchor.download = `rovexo-notifications-engine-${Date.now()}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
        }
        setMessage(action === "publish" ? "Notifications configuration published." : "Action complete.");
      });
    },
    [draft],
  );

  return (
    <EnterpriseEngineAdminShell
      moduleId="notifications-engine"
      eyebrow="Notifications Engine"
      subtitle={`Enterprise real-time notification system · ${draft.marketplaceVersion} · ${draft.primaryCountry}`}
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
      {activeTab === "types" ? <ListPanel title="Notification Types" items={draft.notificationTypes.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "channels" ? <ListPanel title="Delivery Channels" items={draft.channels.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "events" ? <ListPanel title="Platform Events" items={draft.events.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "templates" ? <ListPanel title="Notification Templates" items={draft.templates.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "badges" ? (
        <ListPanel
          title="Live Badge Surfaces"
          items={draft.badgeSurfaces.map((t) => ({ name: t.label, meta: t.color, enabled: t.enabled }))}
        />
      ) : null}
      {activeTab === "preferences" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">User Preferences</h2>
          <div className="ea-chip-row">
            {Object.entries(draft.userPreferences).map(([key, enabled]) => (
              <span key={key} className={cn("ea-chip", enabled && "ea-chip--active")}>{key}</span>
            ))}
          </div>
        </section>
      ) : null}
      {activeTab === "admin-alerts" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">Super Admin Alerts</h2>
          <div className="ea-chip-row">
            {Object.entries(draft.adminAlerts).map(([key, enabled]) => (
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
            <span className={cn("ea-chip", draft.aiAssistant.prioritization && "ea-chip--active")}>Prioritization</span>
            <span className={cn("ea-chip", draft.aiAssistant.smartRouting && "ea-chip--active")}>Routing</span>
            <span className={cn("ea-chip", draft.aiAssistant.summaries && "ea-chip--active")}>Summaries</span>
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
            {snapshot.history.map((entry: NotificationsEngineHistoryEntry) => (
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
        Public notification center: <Link href="/notifications" className="ea-link">/notifications</Link> · Broadcast: <Link href="/super-admin/notifications" className="ea-link">/super-admin/notifications</Link>
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
          <div key={`${item.name}-${item.meta}`} className="ne-list__row">
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
