"use client";

import Link from "next/link";
import { ModuleIcon } from "@/components/icons/ModuleIcon";
import { useMemo, useState } from "react";
import { MissionControlAutoRefresh } from "@/features/super-admin/mission-control/MissionControlAutoRefresh";
import { MissionControlLiveCounters } from "@/features/super-admin/mission-control/MissionControlLiveCounters";
import { MissionControlServiceGrid } from "@/features/super-admin/mission-control/MissionControlServiceGrid";
import { cn } from "@/lib/cn";
import type {
  MissionControlBadgeLevel,
  MissionControlEngineSection,
  MissionControlLiveWidget,
  MissionControlMonitoring,
  MissionControlNotificationPreview,
  MissionControlQuickAction,
  MissionControlStatusBar,
  MissionControlV2Context,
} from "@/lib/mission-control-engine/types";
import type { MissionControlSnapshot } from "@/lib/super-admin/mission-control/types";

type MissionControlCenterV2Props = {
  snapshot: MissionControlSnapshot;
  context: MissionControlV2Context;
  sections: MissionControlEngineSection[];
  quickActions: MissionControlQuickAction[];
};

const BADGE_CLASS: Record<MissionControlBadgeLevel, string> = {
  healthy: "mc2-badge--healthy",
  info: "mc2-badge--info",
  warning: "mc2-badge--warning",
  attention: "mc2-badge--attention",
  critical: "mc2-badge--critical",
};

const GROUP_LABELS: Record<MissionControlEngineSection["group"], string> = {
  visual: "Visual & Content",
  commerce: "Commerce Centers",
  enterprise: "Enterprise Engines",
  operations: "Operations & Recovery",
};

const NOTIFICATION_CLASS: Record<MissionControlNotificationPreview["priority"], string> = {
  information: "mc2-notice--info",
  warning: "mc2-notice--warning",
  critical: "mc2-notice--critical",
  resolved: "mc2-notice--resolved",
};

function Badge({
  level,
  children,
  pulse,
}: {
  level: MissionControlBadgeLevel;
  children: React.ReactNode;
  pulse?: boolean;
}) {
  return (
    <span className={cn("mc2-badge", BADGE_CLASS[level], pulse && "mc2-badge--pulse")}>
      {children}
    </span>
  );
}

