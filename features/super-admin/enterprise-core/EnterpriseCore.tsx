"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ENTERPRISE_CORE_SEARCH_CATEGORIES } from "@/lib/enterprise-core/registry";
import type {
  EnterpriseCoreDocument,
  EnterpriseCoreHistoryEntry,
  EnterpriseCoreSearchResult,
  EnterpriseCoreSnapshot,
} from "@/lib/enterprise-core/types";

type EnterpriseCoreProps = {
  initialSnapshot: EnterpriseCoreSnapshot;
};

type CoreTab =
  | "registry"
  | "search"
  | "settings"
  | "dashboard"
  | "notifications"
  | "audit"
  | "backup"
  | "permissions"
  | "updates"
  | "health"
  | "analytics"
  | "ai"
  | "operations"
  | "developer"
  | "recovery";

const TABS: { id: CoreTab; label: string }[] = [
  { id: "registry", label: "Enterprise Registry" },
  { id: "search", label: "Global Search" },
  { id: "settings", label: "Settings Center" },
  { id: "dashboard", label: "Dashboard" },
  { id: "notifications", label: "Notifications" },
  { id: "audit", label: "Audit Center" },
  { id: "backup", label: "Backup Center" },
  { id: "permissions", label: "Permissions" },
  { id: "updates", label: "Update Center" },
  { id: "health", label: "Marketplace Health" },
  { id: "analytics", label: "Analytics Hub" },
  { id: "ai", label: "AI Assistant" },
  { id: "operations", label: "Operations" },
  { id: "developer", label: "Developer Hub" },
  { id: "recovery", label: "Recovery Center" },
];

