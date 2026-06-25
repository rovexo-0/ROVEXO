"use client";

import { cn } from "@/lib/cn";
import type { LiveAnalyticsFilters } from "@/lib/analytics/live-center/types";
import { focusRing } from "@/components/ui/tokens";

type FilterOption = { value: string; label: string };

type LiveAnalyticsToolbarProps = {
  filters: LiveAnalyticsFilters;
  onChange: (filters: LiveAnalyticsFilters) => void;
  onRefresh: () => void;
  refreshing: boolean;
  options: {
    countries: FilterOption[];
    browsers: FilterOption[];
    operatingSystems: FilterOption[];
    devices: FilterOption[];
    trafficSources: FilterOption[];
  };
};

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-ds-1 text-xs text-text-secondary">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "rounded-ds-lg border border-border/70 bg-white/80 px-ds-2 py-ds-2 text-sm text-text-primary",
          focusRing,
        )}
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LiveAnalyticsToolbar({
  filters,
  onChange,
  onRefresh,
  refreshing,
  options,
}: LiveAnalyticsToolbarProps) {
  return (
    <section className="live-analytics-glass rounded-[24px] p-ds-4">
      <div className="flex flex-wrap items-end justify-between gap-ds-3">
        <div className="min-w-[220px] flex-1">
          <label className="flex flex-col gap-ds-1 text-xs text-text-secondary">
            Search country, city, browser, device
            <input
              type="search"
              value={filters.query}
              onChange={(event) => onChange({ ...filters, query: event.target.value })}
              placeholder="Search…"
              className={cn(
                "rounded-ds-lg border border-border/70 bg-white/80 px-ds-3 py-ds-2 text-sm text-text-primary",
                focusRing,
              )}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className={cn(
            "rounded-ds-lg border border-border/70 bg-white/90 px-ds-4 py-ds-2 text-sm font-semibold text-text-primary",
            "hover:bg-white disabled:opacity-60",
            focusRing,
          )}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="mt-ds-4 grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SelectField
          label="Country"
          value={filters.country}
          options={options.countries}
          onChange={(country) => onChange({ ...filters, country })}
        />
        <SelectField
          label="Browser"
          value={filters.browser}
          options={options.browsers}
          onChange={(browser) => onChange({ ...filters, browser })}
        />
        <SelectField
          label="Operating System"
          value={filters.operatingSystem}
          options={options.operatingSystems}
          onChange={(operatingSystem) => onChange({ ...filters, operatingSystem })}
        />
        <SelectField
          label="Device"
          value={filters.device}
          options={options.devices}
          onChange={(device) => onChange({ ...filters, device })}
        />
        <SelectField
          label="Traffic Source"
          value={filters.trafficSource}
          options={options.trafficSources}
          onChange={(trafficSource) => onChange({ ...filters, trafficSource })}
        />
        <label className="flex flex-col gap-ds-1 text-xs text-text-secondary">
          Date
          <input
            type="date"
            value={filters.date}
            onChange={(event) =>
              onChange({ ...filters, date: event.target.value, liveOnly: !event.target.value })
            }
            className={cn(
              "rounded-ds-lg border border-border/70 bg-white/80 px-ds-2 py-ds-2 text-sm text-text-primary",
              focusRing,
            )}
          />
        </label>
      </div>

      <label className="mt-ds-3 inline-flex items-center gap-ds-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={filters.liveOnly}
          onChange={(event) => onChange({ ...filters, liveOnly: event.target.checked })}
          className="size-4 rounded border-border"
        />
        Live only
      </label>
    </section>
  );
}
