"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AppStudioSimulator } from "@/features/super-admin/app-studio/AppStudioSimulator";
import { cn } from "@/lib/cn";
import { APP_STUDIO_NAV_SECTIONS } from "@/lib/app-studio/registry";
import type {
  AppStudioDocument,
  AppStudioHistoryEntry,
  AppStudioPlatformModule,
  AppStudioSnapshot,
} from "@/lib/app-studio/types";

type AppStudioProps = {
  initialSnapshot: AppStudioSnapshot;
};

type StudioTab =
  | "overview"
  | "modules"
  | "pages"
  | "navigation"
  | "features"
  | "ai"
  | "automations"
  | "security"
  | "plugins"
  | "analytics"
  | "simulator"
  | "recovery"
  | "notifications"
  | "health"
  | "audit";

const TABS: { id: StudioTab; label: string }[] = [
  { id: "overview", label: "Platform Overview" },
  { id: "modules", label: "Module Builder" },
  { id: "pages", label: "Page Builder" },
  { id: "navigation", label: "Navigation" },
  { id: "features", label: "Features" },
  { id: "ai", label: "AI Control" },
  { id: "automations", label: "Automations" },
  { id: "security", label: "Security" },
  { id: "plugins", label: "Plugins" },
  { id: "analytics", label: "Analytics" },
  { id: "simulator", label: "Live Simulator" },
  { id: "recovery", label: "Recovery" },
  { id: "notifications", label: "Notifications" },
  { id: "health", label: "System Health" },
  { id: "audit", label: "Audit Center" },
];