export function EnterpriseCore({ initialSnapshot }: EnterpriseCoreProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState(initialSnapshot.draft);
  const [activeTab, setActiveTab] = useState<CoreTab>("dashboard");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = useCallback(
    (action: "save-draft" | "publish" | "rollback" | "reset-draft" | "duplicate" | "export", historyId?: string) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/enterprise-core", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, document: draft, historyId }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          draft?: EnterpriseCoreDocument;
          snapshot?: EnterpriseCoreSnapshot;
          error?: string;
          document?: EnterpriseCoreDocument;
        };
        if (!response.ok) {
          setMessage(data.error ?? "Enterprise Core action failed.");
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
          anchor.download = `rovexo-enterprise-core-${Date.now()}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
        }
        setMessage(action === "publish" ? "Enterprise configuration published." : "Action complete.");
      });
    },
    [draft],
  );

  return (
    <div className="ec-shell">
      <header className="ec-shell__header">
        <div>
          <p className="ec-shell__eyebrow">Enterprise Core</p>
          <p className="mc-manager__hint">
            Unified enterprise operating system. Mission Control monitors · Theme Studio designs · Platform Studio
            configures · App Studio manages · Enterprise Core unifies.
          </p>
          <p className="ec-shell__score">
            Overall platform score: <strong>{snapshot.overallScore}%</strong> · Health:{" "}
            <span className={cn("ec-health-pill", `ec-health-pill--${snapshot.platformHealth}`)}>{snapshot.platformHealth}</span>
          </p>
        </div>
        <div className="mc-dev-tools__actions">
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("reset-draft")}>Reset</Button>
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("duplicate")}>Duplicate</Button>
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("export")}>Export</Button>
          <Button size="sm" disabled={isPending} onClick={() => runAction("save-draft")}>Save Draft</Button>
          <Button size="sm" disabled={isPending} onClick={() => runAction("publish")}>Publish Enterprise</Button>
        </div>
      </header>
      {message ? <p className="mc-manager__message">{message}</p> : null}

      <div className="ec-shell__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn("ec-shell__tab", activeTab === tab.id && "ec-shell__tab--active")}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "registry" ? <RegistryPanel modules={snapshot.registry} /> : null}
      {activeTab === "search" ? <GlobalSearchPanel categories={ENTERPRISE_CORE_SEARCH_CATEGORIES} /> : null}
      {activeTab === "settings" ? <SettingsPanel groups={snapshot.settingsGroups} /> : null}
      {activeTab === "dashboard" ? <DashboardPanel metrics={snapshot.dashboard} /> : null}
      {activeTab === "notifications" ? <NotificationsPanel notifications={draft.notifications} /> : null}
      {activeTab === "audit" ? (
        <AuditPanel auditLog={draft.auditLog} history={snapshot.history} onRollback={(id) => runAction("rollback", id)} isPending={isPending} />
      ) : null}
      {activeTab === "backup" ? <BackupPanel backups={draft.backups} /> : null}
      {activeTab === "permissions" ? <PermissionsPanel roles={draft.roles} /> : null}
      {activeTab === "updates" ? <UpdatesPanel updates={draft.updates} /> : null}
      {activeTab === "health" ? <HealthPanel scores={snapshot.healthScores} overall={snapshot.overallScore} /> : null}
      {activeTab === "analytics" ? <AnalyticsPanel metrics={snapshot.analytics} /> : null}
      {activeTab === "ai" ? <AiPanel assistant={draft.aiAssistant} /> : null}
      {activeTab === "operations" ? <OperationsPanel metrics={snapshot.operations} /> : null}
      {activeTab === "developer" ? <DeveloperPanel tools={snapshot.developerTools} /> : null}
      {activeTab === "recovery" ? (
        <RecoveryPanel
          history={draft.recoveryHistory}
          versionHistory={snapshot.history}
          onRollback={(id) => runAction("rollback", id)}
          isPending={isPending}
        />
      ) : null}
    </div>
  );
}

function RegistryPanel({ modules }: { modules: EnterpriseCoreSnapshot["registry"] }) {
  return (
    <div className="ec-registry-grid">
      {modules.map((module) => (
        <div key={module.id} className="ec-card">
          <div className="ec-card__head">
            <span className="ec-card__icon">{module.icon}</span>
            <div>
              <p className="font-semibold">{module.label}</p>
              <p className="text-xs text-text-muted">v{module.version} · {module.category}</p>
            </div>
            <span className={cn("ec-health-pill", `ec-health-pill--${module.health}`)}>{module.health}</span>
          </div>
          <p className="text-sm text-text-secondary">{module.description}</p>
          {module.autoRegister ? <span className="ec-chip ec-chip--active">Auto-register</span> : null}
          <Link href={module.href} className="ec-link">Open module</Link>
        </div>
      ))}
    </div>
  );
}

function GlobalSearchPanel({ categories }: { categories: readonly string[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EnterpriseCoreSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const trimmedQuery = query.trim();
  const shouldSearch = trimmedQuery.length >= 2;
  const visibleResults = shouldSearch ? results : [];

  useEffect(() => {
    if (!shouldSearch) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/super-admin/enterprise-core?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { results?: EnterpriseCoreSearchResult[] };
        setResults(data.results ?? []);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [shouldSearch, trimmedQuery]);

  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Enterprise Search</h2>
      <p className="mc-section__desc mb-ds-4">Search users, listings, orders, settings, themes, workflows, audit logs, and more.</p>
      <input
        className="ec-search-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search everything…"
      />
      <div className="ec-chip-row mb-ds-4">
        {categories.map((category) => (
          <span key={category} className="ec-chip">{category}</span>
        ))}
      </div>
      {loading ? <p className="text-sm text-text-muted">Searching…</p> : null}
      <div className="ec-list">
        {visibleResults.map((result) => (
          <Link key={`${result.category}-${result.id}`} href={result.href} className="ec-list__row ec-list__row--link">
            <div>
              <p className="font-semibold">{result.title}</p>
              <p className="text-sm text-text-secondary">{result.subtitle}</p>
            </div>
            <span className="ec-chip">{result.category}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SettingsPanel({ groups }: { groups: EnterpriseCoreSnapshot["settingsGroups"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Universal Settings Center</h2>
      <div className="ec-settings-grid">
        {groups.map((group) => (
          <Link key={group.id} href={group.href} className="ec-card ec-card--link">
            <p className="font-semibold">{group.label}</p>
            <p className="text-sm text-text-secondary">{group.module}</p>
            <p className="text-xs text-text-muted">{group.settingKeys.length ? group.settingKeys.join(", ") : "Panel settings"}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DashboardPanel({ metrics }: { metrics: EnterpriseCoreSnapshot["dashboard"] }) {
  return (
    <div className="ec-dashboard-grid">
      {metrics.map((metric) => (
        <div key={metric.id} className="ec-metric-card">
          <p className="text-sm text-text-secondary">{metric.label}</p>
          <p className="ec-metric-card__value">{metric.value}</p>
          {metric.delta !== undefined ? <p className="text-xs text-text-muted">Δ {metric.delta}</p> : null}
          {metric.href ? <Link href={metric.href} className="ec-link">View</Link> : null}
        </div>
      ))}
    </div>
  );
}

function NotificationsPanel({ notifications }: { notifications: EnterpriseCoreSnapshot["draft"]["notifications"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Enterprise Notification Center</h2>
      <div className="ec-list">
        {notifications.map((alert) => (
          <div key={alert.id} className="ec-list__row">
            <div>
              <p className="font-semibold">{alert.title}</p>
              <p className="text-sm text-text-secondary">{alert.message}</p>
              <p className="text-xs text-text-muted">{alert.module} · {new Date(alert.timestamp).toLocaleString()}</p>
            </div>
            <span className={cn("ec-severity-pill", `ec-severity-pill--${alert.severity}`)}>{alert.severity}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuditPanel({
  auditLog,
  history,
  onRollback,
  isPending,
}: {
  auditLog: EnterpriseCoreSnapshot["draft"]["auditLog"];
  history: EnterpriseCoreHistoryEntry[];
  onRollback: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="ec-split-grid">
      <section className="rx-surface-card rounded-ds-xl p-ds-5">
        <h2 className="mc-section__title">Enterprise Audit Center</h2>
        <div className="mc-theme-studio__history">
          {auditLog.length === 0 ? <p className="mc-section__desc">Administrative actions will be logged here.</p> : null}
          {auditLog.map((entry) => (
            <div key={entry.id} className="mc-theme-studio__history-row">
              <div>
                <p className="font-semibold">{entry.module}{entry.component ? ` · ${entry.component}` : ""} · {entry.action}</p>
                <p className="text-sm text-text-secondary">
                  {entry.administrator} · {new Date(entry.timestamp).toLocaleString()}
                  {entry.ipAddress ? ` · ${entry.ipAddress}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/super-admin/audit" className="ec-link mt-ds-4 inline-block">Audit & Compliance Center</Link>
        <Link href="/super-admin/audit/logs" className="ec-link mt-ds-2 inline-block">Full audit logs</Link>
      </section>
      <section className="rx-surface-card rounded-ds-xl p-ds-5">
        <h2 className="mc-section__title">Version history</h2>
        <div className="mc-theme-studio__history">
          {history.map((entry) => (
            <div key={entry.id} className="mc-theme-studio__history-row">
              <div>
                <p className="font-semibold">{entry.label}</p>
                <p className="text-sm text-text-secondary">{new Date(entry.publishedAt).toLocaleString()}</p>
              </div>
              {entry.rollbackAvailable ? (
                <Button size="sm" variant="secondary" disabled={isPending} onClick={() => onRollback(entry.id)}>Rollback</Button>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function BackupPanel({ backups }: { backups: EnterpriseCoreSnapshot["draft"]["backups"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Enterprise Backup Center</h2>
      <div className="ec-list">
        {backups.map((backup) => (
          <div key={backup.id} className="ec-list__row">
            <div>
              <p className="font-semibold">{backup.label}</p>
              <p className="text-sm text-text-secondary">{backup.type} · {new Date(backup.createdAt).toLocaleString()}</p>
            </div>
            <div className="ec-chip-row">
              {backup.scheduled ? <span className="ec-chip ec-chip--active">Scheduled</span> : null}
              {backup.rollbackAvailable ? <span className="ec-chip">Restore</span> : null}
            </div>
          </div>
        ))}
      </div>
      <Link href="/super-admin/recovery" className="ec-link mt-ds-4 inline-block">Open Recovery Center</Link>
    </section>
  );
}

function PermissionsPanel({ roles }: { roles: EnterpriseCoreSnapshot["draft"]["roles"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Enterprise Permission Center</h2>
      <div className="ec-list">
        {roles.map((role) => (
          <div key={role.id} className="ec-list__row">
            <div>
              <p className="font-semibold">{role.name}</p>
              <p className="text-sm text-text-secondary">{role.permissions.join(" · ")}</p>
              <p className="text-xs text-text-muted">Modules: {role.moduleAccess.join(", ")}</p>
            </div>
            <div className="ec-chip-row">
              {role.publishRights ? <span className="ec-chip ec-chip--active">Publish</span> : null}
              {role.recoveryRights ? <span className="ec-chip ec-chip--active">Recovery</span> : null}
              <span className="ec-chip">{role.status}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function UpdatesPanel({ updates }: { updates: EnterpriseCoreSnapshot["draft"]["updates"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Enterprise Update Center</h2>
      <div className="ec-list">
        {updates.map((update) => (
          <div key={update.id} className="ec-list__row">
            <div>
              <p className="font-semibold">{update.name}</p>
              <p className="text-sm text-text-secondary">{update.type} · v{update.version}{update.previousVersion ? ` (was v${update.previousVersion})` : ""}</p>
            </div>
            <div className="ec-chip-row">
              <span className={cn("ec-chip", update.compatible && "ec-chip--active")}>{update.compatible ? "Compatible" : "Check"}</span>
              {update.rollbackAvailable ? <span className="ec-chip">Rollback</span> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HealthPanel({ scores, overall }: { scores: EnterpriseCoreSnapshot["healthScores"]; overall: number }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Marketplace Health Center</h2>
      <p className="ec-overall-score mb-ds-4">Overall platform score: <strong>{overall}%</strong></p>
      <div className="ec-health-grid">
        {scores.map((score) => (
          <div key={score.id} className="ec-health-card">
            <p className="font-semibold">{score.label}</p>
            <p className="ec-metric-card__value">{score.score}%</p>
            <span className={cn("ec-health-pill", `ec-health-pill--${score.status}`)}>{score.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AnalyticsPanel({ metrics }: { metrics: EnterpriseCoreSnapshot["analytics"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Analytics Hub</h2>
      <div className="ec-dashboard-grid">
        {metrics.map((metric) => (
          <div key={metric.id} className="ec-metric-card">
            <p className="text-sm text-text-secondary">{metric.label}</p>
            <p className="ec-metric-card__value">{metric.value}</p>
            {metric.growth !== undefined ? <p className="text-xs text-text-muted">Growth {metric.growth}%</p> : null}
          </div>
        ))}
      </div>
      <Link href="/super-admin/analytics" className="ec-link mt-ds-4 inline-block">Open Analytics</Link>
    </section>
  );
}

function AiPanel({ assistant }: { assistant: EnterpriseCoreSnapshot["draft"]["aiAssistant"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">AI Enterprise Assistant</h2>
      <p className="mc-section__desc mb-ds-4">
        Optional AI support for administrators. Global: {assistant.globalEnabled ? "ON" : "OFF"} · Execution: {assistant.execution}.
        Device AI preferred; cloud only when local execution is not possible.
      </p>
      <div className="ec-list">
        {assistant.capabilities.map((capability) => (
          <div key={capability.id} className="ec-list__row">
            <div>
              <p className="font-semibold">{capability.label}</p>
            </div>
            <div className="ec-chip-row">
              <span className={cn("ec-chip", capability.enabled && "ec-chip--active")}>{capability.enabled ? "On" : "Off"}</span>
              <span className="ec-chip">{capability.execution}</span>
            </div>
          </div>
        ))}
      </div>
      <Link href="/super-admin/ai-manager" className="ec-link mt-ds-4 inline-block">Open AI Manager</Link>
    </section>
  );
}

function OperationsPanel({ metrics }: { metrics: EnterpriseCoreSnapshot["operations"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Enterprise Operations Center</h2>
      <div className="ec-health-grid">
        {metrics.map((metric) => (
          <div key={metric.id} className="ec-health-card">
            <p className="font-semibold">{metric.label}</p>
            <span className={cn("ec-health-pill", `ec-health-pill--${metric.status}`)}>{metric.status}</span>
            {metric.detail ? <p className="text-xs text-text-muted">{metric.detail}</p> : null}
          </div>
        ))}
      </div>
      <Link href="/super-admin/monitoring" className="ec-link mt-ds-4 inline-block">Open Monitoring</Link>
    </section>
  );
}

function DeveloperPanel({ tools }: { tools: EnterpriseCoreSnapshot["developerTools"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Developer Hub</h2>
      <div className="ec-settings-grid">
        {tools.map((tool) => (
          <Link key={tool.id} href={tool.href} className="ec-card ec-card--link">
            <p className="font-semibold">{tool.label}</p>
            <p className="text-sm text-text-secondary">{tool.description}</p>
            <span className={cn("ec-health-pill", `ec-health-pill--${tool.status}`)}>{tool.status}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecoveryPanel({
  history,
  versionHistory,
  onRollback,
  isPending,
}: {
  history: EnterpriseCoreSnapshot["draft"]["recoveryHistory"];
  versionHistory: EnterpriseCoreHistoryEntry[];
  onRollback: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="ec-split-grid">
      <section className="rx-surface-card rounded-ds-xl p-ds-5">
        <h2 className="mc-section__title">Enterprise Recovery Center</h2>
        <div className="ec-list">
          {history.map((entry) => (
            <div key={entry.id} className="ec-list__row">
              <div>
                <p className="font-semibold">{entry.label}</p>
                <p className="text-sm text-text-secondary">{entry.type} · {new Date(entry.createdAt).toLocaleString()}</p>
              </div>
              {entry.validated ? <span className="ec-chip ec-chip--active">Validated</span> : null}
            </div>
          ))}
        </div>
      </section>
      <section className="rx-surface-card rounded-ds-xl p-ds-5">
        <h2 className="mc-section__title">Configuration rollback</h2>
        <div className="mc-theme-studio__history">
          {versionHistory.map((entry) => (
            <div key={entry.id} className="mc-theme-studio__history-row">
              <div>
                <p className="font-semibold">{entry.label}</p>
                <p className="text-sm text-text-secondary">{new Date(entry.publishedAt).toLocaleString()}</p>
              </div>
              {entry.rollbackAvailable ? (
                <Button size="sm" variant="secondary" disabled={isPending} onClick={() => onRollback(entry.id)}>Rollback</Button>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
