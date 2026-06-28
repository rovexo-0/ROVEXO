"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EnterpriseEngineAdminShell } from "@/features/super-admin/components/premium/EnterpriseEngineAdminShell";
import { cn } from "@/lib/cn";
import type { MessagesEngineDocument, MessagesEngineHistoryEntry, MessagesEngineSnapshot } from "@/lib/messages-engine/types";

type MessagesEngineAdminProps = { initialSnapshot: MessagesEngineSnapshot };

type AdminTab =
  | "types"
  | "messages"
  | "statuses"
  | "attachments"
  | "search"
  | "moderation"
  | "integrations"
  | "notifications"
  | "ai"
  | "future"
  | "history";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "types", label: "Conversation Types" },
  { id: "messages", label: "Message Types" },
  { id: "statuses", label: "Statuses" },
  { id: "attachments", label: "Attachments" },
  { id: "search", label: "Search" },
  { id: "moderation", label: "Moderation" },
  { id: "integrations", label: "Integrations" },
  { id: "notifications", label: "Notifications" },
  { id: "ai", label: "AI Assistant" },
  { id: "future", label: "Future Ready" },
  { id: "history", label: "History" },
];

export function MessagesEngineAdmin({ initialSnapshot }: MessagesEngineAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState(initialSnapshot.draft);
  const [activeTab, setActiveTab] = useState<AdminTab>("integrations");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = useCallback(
    (action: "save-draft" | "publish" | "rollback" | "reset-draft" | "export", historyId?: string) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/messages-engine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, document: draft, historyId }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          draft?: MessagesEngineDocument;
          snapshot?: MessagesEngineSnapshot;
          error?: string;
          document?: MessagesEngineDocument;
        };
        if (!response.ok) {
          setMessage(data.error ?? "Messages Engine action failed.");
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
          anchor.download = `rovexo-messages-engine-${Date.now()}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
        }
        setMessage(action === "publish" ? "Messages configuration published." : "Action complete.");
      });
    },
    [draft],
  );

  return (
    <EnterpriseEngineAdminShell
      moduleId="messages-engine"
      eyebrow="Messages Engine"
      subtitle={`Enterprise communication system · ${draft.marketplaceVersion} · ${draft.primaryCountry}`}
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
      {activeTab === "types" ? <ListPanel title="Conversation Types" items={draft.conversationTypes.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "messages" ? <ListPanel title="Message Types" items={draft.messageTypes.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "statuses" ? (
        <>
          <ListPanel title="Conversation Status" items={draft.conversationStatuses.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} />
          <ListPanel title="Message Status" items={draft.messageStatuses.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} />
        </>
      ) : null}
      {activeTab === "attachments" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">Attachment Limits</h2>
          <div className="me-stats-grid">
            <div className="ea-chip"><p className="text-xs">Images</p><p className="font-semibold">{draft.attachments.maxImageMb} MB</p></div>
            <div className="ea-chip"><p className="text-xs">Videos</p><p className="font-semibold">{draft.attachments.maxVideoMb} MB</p></div>
            <div className="ea-chip"><p className="text-xs">Documents</p><p className="font-semibold">{draft.attachments.maxDocumentMb} MB</p></div>
          </div>
        </section>
      ) : null}
      {activeTab === "search" ? <ListPanel title="Search Scopes" items={draft.searchScopes.map((t) => ({ name: t.label, meta: t.id, enabled: t.enabled }))} /> : null}
      {activeTab === "moderation" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">Moderation</h2>
          <div className="ea-chip-row">
            {Object.entries(draft.moderation).map(([key, enabled]) => (
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
        <ListPanel title="Notification Channels" items={draft.notifications.map((n) => ({ name: n.event, meta: n.channel, enabled: n.enabled }))} />
      ) : null}
      {activeTab === "ai" ? (
        <section className="ea-panel">
          <h2 className="ea-panel__title">AI Assistant (optional)</h2>
          <p className="text-sm text-text-secondary mb-ds-3">Global: {draft.aiAssistant.globalEnabled ? "ON" : "OFF"} · {draft.aiAssistant.execution}</p>
          <div className="ea-chip-row">
            <span className={cn("ea-chip", draft.aiAssistant.conversationSummaries && "ea-chip--active")}>Summaries</span>
            <span className={cn("ea-chip", draft.aiAssistant.suggestedReplies && "ea-chip--active")}>Replies</span>
            <span className={cn("ea-chip", draft.aiAssistant.spamDetection && "ea-chip--active")}>Spam</span>
            <span className={cn("ea-chip", draft.aiAssistant.automaticTranslation && "ea-chip--active")}>Translation</span>
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
            {snapshot.history.map((entry: MessagesEngineHistoryEntry) => (
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
        Public messages hub: <Link href="/messages" className="ea-link">/messages</Link> · Moderation: <Link href="/super-admin/moderation" className="ea-link">/super-admin/moderation</Link>
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
          <div key={`${item.name}-${item.meta}`} className="me-list__row">
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
