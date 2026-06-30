"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_LIVE_ANALYTICS_FILTERS,
  type LiveAnalyticsFilters,
} from "@/lib/analytics/live-center/types";
import { useLiveAnalyticsCenter } from "@/features/super-admin/live-analytics/hooks/useLiveAnalyticsCenter";
import {
  applyLiveAnalyticsFilters,
  buildFilterOptions,
} from "@/features/super-admin/live-analytics/lib/filter-snapshot";
import { LiveAnalyticsToolbar } from "@/features/super-admin/live-analytics/components/LiveAnalyticsToolbar";
import { LiveCountriesSection } from "@/features/super-admin/live-analytics/components/LiveCountriesSection";
import { LiveDimensionPanel } from "@/features/super-admin/live-analytics/components/LiveDimensionPanel";
import { LiveCitiesSection } from "@/features/super-admin/live-analytics/components/LiveCitiesSection";
import { LiveEventFeed } from "@/features/super-admin/live-analytics/components/LiveEventFeed";
import { LiveVisitorMetricsCard } from "@/features/super-admin/live-analytics/components/LiveVisitorMetricsCard";
import { LivePerformanceSection } from "@/features/super-admin/live-analytics/components/LivePerformanceSection";
import { LiveWorldMap } from "@/features/super-admin/live-analytics/components/LiveWorldMap";
import { LiveCountriesPanel } from "@/features/super-admin/components/LiveCountriesPanel";

type LiveAnalyticsCenterProps = {
  showLegacyPanel?: boolean;
};

export function LiveAnalyticsCenter({ showLegacyPanel = false }: LiveAnalyticsCenterProps) {
  const { snapshot, loading, refreshing, error, refresh } = useLiveAnalyticsCenter();
  const [filters, setFilters] = useState<LiveAnalyticsFilters>(DEFAULT_LIVE_ANALYTICS_FILTERS);

  const filtered = useMemo(
    () => (snapshot ? applyLiveAnalyticsFilters(snapshot, filters) : null),
    [snapshot, filters],
  );

  const filterOptions = useMemo(
    () => (snapshot ? buildFilterOptions(snapshot) : null),
    [snapshot],
  );

  if (loading && !snapshot) {
    return (
      <div className="live-analytics-loading flex min-h-64 items-center justify-center rounded-[24px] border border-border/60 bg-white/70">
        <p className="text-sm text-text-secondary">Loading live analytics…</p>
      </div>
    );
  }

  if (error && !snapshot) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  if (!filtered || !filterOptions) return null;

  const sourceLabel =
    filtered.source === "ga4"
      ? "Google Analytics 4"
      : filtered.source === "hybrid"
        ? "GA4 + Platform"
        : "Platform heartbeat";

  return (
    <div className="flex flex-col gap-ds-4">
      <div className="flex flex-wrap items-center justify-between gap-ds-2">
        <p className="text-xs text-text-muted">
          Enterprise Live Analytics Center · Source: {sourceLabel}
        </p>
        {refreshing ? (
          <span className="live-country-pulse inline-flex items-center gap-ds-1 text-xs text-success">
            <span className="live-country-pulse-dot" aria-hidden />
            Syncing
          </span>
        ) : null}
      </div>

      <LiveAnalyticsToolbar
        filters={filters}
        onChange={setFilters}
        onRefresh={refresh}
        refreshing={refreshing}
        options={filterOptions}
      />

      <LiveVisitorMetricsCard metrics={filtered.visitorMetrics} />

      <div className="grid gap-ds-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <LiveCountriesSection countries={filtered.countries} updatedAt={filtered.updatedAt} />
        <LiveWorldMap countries={filtered.countries} />
      </div>

      <div className="grid gap-ds-4 md:grid-cols-2 xl:grid-cols-4">
        <LiveDimensionPanel title="Live Devices" icon="💻" rows={filtered.devices} />
        <LiveDimensionPanel title="Live Browsers" icon="🌐" rows={filtered.browsers} />
        <LiveDimensionPanel title="Live Operating Systems" icon="🖥️" rows={filtered.operatingSystems} />
        <LiveDimensionPanel title="Live Traffic Sources" icon="📈" rows={filtered.trafficSources} />
      </div>

      <div className="grid gap-ds-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <LiveCitiesSection cities={filtered.cities} />
        <LiveEventFeed events={filtered.events} />
      </div>

      <LivePerformanceSection performance={filtered.performance} />

      {showLegacyPanel ? (
        <details className="live-analytics-glass rounded-[24px] p-ds-4">
          <summary className="cursor-pointer text-sm font-semibold text-text-primary">
            Legacy Live Countries Panel
          </summary>
          <div className="mt-ds-4">
            <LiveCountriesPanel />
          </div>
        </details>
      ) : null}
    </div>
  );
}
