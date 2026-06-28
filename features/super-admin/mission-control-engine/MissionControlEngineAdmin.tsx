"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EnterpriseEngineAdminShell } from "@/features/super-admin/components/premium/EnterpriseEngineAdminShell";
import { cn } from "@/lib/cn";
import type {
  MissionControlEngineDocument,
  MissionControlEngineHistoryEntry,
  MissionControlEngineSnapshot,
} from "@/lib/mission-control-engine/types";

type MissionControlEngineAdminProps = {
  initialSnapshot: MissionControlEngineSnapshot;
};

type AdminTab = "sections" | "widgets" | "quick-actions" | "monitoring" | "productivity" | "security" | "history";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "sections", label: "Sections" },
  { id: "widgets", label: "Widgets" },
  { id: "quick-actions", label: "Quick Actions" },
  { id: "monitoring", label: "Monitoring" },
  { id: "productivity", label: "Productivity" },
  { id: "security", label: "Security" },
  { id: "history", label: "History" },
];

export function MissionControlEngineAdmin({ initialSnapshot }: MissionControlEngineAdminProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState(initialSnapshot.draft);
  const [activeTab, setActiveTab] = useState<AdminTab>("sections");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = useCallback(
    (action: "save-draft" | "publish" | "rollback" | "reset-draft" | "export", historyId?: string) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/mission-control-engine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, document: draft, historyId }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          draft?: MissionControlEngineDocument;
          snapshot?: MissionControlEngineSnapshot;
          error?: string;
          document?: MissionControlEngineDocument;
        };
        if (!response.ok) {
          setMessage(data.error ?? "Mission Control Engine action failed.");
          return;
        }
        if (data.draft) {
          setDraft(data.draft);
          setSnapshot((current) => ({ ...current, draft: data.draft! }));
        }
        if (data.snapshot) setSnapshot(data.snapshot);
        if (action === "export" && data.document) {
          const blob = new Blob([JSON.stringify(data.document, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const anchor = window.document.createElement("a");
          anchor.href = url;
          anchor.download = `rovexo-mission-control-engine-${Date.now()}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
        }
        setMessage(action === "publish" ? "Mission Control configuration published." : "Draft saved.");
      });
    },
    [draft],
  );

  const toggleSection = (id: string) => {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === id ? { ...section, enabled: !section.enabled } : section,
      ),
    }));
  };

  const toggleQuickAction = (id: string) => {
    setDraft((current) => ({
      ...current,
      quickActions: current.quickActions.map((action) =>
        action.id === id ? { ...action, enabled: !action.enabled } : action,
      ),
    }));
  };

  const toggleWidget = (key: string) => {
    setDraft((current) => ({
      ...current,
      widgets: { ...current.widgets, [key]: !current.widgets[key] },
    }));
  };

  const toggleMonitoring = (key: keyof MissionControlEngineDocument["monitoring"]) => {
    setDraft((current) => ({
      ...current,
      monitoring: { ...current.monitoring, [key]: !current.monitoring[key] },
    }));
  };

  const toggleProductivity = (key: keyof MissionControlEngineDocument["productivity"]) => {
    setDraft((current) => ({
      ...current,
      productivity: { ...current.productivity, [key]: !current.productivity[key] },
    }));
  };

  return (
    <EnterpriseEngineAdminShell
      moduleId="mission-control-engine"
      eyebrow="Mission Control Engine"
      title="Enterprise Command Center Configuration"
      subtitle="Configure sections, widgets, quick actions, and monitoring without modifying marketplace business logic."
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as AdminTab)}
      message={message}
      isPending={isPending}
      actions={
        <>
          <Button disabled={isPending} onClick={() => runAction("save-draft")}>Save Draft</Button>
          <Button disabled={isPending} variant="primary" onClick={() => runAction("publish")}>Publish Live</Button>
          <Button disabled={isPending} variant="secondary" onClick={() => runAction("reset-draft")}>Reset Draft</Button>
          <Button disabled={isPending} variant="secondary" onClick={() => runAction("export")}>Export</Button>
        </>
      }
    >
      <div className="mc2-admin__panel">
        {activeTab === "sections" &&
          snapshot.sections.map((section) => {
            const enabled = draft.sections.find((item) => item.id === section.id)?.enabled ?? true;
            return (
              <label key={section.id} className="mc2-admin__toggle-row">
                <span>
                  {section.icon} {section.label}
                </span>
                <input type="checkbox" checked={enabled} onChange={() => toggleSection(section.id)} />
              </label>
            );
          })}

        {activeTab === "widgets" &&
          Object.entries(draft.widgets).map(([key, enabled]) => (
            <label key={key} className="mc2-admin__toggle-row">
              <span>{key}</span>
              <input type="checkbox" checked={enabled} onChange={() => toggleWidget(key)} />
            </label>
          ))}

        {activeTab === "quick-actions" &&
          draft.quickActions.map((action) => (
            <label key={action.id} className="mc2-admin__toggle-row">
              <span>{action.label}</span>
              <input type="checkbox" checked={action.enabled} onChange={() => toggleQuickAction(action.id)} />
            </label>
          ))}

        {activeTab === "monitoring" &&
          (Object.keys(draft.monitoring) as Array<keyof MissionControlEngineDocument["monitoring"]>).map((key) => (
            <label key={key} className="mc2-admin__toggle-row">
              <span>{key}</span>
              <input type="checkbox" checked={draft.monitoring[key]} onChange={() => toggleMonitoring(key)} />
            </label>
          ))}

        {activeTab === "productivity" &&
          (Object.keys(draft.productivity) as Array<keyof MissionControlEngineDocument["productivity"]>).map(
            (key) => (
              <label key={key} className="mc2-admin__toggle-row">
                <span>{key}</span>
                <input
                  type="checkbox"
                  checked={draft.productivity[key]}
                  onChange={() => toggleProductivity(key)}
                />
              </label>
            ),
          )}

        {activeTab === "security" && (
          <div className="mc2-section__desc">
            Super Admin only · Permission based · Audit protected · Immutable logs · Enterprise authentication
          </div>
        )}

        {activeTab === "history" &&
          snapshot.history.map((entry: MissionControlEngineHistoryEntry) => (
            <div key={entry.id} className="mc2-admin__toggle-row">
              <span>
                {entry.label} · {new Date(entry.publishedAt).toLocaleString()}
              </span>
              {entry.rollbackAvailable ? (
                <Button
                  disabled={isPending}
                  variant="secondary"
                  onClick={() => runAction("rollback", entry.id)}
                >
                  Rollback
                </Button>
              ) : null}
            </div>
          ))}
      </div>
    </EnterpriseEngineAdminShell>
  );
}