export function AppStudio({ initialSnapshot }: AppStudioProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState(initialSnapshot.draft);
  const [activeTab, setActiveTab] = useState<StudioTab>("overview");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = useCallback(
    (action: "save-draft" | "publish" | "rollback" | "reset-draft" | "duplicate" | "export", historyId?: string) => {
      startTransition(async () => {
        setMessage(null);
        const response = await fetch("/api/super-admin/app-studio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, document: draft, historyId }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          draft?: AppStudioDocument;
          snapshot?: AppStudioSnapshot;
          error?: string;
          document?: AppStudioDocument;
        };
        if (!response.ok) {
          setMessage(data.error ?? "App Studio action failed.");
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
          anchor.download = `rovexo-app-studio-${Date.now()}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
        }
        setMessage(action === "publish" ? "Enterprise configuration published." : "Action complete.");
      });
    },
    [draft],
  );

  return (
    <div className="as-shell">
      <header className="as-shell__header">
        <div>
          <p className="as-shell__eyebrow">App Studio</p>
          <p className="mc-manager__hint">
            Enterprise operating system for the ROVEXO ecosystem. Mission Control monitors · Theme Studio designs ·
            Platform Studio configures · App Studio manages.
          </p>
        </div>
        <div className="mc-dev-tools__actions">
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("reset-draft")}>
            Reset
          </Button>
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("duplicate")}>
            Duplicate
          </Button>
          <Button size="sm" variant="secondary" disabled={isPending} onClick={() => runAction("export")}>
            Export
          </Button>
          <Button size="sm" disabled={isPending} onClick={() => runAction("save-draft")}>
            Save Draft
          </Button>
          <Button size="sm" disabled={isPending} onClick={() => runAction("publish")}>
            Publish Platform
          </Button>
        </div>
      </header>
      {message ? <p className="mc-manager__message">{message}</p> : null}

      <div className="as-shell__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn("as-shell__tab", activeTab === tab.id && "as-shell__tab--active")}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? <OverviewGrid modules={snapshot.modules} /> : null}
      {activeTab === "modules" ? <ModuleBuilderPanel modules={draft.customModules} /> : null}
      {activeTab === "pages" ? <PageBuilderPanel pages={draft.pages} /> : null}
      {activeTab === "navigation" ? <NavigationPanel navigation={draft.navigation} /> : null}
      {activeTab === "features" ? <FeaturePanel features={snapshot.integrations.features} /> : null}
      {activeTab === "ai" ? <AiPanel ai={snapshot.integrations.ai} /> : null}
      {activeTab === "automations" ? <AutomationPanel automations={draft.automations} /> : null}
      {activeTab === "security" ? <SecurityPanel security={draft.security} /> : null}
      {activeTab === "plugins" ? <PluginPanel plugins={draft.plugins} /> : null}
      {activeTab === "analytics" ? <AnalyticsPanel metrics={snapshot.analytics} /> : null}
      {activeTab === "simulator" ? <AppStudioSimulator src="/" title="Platform preview before publish" /> : null}
      {activeTab === "recovery" ? <RecoveryPanel points={draft.recoveryPoints} history={snapshot.history} onRollback={(id) => runAction("rollback", id)} isPending={isPending} /> : null}
      {activeTab === "notifications" ? <NotificationPanel alerts={draft.notificationAlerts} /> : null}
      {activeTab === "health" ? <HealthPanel metrics={snapshot.systemHealth} /> : null}
      {activeTab === "audit" ? <AuditPanel auditLog={draft.auditLog} history={snapshot.history} onRollback={(id) => runAction("rollback", id)} isPending={isPending} /> : null}
    </div>
  );
}

function OverviewGrid({ modules }: { modules: AppStudioPlatformModule[] }) {
  return (
    <div className="as-overview-grid">
      {modules.map((module) => (
        <div key={module.id} className="as-overview-card">
          <div className="as-overview-card__head">
            <span className="as-overview-card__icon">{module.icon}</span>
            <div>
              <p className="as-overview-card__title">{module.label}</p>
              <p className="as-overview-card__meta">v{module.version} · {module.status}</p>
            </div>
            <span className={cn("as-health-pill", `as-health-pill--${module.health}`)}>{module.health}</span>
          </div>
          <p className="as-overview-card__perf">Performance {module.performanceScore}%</p>
          <p className="as-overview-card__deps">Dependencies: {module.dependencies.join(", ") || "None"}</p>
          <div className="as-overview-card__perms">
            {module.permissions.map((perm) => (
              <span key={perm} className="as-chip">
                {perm}
              </span>
            ))}
          </div>
          {module.href ? (
            <Link href={module.href} className="as-overview-card__link">
              Open module
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ModuleBuilderPanel({ modules }: { modules: AppStudioSnapshot["draft"]["customModules"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Module Builder</h2>
      <div className="as-list">
        {modules.map((module) => (
          <div key={module.id} className="as-list__row">
            <div>
              <p className="font-semibold">
                {module.icon} {module.name}
              </p>
              <p className="text-sm text-text-secondary">{module.description ?? module.route}</p>
              <p className="text-xs text-text-muted">
                {module.visibility} · v{module.version} · {module.status}
              </p>
            </div>
            <div className="as-chip-row">
              {module.navigation ? <span className="as-chip as-chip--active">Nav</span> : null}
              {module.analytics ? <span className="as-chip as-chip--active">Analytics</span> : null}
              {module.aiIntegration ? <span className="as-chip as-chip--active">AI</span> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PageBuilderPanel({ pages }: { pages: AppStudioSnapshot["draft"]["pages"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Page Builder</h2>
      <div className="as-card-grid">
        {pages.map((page) => (
          <div key={page.id} className="as-card">
            <p className="font-semibold">{page.name}</p>
            <p className="text-sm text-text-secondary">{page.pageType}</p>
            <p className="text-xs text-text-muted">{page.route ?? "No route"}</p>
            <span className={cn("mc-builder__pill", page.status === "published" ? "mc-builder__pill--live" : "mc-builder__pill--draft")}>
              {page.status}
            </span>
          </div>
        ))}
      </div>
      <p className="mc-section__desc mt-ds-4">
        Preview pages in the Live Simulator tab before publishing. Theme and homepage pages are managed in Theme Studio and Homepage Builder.
      </p>
    </section>
  );
}

function NavigationPanel({ navigation }: { navigation: AppStudioSnapshot["draft"]["navigation"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Navigation Builder</h2>
      <p className="mc-section__desc mb-ds-4">
        Drag-and-drop navigation for all platform menus. Live menus sync via{" "}
        <Link href="/super-admin/menu-builder" className="text-primary font-semibold">
          Menu Builder
        </Link>
        .
      </p>
      <div className="as-nav-grid">
        {APP_STUDIO_NAV_SECTIONS.map((sectionKey) => {
          const section = navigation[sectionKey];
          return (
            <div key={sectionKey} className="as-card">
              <p className="font-semibold">{section.label}</p>
              <p className="text-xs text-text-muted mb-ds-2">{section.items.length} items</p>
              {section.items.slice(0, 4).map((item) => (
                <p key={item.id} className="text-sm text-text-secondary">
                  {item.icon ? `${item.icon} ` : ""}
                  {item.label}
                  {item.badge ? ` (${item.badge})` : ""}
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FeaturePanel({ features }: { features: AppStudioSnapshot["integrations"]["features"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Feature Manager</h2>
      <p className="mc-section__desc mb-ds-4">
        Enable, disable, beta, coming soon, maintenance, and archive features. Managed via{" "}
        <Link href="/super-admin/features" className="text-primary font-semibold">
          Feature Manager
        </Link>
        .
      </p>
      <div className="as-list">
        {features.map((feature) => (
          <div key={feature.id} className="as-list__row">
            <div>
              <p className="font-semibold">{feature.label}</p>
              <p className="text-sm text-text-secondary">{feature.description}</p>
            </div>
            <div className="as-chip-row">
              <span className={cn("as-chip", feature.enabled && "as-chip--active")}>{feature.enabled ? "Enabled" : "Disabled"}</span>
              <span className="as-chip">{feature.state}</span>
              {feature.version ? <span className="as-chip">v{feature.version}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AiPanel({ ai }: { ai: AppStudioSnapshot["integrations"]["ai"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">AI Control Center</h2>
      <p className="mc-section__desc mb-ds-4">
        Global AI is {ai.globalEnabled ? "ON" : "OFF"}. Device AI preferred; cloud only when local execution is not possible. Managed via{" "}
        <Link href="/super-admin/ai-manager" className="text-primary font-semibold">
          AI Manager
        </Link>
        .
      </p>
      <div className="as-list">
        {ai.features.map((feature) => (
          <div key={feature.id} className="as-list__row">
            <div>
              <p className="font-semibold">{feature.label}</p>
              <p className="text-sm text-text-secondary">{feature.description}</p>
            </div>
            <div className="as-chip-row">
              <span className={cn("as-chip", feature.enabled && "as-chip--active")}>{feature.enabled ? "On" : "Off"}</span>
              <span className="as-chip">{feature.execution}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AutomationPanel({ automations }: { automations: AppStudioSnapshot["draft"]["automations"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Automation Center</h2>
      <div className="as-list">
        {automations.map((automation) => (
          <div key={automation.id} className="as-list__row">
            <div>
              <p className="font-semibold">{automation.name}</p>
              <p className="text-sm text-text-secondary">
                {automation.trigger.label} · {automation.actions.length} actions
                {automation.schedule ? ` · ${automation.schedule}` : ""}
              </p>
            </div>
            <div className="as-chip-row">
              <span className="as-chip">{automation.moduleId}</span>
              {automation.aiEnabled ? <span className="as-chip as-chip--active">AI</span> : null}
              <span className={cn("mc-builder__pill", automation.status === "published" ? "mc-builder__pill--live" : "mc-builder__pill--draft")}>
                {automation.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SecurityPanel({ security }: { security: AppStudioSnapshot["draft"]["security"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Security Center</h2>
      <div className="as-chip-row mb-ds-4">
        <span className={cn("as-chip", security.globalTwoFactor && "as-chip--active")}>2FA Global</span>
        <span className={cn("as-chip", security.emergencyLockdown && "as-chip--warn")}>Emergency Lockdown</span>
        <span className={cn("as-chip", security.suspiciousActivityDetection && "as-chip--active")}>Suspicious Activity</span>
        <span className={cn("as-chip", security.apiKeysEnabled && "as-chip--active")}>API Keys</span>
      </div>
      <div className="as-list">
        {security.roles.map((role) => (
          <div key={role.id} className="as-list__row">
            <div>
              <p className="font-semibold">{role.name}</p>
              <p className="text-sm text-text-secondary">{role.permissions.join(" · ")}</p>
            </div>
            {role.twoFactorRequired ? <span className="as-chip as-chip--active">2FA Required</span> : null}
          </div>
        ))}
      </div>
      <Link href="/super-admin/security" className="as-overview-card__link mt-ds-4 inline-block">
        Open Security Centre
      </Link>
    </section>
  );
}

function PluginPanel({ plugins }: { plugins: AppStudioSnapshot["draft"]["plugins"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Plugin Manager</h2>
      <div className="as-list">
        {plugins.map((plugin) => (
          <div key={plugin.id} className="as-list__row">
            <div>
              <p className="font-semibold">{plugin.name}</p>
              <p className="text-sm text-text-secondary">
                {plugin.type} · v{plugin.version} · {plugin.compatibility}
              </p>
              <p className="text-xs text-text-muted">Dependencies: {plugin.dependencies.join(", ") || "None"}</p>
            </div>
            <span className={cn("as-chip", plugin.enabled && "as-chip--active")}>{plugin.enabled ? "Enabled" : "Disabled"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AnalyticsPanel({ metrics }: { metrics: AppStudioSnapshot["analytics"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Analytics Center</h2>
      <div className="as-analytics-grid">
        {metrics.map((metric) => (
          <div key={metric.id} className="as-analytics-card">
            <p className="text-sm text-text-secondary">{metric.label}</p>
            <p className="as-analytics-card__value">{metric.value}</p>
            {metric.delta !== undefined ? <p className="text-xs text-text-muted">Δ {metric.delta}</p> : null}
            {metric.href ? (
              <Link href={metric.href} className="as-overview-card__link">
                View
              </Link>
            ) : null}
          </div>
        ))}
      </div>
      <Link href="/super-admin/analytics" className="as-overview-card__link mt-ds-4 inline-block">
        Open Analytics
      </Link>
    </section>
  );
}

function RecoveryPanel({
  points,
  history,
  onRollback,
  isPending,
}: {
  points: AppStudioSnapshot["draft"]["recoveryPoints"];
  history: AppStudioHistoryEntry[];
  onRollback: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="as-split-grid">
      <section className="rx-surface-card rounded-ds-xl p-ds-5">
        <h2 className="mc-section__title">Recovery Center</h2>
        <div className="as-list">
          {points.map((point) => (
            <div key={point.id} className="as-list__row">
              <div>
                <p className="font-semibold">{point.label}</p>
                <p className="text-sm text-text-secondary">{point.type} · {new Date(point.createdAt).toLocaleString()}</p>
              </div>
              {point.rollbackAvailable ? <span className="as-chip as-chip--active">Rollback available</span> : null}
            </div>
          ))}
        </div>
        <Link href="/super-admin/recovery" className="as-overview-card__link mt-ds-4 inline-block">
          Open Backups
        </Link>
      </section>
      <section className="rx-surface-card rounded-ds-xl p-ds-5">
        <h2 className="mc-section__title">Configuration history</h2>
        <div className="mc-theme-studio__history">
          {history.map((entry) => (
            <div key={entry.id} className="mc-theme-studio__history-row">
              <div>
                <p className="font-semibold">{entry.label}</p>
                <p className="text-sm text-text-secondary">{new Date(entry.publishedAt).toLocaleString()}</p>
              </div>
              {entry.rollbackAvailable ? (
                <Button size="sm" variant="secondary" disabled={isPending} onClick={() => onRollback(entry.id)}>
                  Rollback
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function NotificationPanel({ alerts }: { alerts: AppStudioSnapshot["draft"]["notificationAlerts"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">Notification Center</h2>
      <div className="as-list">
        {alerts.map((alert) => (
          <div key={alert.id} className="as-list__row">
            <div>
              <p className="font-semibold">{alert.title}</p>
              <p className="text-sm text-text-secondary">{alert.message}</p>
              <p className="text-xs text-text-muted">
                {alert.module} · {new Date(alert.timestamp).toLocaleString()}
              </p>
            </div>
            <span className={cn("as-severity-pill", `as-severity-pill--${alert.severity}`)}>{alert.severity}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HealthPanel({ metrics }: { metrics: AppStudioSnapshot["systemHealth"] }) {
  return (
    <section className="rx-surface-card rounded-ds-xl p-ds-5">
      <h2 className="mc-section__title">System Health</h2>
      <div className="as-health-grid">
        {metrics.map((metric) => (
          <div key={metric.id} className="as-health-card">
            <p className="font-semibold">{metric.label}</p>
            <span className={cn("as-health-pill", `as-health-pill--${metric.status}`)}>{metric.status}</span>
            {metric.detail ? <p className="text-xs text-text-muted">{metric.detail}</p> : null}
          </div>
        ))}
      </div>
      <Link href="/super-admin/monitoring" className="as-overview-card__link mt-ds-4 inline-block">
        Open System Health
      </Link>
    </section>
  );
}

function AuditPanel({
  auditLog,
  history,
  onRollback,
  isPending,
}: {
  auditLog: AppStudioSnapshot["draft"]["auditLog"];
  history: AppStudioHistoryEntry[];
  onRollback: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="as-split-grid">
      <section className="rx-surface-card rounded-ds-xl p-ds-5">
        <h2 className="mc-section__title">Audit Center</h2>
        <div className="mc-theme-studio__history">
          {auditLog.length === 0 ? <p className="mc-section__desc">Changes will be logged here.</p> : null}
          {auditLog.map((entry) => (
            <div key={entry.id} className="mc-theme-studio__history-row">
              <div>
                <p className="font-semibold">
                  {entry.module}
                  {entry.component ? ` · ${entry.component}` : ""} · {entry.action}
                </p>
                <p className="text-sm text-text-secondary">
                  {entry.administrator} · {new Date(entry.timestamp).toLocaleString()}
                  {entry.ipAddress ? ` · ${entry.ipAddress}` : ""}
                  {entry.rollbackAvailable ? " · rollback available" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/super-admin/audit" className="as-overview-card__link mt-ds-4 inline-block">
          Full audit logs
        </Link>
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
                <Button size="sm" variant="secondary" disabled={isPending} onClick={() => onRollback(entry.id)}>
                  Rollback
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
