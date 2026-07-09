"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { OrganicGrowthDashboard } from "@/lib/organic-growth/dashboard";

type OrganicGrowthDashboardProps = {
  initialDashboard: OrganicGrowthDashboard;
};

export function OrganicGrowthDashboardView({ initialDashboard }: OrganicGrowthDashboardProps) {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/organic-growth");
      if (!response.ok) return;
      const payload = (await response.json()) as { dashboard: OrganicGrowthDashboard };
      setDashboard(payload.dashboard);
      setMessage("Dashboard refreshed.");
    } finally {
      setBusy(false);
    }
  };

  const runAutomation = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/organic-growth", { method: "POST" });
      if (!response.ok) return;
      const payload = (await response.json()) as { dashboard: OrganicGrowthDashboard };
      setDashboard(payload.dashboard);
      setMessage("Automation cycle completed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-ds-6">
      <div className="flex flex-wrap items-center justify-between gap-ds-3">
        <div>
          <h2 className="text-xl font-semibold">Organic Growth Dashboard</h2>
          <p className="text-sm text-text-secondary">
            ROVEXO Organic Growth Engine v{dashboard.engineVersion}
          </p>
        </div>
        <div className="flex gap-ds-2">
          <Button variant="secondary" onClick={refresh} disabled={busy}>
            Refresh
          </Button>
          <Button onClick={runAutomation} disabled={busy}>
            Run Automation
          </Button>
        </div>
      </div>

      {message && <p className="text-sm text-text-secondary">{message}</p>}

      <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Organic sessions (est.)</p>
          <p className="mt-ds-1 text-3xl font-bold">{dashboard.metrics.organicSessionsEstimate.toLocaleString()}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Organic buyers (est.)</p>
          <p className="mt-ds-1 text-3xl font-bold">{dashboard.metrics.organicBuyersEstimate.toLocaleString()}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Organic sellers</p>
          <p className="mt-ds-1 text-3xl font-bold">{dashboard.metrics.organicSellersEstimate.toLocaleString()}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Conversion rate</p>
          <p className="mt-ds-1 text-3xl font-bold">{dashboard.metrics.conversionRateEstimate}%</p>
        </Card>
      </div>

      <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Listings</p>
          <p className="mt-ds-1 text-2xl font-bold">{dashboard.metrics.listingCount.toLocaleString()}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Organic landing pages</p>
          <p className="mt-ds-1 text-2xl font-bold">{dashboard.organicLandingPages.toLocaleString()}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Returning users (est.)</p>
          <p className="mt-ds-1 text-2xl font-bold">{dashboard.metrics.returningUsersEstimate.toLocaleString()}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Organic revenue (est.)</p>
          <p className="mt-ds-1 text-2xl font-bold">£{dashboard.metrics.organicRevenueEstimate.toLocaleString()}</p>
        </Card>
      </div>

      <div className="grid gap-ds-4 lg:grid-cols-3">
        <Card className="p-ds-4">
          <h3 className="font-semibold">Growth metrics</h3>
          <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
            <li>Inventory growth: {dashboard.metrics.inventoryGrowthPercent}%</li>
            <li>Sales growth: {dashboard.metrics.salesGrowthPercent}%</li>
            <li>Favorites growth: {dashboard.metrics.favoritesGrowthPercent}%</li>
            <li>Discovery items: {dashboard.discovery.items.length}</li>
            <li>Automation status: {dashboard.automation.status}</li>
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Trending searches</h3>
          <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
            {dashboard.trendingSearches.slice(0, 6).map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Growth opportunities</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {dashboard.opportunities.slice(0, 5).map((opp) => (
              <li key={opp.id}>
                <Badge variant={opp.priority === "high" ? "warning" : "default"}>{opp.priority}</Badge>
                <span className="ml-ds-2 text-text-secondary">{opp.title}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-ds-4 lg:grid-cols-2">
        <Card className="p-ds-4">
          <h3 className="font-semibold">Top categories</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {dashboard.topCategories.map((entry) => (
              <li key={entry.href}>
                <span className="text-text-primary">{entry.name}</span>
                <span className="ml-ds-2 text-text-muted">score {entry.score}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Top brands</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {dashboard.topBrands.map((entry) => (
              <li key={entry.href}>
                <span className="text-text-primary">{entry.name}</span>
                <span className="ml-ds-2 text-text-muted">score {entry.score}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-ds-4 lg:grid-cols-2">
        <Card className="p-ds-4">
          <h3 className="font-semibold">Top stores</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {dashboard.topStores.map((entry) => (
              <li key={entry.href}>
                <span className="text-text-primary">{entry.name}</span>
                <span className="ml-ds-2 text-text-muted">{entry.href}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Top cities</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {dashboard.topCities.map((entry) => (
              <li key={entry.href}>
                <span className="text-text-primary">{entry.name}</span>
                <span className="ml-ds-2 text-text-muted">{entry.href}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-ds-4">
        <h3 className="font-semibold">Search insights recommendations</h3>
        <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
          {dashboard.searchInsights.recommendations.slice(0, 8).map((rec) => (
            <li key={rec}>{rec}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
