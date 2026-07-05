"use client";

import Link from "next/link";
import { useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { cn } from "@/lib/cn";
import type {
  SearchEngineAnalytics,
  SearchEngineContext,
  SearchEngineDocument,
  SearchEngineModule,
} from "@/lib/search-engine/types";

type SearchEngineHubProps = {
  config: SearchEngineDocument;
  context: SearchEngineContext;
  modules: SearchEngineModule[];
  analytics: SearchEngineAnalytics;
  landing?: React.ReactNode;
};

type HubTab = "dashboard" | "discovery" | "filters" | "indexes" | "modules";

export function SearchEngineHub({ config, context, modules, analytics, landing }: SearchEngineHubProps) {
  const [tab, setTab] = useState<HubTab>("dashboard");
  const { dashboard } = context;

  return (
    <BetaAppShell bottomNavTab="search">
      <main className="srch-hub mx-auto flex w-full max-w-2xl flex-col gap-ds-4 px-ds-4 py-ds-5 pb-[calc(84px+env(safe-area-inset-bottom))]">
        <header className="srch-hub__intro">
          <p className="srch-hub__eyebrow">Search Engine</p>
          <p className="text-sm text-text-secondary">
            {config.marketplaceVersion} · {config.primaryCountry} · {config.currency}
          </p>
          <p className="text-sm text-text-muted">
            Search score {dashboard.searchScore}% · Health: {dashboard.searchHealth}
          </p>
        </header>

        <section className="srch-live-banner">
          <p className="font-semibold">Index status: {dashboard.indexStatus}</p>
          <p className="text-sm text-text-secondary mt-ds-1">
            {dashboard.indexedListings.toLocaleString()} listings · {dashboard.queryTimeMs}ms avg query
          </p>
          <Link href="/super-admin/search" className="srch-link mt-ds-2 inline-block">
            Enterprise search →
          </Link>
        </section>

        <div className="srch-hub__tabs">
          {(
            [
              { id: "dashboard", label: "Dashboard" },
              { id: "discovery", label: "Discovery" },
              { id: "filters", label: "Filters" },
              { id: "indexes", label: "Indexes" },
              { id: "modules", label: "Modules" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn("srch-hub__tab", tab === item.id && "srch-hub__tab--active")}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "discovery" ? (
          <>
            <section className="srch-panel">
              <h2 className="srch-panel__title">Trending Searches</h2>
              <div className="flex flex-wrap gap-ds-2">
                {analytics.trendingSearches.map((term) => (
                  <Link key={term} href={`/search?q=${encodeURIComponent(term)}`}>
                    <CategoryChip label={term} />
                  </Link>
                ))}
              </div>
            </section>
            <section className="srch-panel">
              <h2 className="srch-panel__title">Popular Categories</h2>
              <div className="srch-chip-row">
                {analytics.popularCategories.map((category) => (
                  <span key={category} className="srch-chip srch-chip--active">{category}</span>
                ))}
              </div>
            </section>
            <section className="srch-panel">
              <h2 className="srch-panel__title">Search Types</h2>
              <div className="srch-chip-row">
                {config.searchTypes.filter((t) => t.enabled).map((type) => (
                  <span key={type.id} className="srch-chip srch-chip--active">{type.label}</span>
                ))}
              </div>
            </section>
          </>
        ) : tab === "filters" ? (
          <>
            <section className="srch-panel">
              <h2 className="srch-panel__title">Search Filters</h2>
              <div className="srch-chip-row">
                {Object.entries(config.filters).map(([key, enabled]) => (
                  <span key={key} className={cn("srch-chip", enabled && "srch-chip--active")}>{key}</span>
                ))}
              </div>
            </section>
            <section className="srch-panel">
              <h2 className="srch-panel__title">Sort Options</h2>
              <div className="srch-chip-row">
                {config.sortOptions.filter((s) => s.enabled).map((sort) => (
                  <span key={sort.id} className="srch-chip srch-chip--active">{sort.label}</span>
                ))}
              </div>
            </section>
          </>
        ) : tab === "indexes" ? (
          <section className="srch-panel">
            <h2 className="srch-panel__title">Search Index</h2>
            <div className="srch-analytics-grid">
              <MetricCard label="Listings" value={dashboard.indexedListings} />
              <MetricCard label="Categories" value={dashboard.indexedCategories} />
              <MetricCard label="Sellers" value={dashboard.indexedSellers} />
              <MetricCard label="Businesses" value={dashboard.indexedBusinesses} />
            </div>
            <div className="srch-chip-row mt-ds-4">
              {config.indexes.filter((i) => i.enabled).map((index) => (
                <span key={index.id} className="srch-chip srch-chip--active">{index.label}</span>
              ))}
            </div>
          </section>
        ) : tab === "modules" ? (
          <section className="srch-panel">
            <h2 className="srch-panel__title">Search Modules</h2>
            <div className="srch-module-grid">
              {modules.map((module) => (
                <Link key={module.id} href={module.href} className="srch-module-card">
                  <span>{module.icon}</span>
                  <div>
                    <p className="font-semibold">{module.label}</p>
                    <p className="text-xs text-text-secondary">{module.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <>
            <section className="srch-panel">
              <div className="srch-analytics-grid">
                <MetricCard label="Search score" value={`${dashboard.searchScore}%`} />
                <MetricCard label="Success rate" value={`${dashboard.searchSuccessRate}%`} />
                <MetricCard label="Requests (24h)" value={dashboard.searchRequests24h} />
                <MetricCard label="Failed (24h)" value={dashboard.failedSearches24h} />
                <MetricCard label="Search types" value={analytics.enabledSearchTypes} />
                <MetricCard label="Filters" value={analytics.enabledFilters} />
                <MetricCard label="Sort options" value={analytics.enabledSortOptions} />
                <MetricCard label="Zero-result rate" value={`${analytics.zeroResultRate}%`} />
              </div>
            </section>
            <section className="srch-panel">
              <h2 className="srch-panel__title">Performance</h2>
              <div className="srch-chip-row">
                {Object.entries(config.performance).map(([key, enabled]) => (
                  <span key={key} className={cn("srch-chip", enabled && "srch-chip--active")}>{key}</span>
                ))}
              </div>
            </section>
            {landing ? <div className="srch-landing">{landing}</div> : null}
          </>
        )}
      </main>
    </BetaAppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="srch-metric-card">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="srch-metric-card__value">{value}</p>
    </div>
  );
}
