"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { NotificationCenter } from "@/features/notifications/components/NotificationCenter";
import { cn } from "@/lib/cn";
import { NOTIFICATIONS_ENGINE_FILTERS, NOTIFICATIONS_ENGINE_MODULES } from "@/lib/notifications-engine/registry";
import type {
  NotificationsEngineAnalytics,
  NotificationsEngineContext,
  NotificationsEngineDocument,
  NotificationsEngineFilterId,
  NotificationsEngineModule,
  NotificationsEngineNotificationSummary,
} from "@/lib/notifications-engine/types";
import type { Notification } from "@/lib/notifications/types";

type NotificationsEngineHubProps = {
  config: NotificationsEngineDocument;
  context: NotificationsEngineContext;
  modules: NotificationsEngineModule[];
  summaries: NotificationsEngineNotificationSummary[];
  analytics: NotificationsEngineAnalytics;
  notifications: Notification[];
};

type HubTab = "inbox" | "overview" | "analytics" | "badges";

const BADGE_LABELS: Record<string, string> = {
  total: "Total unread",
  messages: "Messages",
  orders: "Orders",
  notifications: "Notifications",
  saved: "Saved items",
  wallet: "Wallet",
};

export function NotificationsEngineHub({
  config,
  context,
  modules,
  summaries,
  analytics,
  notifications,
}: NotificationsEngineHubProps) {
  const [tab, setTab] = useState<HubTab>("inbox");
  const [engineFilter, setEngineFilter] = useState<NotificationsEngineFilterId>("all");

  const filteredSummaries = useMemo(() => {
    if (engineFilter === "all") return summaries;
    return summaries.filter((item) => item.filterTags.includes(engineFilter));
  }, [summaries, engineFilter]);

  if (tab === "inbox") {
    return (
      <div className="ne-hub">
        <header className="ne-hub__header sticky top-0 z-50">
          <div className="px-ds-4 pb-ds-2 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]">
            <p className="ne-hub__eyebrow">Notifications Engine</p>
            <p className="text-sm text-text-muted">
              {config.marketplaceVersion} · {config.primaryCountry} · {context.unreadCount} unread
            </p>
          </div>
          <div className="ne-hub__tabs px-ds-4 pb-ds-3">
            {(
              [
                { id: "inbox", label: "Inbox" },
                { id: "overview", label: "Overview" },
                { id: "analytics", label: "Analytics" },
                { id: "badges", label: "Badges" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn("ne-hub__tab", tab === item.id && "ne-hub__tab--active")}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>
        <NotificationCenter initialNotifications={notifications} />
      </div>
    );
  }

  return (
    <div className="ne-hub mx-auto flex w-full max-w-2xl flex-col gap-ds-4 px-ds-4 py-ds-5 pb-[calc(84px+env(safe-area-inset-bottom))]">
      <header className="ne-hub__intro">
        <p className="ne-hub__eyebrow">Notifications Engine</p>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-text-muted">
          {config.marketplaceVersion} · {config.primaryCountry} · {context.unreadCount} unread
        </p>
      </header>

      <div className="ne-hub__tabs">
        {(
          [
            { id: "inbox", label: "Inbox" },
            { id: "overview", label: "Overview" },
            { id: "analytics", label: "Analytics" },
            { id: "badges", label: "Badges" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn("ne-hub__tab", tab === item.id && "ne-hub__tab--active")}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "analytics" ? (
        <section className="ne-panel">
          <div className="ne-analytics-grid">
            <MetricCard label="Sent" value={analytics.sent} />
            <MetricCard label="Delivered" value={analytics.delivered} />
            <MetricCard label="Opened" value={analytics.opened} />
            <MetricCard label="Clicked" value={analytics.clicked} />
            <MetricCard label="Response rate" value={`${(analytics.responseRate * 100).toFixed(0)}%`} />
            <MetricCard label="Avg open time" value={`${analytics.averageOpenMinutes}m`} />
            <MetricCard label="Delivery perf." value={`${(analytics.deliveryPerformance * 100).toFixed(0)}%`} />
            <MetricCard label="Failed" value={analytics.failed} />
          </div>
        </section>
      ) : tab === "badges" ? (
        <>
          <section className="ne-panel">
            <h2 className="ne-panel__title">Live Badge Counters</h2>
            <div className="ne-badge-grid">
              {Object.entries(context.badgeCounts).map(([key, value]) => (
                <div key={key} className="ne-badge-card">
                  <p className="text-sm text-text-secondary">{BADGE_LABELS[key] ?? key}</p>
                  <p className="ne-badge-card__value">{value}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="ne-panel">
            <h2 className="ne-panel__title">Badge Surfaces</h2>
            <div className="ne-chip-row">
              {config.badgeSurfaces.map((surface) => (
                <span key={surface.id} className={cn("ne-chip", surface.enabled && "ne-chip--active")}>
                  {surface.label} · {surface.color}
                </span>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="ne-event-banner">
            <p className="font-semibold">Every important marketplace event generates secure, configurable notifications.</p>
            <Link href="/notifications/settings" className="ne-link mt-ds-2 inline-block">
              Notification preferences →
            </Link>
          </section>
          <section className="ne-panel">
            <h2 className="ne-panel__title">Delivery Channels</h2>
            <div className="ne-chip-row">
              {config.channels.filter((c) => c.enabled).map((channel) => (
                <span key={channel.id} className="ne-chip ne-chip--active">{channel.label}</span>
              ))}
            </div>
          </section>
          <section className="ne-panel">
            <div className="ne-stats-grid">
              <StatChip label="Total" value={context.totalNotifications} />
              <StatChip label="Unread" value={context.unreadCount} />
              <StatChip label="Read" value={context.readCount} />
            </div>
          </section>
          <NotificationSummaryList summaries={context.recentNotifications} title="Recent notifications" />
          <section className="ne-panel">
            <h2 className="ne-panel__title">Integrations</h2>
            <div className="ne-module-grid">
              {modules.slice(3).map((module) => (
                <Link key={module.id} href={module.href} className="ne-module-card">
                  <span>{module.icon}</span>
                  <span className="font-semibold">{module.label}</span>
                </Link>
              ))}
            </div>
          </section>
          <div className="ne-chip-row">
            {NOTIFICATIONS_ENGINE_FILTERS.filter((f) => f.id !== "all").map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn("ne-chip", engineFilter === item.id && "ne-chip--active")}
                onClick={() => setEngineFilter(engineFilter === item.id ? "all" : item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {engineFilter !== "all" ? (
            <NotificationSummaryList summaries={filteredSummaries} title="Filtered notifications" />
          ) : null}
        </>
      )}
    </div>
  );
}

function NotificationSummaryList({
  summaries,
  title,
}: {
  summaries: NotificationsEngineNotificationSummary[];
  title: string;
}) {
  return (
    <section className="ne-panel">
      <h2 className="ne-panel__title">{title}</h2>
      <div className="ne-list">
        {summaries.length === 0 ? <p className="text-sm text-text-muted">No notifications yet.</p> : null}
        {summaries.map((item) => (
          <Link key={item.notificationId} href={`/notifications/${item.notificationId}`} className="ne-list__row ne-list__row--link">
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-text-secondary">
                {item.priority} · {item.enterpriseType}
              </p>
            </div>
            {!item.read ? <span className="ne-chip ne-chip--active">Unread</span> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="ne-metric-card">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="ne-metric-card__value">{value}</p>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="ne-stat-chip">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