function StatusBar({ statusBar }: { statusBar: MissionControlStatusBar }) {
  const items: Array<{ label: string; value: string; level?: MissionControlBadgeLevel }> = [
    {
      label: "Platform",
      value: statusBar.platformStatus,
      level: statusBar.platformStatus === "online" ? "healthy" : statusBar.platformStatus === "warning" ? "warning" : "critical",
    },
    { label: "Environment", value: statusBar.environment },
    { label: "Version", value: statusBar.version },
    { label: "Build", value: statusBar.build },
    { label: "Git", value: statusBar.gitRevision },
    { label: "Deployed", value: new Date(statusBar.lastDeployment).toLocaleString() },
    { label: "Database", value: "Live", level: statusBar.database },
    { label: "Infrastructure", value: "Live", level: statusBar.infrastructure },
    { label: "AI", value: "Live", level: statusBar.ai },
    { label: "Search", value: "Live", level: statusBar.search },
    { label: "Payments", value: "Live", level: statusBar.payments },
  ];

  return (
    <div className="mc2-status-bar" role="status" aria-label="Enterprise status bar">
      {items.map((item) => (
        <div key={item.label} className="mc2-status-bar__item">
          <span className="mc2-status-bar__label">{item.label}</span>
          {item.level ? (
            <Badge level={item.level} pulse={item.level === "critical"}>
              {item.value}
            </Badge>
          ) : (
            <span className="mc2-status-bar__value">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function CommandHeader({ context }: { context: MissionControlV2Context }) {
  return (
    <header className="mc2-command-header">
      <div>
        <p className="mc2-command-header__eyebrow">Enterprise Command Center v2</p>
        <h1 className="mc2-command-header__title">Mission Control</h1>
        <p className="mc2-command-header__desc">
          Operating system for platform administration — visual, functional, AI, infrastructure, and enterprise control.
        </p>
      </div>
      <div className="mc2-command-header__metrics">
        <div className="mc2-metric-card">
          <span className="mc2-metric-card__label">Command Score</span>
          <strong className="mc2-metric-card__value">{context.dashboard.commandScore}</strong>
        </div>
        <div className="mc2-metric-card">
          <span className="mc2-metric-card__label">Modules</span>
          <strong className="mc2-metric-card__value">{context.dashboard.modulesEnabled}</strong>
        </div>
        <div className="mc2-metric-card">
          <span className="mc2-metric-card__label">Live Widgets</span>
          <strong className="mc2-metric-card__value">{context.dashboard.widgetsLive}</strong>
        </div>
        <div className="mc2-metric-card">
          <span className="mc2-metric-card__label">Audit (24h)</span>
          <strong className="mc2-metric-card__value">{context.dashboard.auditEvents24h}</strong>
        </div>
      </div>
    </header>
  );
}

function QuickActionsBar({ actions }: { actions: MissionControlQuickAction[] }) {
  return (
    <section className="mc2-section">
      <div className="mc2-section__header">
        <div>
          <h2 className="mc2-section__title">Quick Actions</h2>
          <p className="mc2-section__desc">Top enterprise shortcuts for daily operations.</p>
        </div>
        <Link href="/super-admin/search" className="mc2-section__link">
          Global Search
        </Link>
      </div>
      <div className="mc2-quick-actions">
        {actions.map((action) => (
          <Link key={action.id} href={action.href} className="mc2-quick-action">
            <span aria-hidden>{action.icon}</span>
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function LiveWidgetGrid({ widgets }: { widgets: MissionControlLiveWidget[] }) {
  return (
    <section className="mc2-section">
      <div className="mc2-section__header">
        <div>
          <h2 className="mc2-section__title">Live Platform Overview</h2>
          <p className="mc2-section__desc">Real-time enterprise widgets — auto-refreshes every 30 seconds.</p>
        </div>
      </div>
      <div className="mc2-widget-grid">
        {widgets.map((widget) => {
          const content = (
            <>
              <div className="mc2-widget-card__head">
                <span className="mc2-widget-card__label">{widget.label}</span>
                <Badge level={widget.level} pulse={widget.level === "critical"}>
                  {widget.level}
                </Badge>
              </div>
              <strong className="mc2-widget-card__value">{widget.value}</strong>
              {typeof widget.delta === "number" && widget.delta > 0 ? (
                <span className="mc2-widget-card__delta">+{widget.delta} active</span>
              ) : null}
            </>
          );

          return widget.href ? (
            <Link key={widget.id} href={widget.href} className="mc2-widget-card">
              {content}
            </Link>
          ) : (
            <div key={widget.id} className="mc2-widget-card">
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MonitoringPanel({ monitoring }: { monitoring: MissionControlMonitoring }) {
  const metrics = [
    { label: "Health Score", value: `${monitoring.healthScore}%` },
    { label: "Uptime", value: monitoring.uptime },
    { label: "Error Rate", value: `${monitoring.errorRate}%` },
    { label: "Latency", value: `${monitoring.latencyMs}ms` },
    { label: "CPU", value: `${monitoring.cpuPercent}%` },
    { label: "RAM", value: `${monitoring.memoryPercent}%` },
    { label: "Disk", value: `${monitoring.diskPercent}%` },
    { label: "API", value: `${monitoring.apiLatencyMs}ms` },
    { label: "RPM", value: monitoring.requestsPerMinute },
  ];

  return (
    <section className="mc2-section">
      <div className="mc2-section__header">
        <div>
          <h2 className="mc2-section__title">Live Monitoring</h2>
          <p className="mc2-section__desc">Infrastructure, API, queue, and worker health signals.</p>
        </div>
        <Link href="/super-admin/monitoring" className="mc2-section__link">
          Full diagnostics
        </Link>
      </div>
      <div className="mc2-monitoring-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className="mc2-monitoring-card">
            <span className="mc2-monitoring-card__label">{metric.label}</span>
            <strong className="mc2-monitoring-card__value">{metric.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function ModuleSections({ sections }: { sections: MissionControlEngineSection[] }) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => {
    const filtered = sections.filter((section) => {
      const haystack = `${section.label} ${section.description}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
    return (Object.keys(GROUP_LABELS) as MissionControlEngineSection["group"][]).map((group) => ({
      group,
      label: GROUP_LABELS[group],
      items: filtered.filter((section) => section.group === group),
    }));
  }, [query, sections]);

  return (
    <section className="mc2-section">
      <div className="mc2-section__header">
        <div>
          <h2 className="mc2-section__title">Enterprise Modules</h2>
          <p className="mc2-section__desc">Dedicated administration centers for every platform surface.</p>
        </div>
        <input
          type="search"
          className="mc2-search-input"
          placeholder="Filter modules…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Filter enterprise modules"
        />
      </div>
      {groups.map(({ group, label, items }) =>
        items.length === 0 ? null : (
          <div key={group} className="mc2-module-group">
            <h3 className="mc2-module-group__title">{label}</h3>
            <div className="mc2-module-grid">
              {items.map((section) => (
                <Link key={section.id} href={section.href} className="mc2-module-card">
                  <span className="mc2-module-card__icon" aria-hidden>
                    <ModuleIcon href={section.href} id={section.id} />
                  </span>
                  <span className="mc2-module-card__body">
                    <span className="mc2-module-card__title">
                      {section.label}
                      {section.badge ? (
                        <Badge level={section.badgeLevel ?? "info"} pulse={section.badgeLevel === "critical"}>
                          {section.badge}
                        </Badge>
                      ) : null}
                    </span>
                    <span className="mc2-module-card__desc">{section.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ),
      )}
    </section>
  );
}

function NotificationCenter({ notifications }: { notifications: MissionControlNotificationPreview[] }) {
  const [filter, setFilter] = useState<"all" | MissionControlNotificationPreview["priority"]>("all");
  const filtered = notifications.filter((item) => filter === "all" || item.priority === filter);

  return (
    <section className="mc2-section">
      <div className="mc2-section__header">
        <div>
          <h2 className="mc2-section__title">Live Notification Center</h2>
          <p className="mc2-section__desc">Enterprise alerts grouped by priority.</p>
        </div>
        <Link href="/super-admin/notifications-engine" className="mc2-section__link">
          Notifications Center
        </Link>
      </div>
      <div className="mc2-notice-filters">
        {(["all", "information", "warning", "critical", "resolved"] as const).map((priority) => (
          <button
            key={priority}
            type="button"
            className={cn("mc2-notice-filter", filter === priority && "mc2-notice-filter--active")}
            onClick={() => setFilter(priority)}
          >
            {priority === "all" ? "All" : priority}
          </button>
        ))}
      </div>
      <div className="mc2-notice-list">
        {filtered.map((notice) => (
          <div key={notice.id} className={cn("mc2-notice", NOTIFICATION_CLASS[notice.priority])}>
            <div className="mc2-notice__head">
              <strong>{notice.title}</strong>
              <Badge
                level={
                  notice.priority === "critical"
                    ? "critical"
                    : notice.priority === "warning"
                      ? "warning"
                      : notice.priority === "resolved"
                        ? "healthy"
                        : "info"
                }
                pulse={notice.priority === "critical"}
              >
                {notice.priority}
              </Badge>
            </div>
            <p className="mc2-notice__meta">
              {notice.module} · {new Date(notice.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductivityBar() {
  const items = [
    { label: "Undo / Redo", href: "/super-admin/audit" },
    { label: "History", href: "/super-admin/activity" },
    { label: "Rollback", href: "/super-admin/mission-control-engine" },
    { label: "Snapshots", href: "/super-admin/recovery" },
    { label: "Preview", href: "/super-admin/homepage-builder" },
    { label: "Publish Live", href: "/super-admin/theme-studio" },
    { label: "Audit Log", href: "/super-admin/audit" },
  ];

  return (
    <section className="mc2-section mc2-section--compact">
      <div className="mc2-section__header">
        <div>
          <h2 className="mc2-section__title">Admin Productivity</h2>
          <p className="mc2-section__desc">Draft, preview, publish, rollback, and audit workflows.</p>
        </div>
      </div>
      <div className="mc2-productivity-bar">
        {items.map((item) => (
          <Link key={item.label} href={item.href} className="mc2-productivity-chip">
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function MissionControlCenterV2({
  snapshot,
  context,
  sections,
  quickActions,
}: MissionControlCenterV2Props) {
  return (
    <MissionControlAutoRefresh>
      <div className="mc2-center">
        <StatusBar statusBar={context.statusBar} />
        <CommandHeader context={context} />
        <QuickActionsBar actions={quickActions} />
        <LiveWidgetGrid widgets={context.widgets} />
        <MonitoringPanel monitoring={context.monitoring} />
        <ModuleSections sections={sections} />
        <section className="mc2-section">
          <div className="mc2-section__header">
            <div>
              <h2 className="mc2-section__title">Live platform status</h2>
              <p className="mc2-section__desc">Real-time health across marketplace services.</p>
            </div>
            <p className="mc2-section__meta">Updated {new Date(context.scannedAt).toLocaleTimeString()}</p>
          </div>
          <MissionControlServiceGrid services={snapshot.services} />
        </section>
        <section className="mc2-section">
          <div className="mc2-section__header">
            <div>
              <h2 className="mc2-section__title">Live counters</h2>
              <p className="mc2-section__desc">Activity deltas across the platform.</p>
            </div>
          </div>
          <MissionControlLiveCounters counters={snapshot.counters} />
        </section>
        <NotificationCenter notifications={context.notifications} />
        <ProductivityBar />
      </div>
    </MissionControlAutoRefresh>
  );
}
