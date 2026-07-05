"use client";

import { ActivityFeed } from "@/features/super-admin/command-center-v1/components/ActivityFeed";
import { ChartsPanel } from "@/features/super-admin/command-center-v1/components/ChartsPanel";
import { CommandCenterWorldMap } from "@/features/super-admin/command-center-v1/components/CommandCenterWorldMap";
import { CriticalAlertsBar } from "@/features/super-admin/command-center-v1/components/CriticalAlertsBar";
import { GlobalSearchBar } from "@/features/super-admin/command-center-v1/components/GlobalSearchBar";
import { HealthScoresPanel } from "@/features/super-admin/command-center-v1/components/HealthScoresPanel";
import { MetricSection } from "@/features/super-admin/command-center-v1/components/MetricSection";
import { NotificationsPanel } from "@/features/super-admin/command-center-v1/components/NotificationsPanel";
import { QuickActionsGrid } from "@/features/super-admin/command-center-v1/components/QuickActionsGrid";
import { StatusHeader } from "@/features/super-admin/command-center-v1/components/StatusHeader";
import { useCommandCenterLive } from "@/features/super-admin/command-center-v1/CommandCenterLiveProvider";
import type { CommandCenterV1Snapshot } from "@/lib/super-admin/command-center-v1/types";

type CommandCenterV1Props = {
  initialSnapshot: CommandCenterV1Snapshot;
};

function CommandCenterV1Body({
  snapshot,
  isRefreshing,
  onRefresh,
}: {
  snapshot: CommandCenterV1Snapshot;
  isRefreshing: boolean;
  onRefresh?: () => void;
}) {
  return (
    <div className="cc1-root">
      <StatusHeader
        platformStatus={snapshot.platformStatus}
        generatedAt={snapshot.generatedAt}
        liveLabel="Network Operations Center"
      />
      <CriticalAlertsBar alerts={snapshot.criticalAlerts} />
      <HealthScoresPanel cards={snapshot.healthCards} />
      <div className="cc1-toolbar">
        <GlobalSearchBar
          sections={snapshot.sections}
          quickActionLabels={snapshot.quickActions.map((action) => action.label)}
        />
        <button
          type="button"
          className="cc1-refresh"
          onClick={() => (onRefresh ? void onRefresh() : window.location.reload())}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="cc1-primary">
        {snapshot.sections.map((section) => (
          <MetricSection key={section.id} section={section} />
        ))}
      </div>

      <ChartsPanel charts={snapshot.charts} />

      <div className="cc1-secondary-grid">
        <CommandCenterWorldMap countries={snapshot.countries} />
        <NotificationsPanel notifications={snapshot.notifications} />
        <ActivityFeed events={snapshot.activityFeed} />
        <QuickActionsGrid actions={snapshot.quickActions} />
      </div>
    </div>
  );
}

export function CommandCenterV1({ initialSnapshot }: CommandCenterV1Props) {
  return <CommandCenterV1Body snapshot={initialSnapshot} isRefreshing={false} />;
}

export function CommandCenterV1Live() {
  const { snapshot, isRefreshing, refresh } = useCommandCenterLive();
  return <CommandCenterV1Body snapshot={snapshot} isRefreshing={isRefreshing} onRefresh={refresh} />;
}
