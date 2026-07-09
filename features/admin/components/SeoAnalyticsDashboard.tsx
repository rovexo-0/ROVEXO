"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { SeoAnalyticsSnapshot } from "@/lib/seo/engine/analytics";
import type { SeoRegressionReport } from "@/lib/seo/engine/regression";

type SeoAnalyticsDashboardProps = {
  initialSnapshot: SeoAnalyticsSnapshot;
};

export function SeoAnalyticsDashboard({ initialSnapshot }: SeoAnalyticsDashboardProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [regression, setRegression] = useState<SeoRegressionReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/seo/analytics");
      if (!response.ok) return;
      const payload = (await response.json()) as { snapshot: SeoAnalyticsSnapshot };
      setSnapshot(payload.snapshot);
      setMessage("Analytics refreshed.");
    } finally {
      setBusy(false);
    }
  };

  const runRegression = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/seo/regression");
      const payload = (await response.json()) as { report: SeoRegressionReport };
      setRegression(payload.report);
      setMessage(payload.report.passed ? "Regression suite passed." : "Regression suite failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-ds-6">
      <div className="flex flex-wrap items-center justify-between gap-ds-3">
        <div>
          <h2 className="text-xl font-semibold">Organic Search Analytics</h2>
          <p className="text-sm text-text-secondary">
            Engine v{snapshot.engineVersion} · automated marketplace SEO signals
          </p>
        </div>
        <div className="flex gap-ds-2">
          <Button variant="secondary" onClick={refresh} disabled={busy}>
            Refresh
          </Button>
          <Button onClick={runRegression} disabled={busy}>
            Run Regression
          </Button>
        </div>
      </div>

      {message && <p className="text-sm text-text-secondary">{message}</p>}

      <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Audit Score</p>
          <p className="mt-ds-1 text-3xl font-bold">{snapshot.auditScore}/100</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Indexed Pages (est.)</p>
          <p className="mt-ds-1 text-3xl font-bold">{snapshot.indexedPagesEstimate.toLocaleString()}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Discovery Pages</p>
          <p className="mt-ds-1 text-3xl font-bold">{snapshot.discoveryPages}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Collections</p>
          <p className="mt-ds-1 text-3xl font-bold">{snapshot.collectionPages}</p>
        </Card>
      </div>

      <div className="grid gap-ds-4 lg:grid-cols-2">
        <Card className="p-ds-4">
          <h3 className="font-semibold">Health</h3>
          <div className="mt-ds-3 flex flex-wrap gap-ds-2">
            <Badge variant={snapshot.sitemapHealth === "healthy" ? "success" : "warning"}>
              Sitemap {snapshot.sitemapHealth}
            </Badge>
            <Badge variant={snapshot.structuredDataHealth === "healthy" ? "success" : "warning"}>
              Structured data {snapshot.structuredDataHealth}
            </Badge>
            <Badge variant="default">{snapshot.sitemapSegments} sitemap segments</Badge>
            <Badge variant="default">{snapshot.trendPages} active trends</Badge>
          </div>
        </Card>

        <Card className="p-ds-4">
          <h3 className="font-semibold">Crawl stats</h3>
          <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
            <li>Sitemap URLs: {snapshot.sitemapUrls}</li>
            <li>Category pages: {snapshot.categoryPages}</li>
            <li>Browse aliases: {snapshot.browseAliases}</li>
            <li>Est. indexable routes: {snapshot.crawlStats.estimatedIndexableRoutes.toLocaleString()}</li>
          </ul>
        </Card>
      </div>

      <div className="grid gap-ds-4 lg:grid-cols-2">
        <Card className="p-ds-4">
          <h3 className="font-semibold">Top categories</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {snapshot.topCategories.map((category) => (
              <li key={category.path}>
                <span className="text-text-primary">{category.name}</span>
                <span className="ml-ds-2 text-text-muted">{category.path}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Trending brands</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {snapshot.topBrands.map((brand) => (
              <li key={brand.slug}>
                <span className="text-text-primary">{brand.name}</span>
                <span className="ml-ds-2 text-text-muted">/brand/{brand.slug}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {regression && (
        <Card className="p-ds-4">
          <div className="flex items-center justify-between gap-ds-3">
            <h3 className="font-semibold">Regression suite</h3>
            <Badge variant={regression.passed ? "success" : "danger"}>
              {regression.passed ? "Passed" : "Failed"}
            </Badge>
          </div>
          <p className="mt-ds-2 text-sm text-text-secondary">
            {regression.criticalCount} critical · {regression.warningCount} warnings
          </p>
          {regression.issues.length > 0 && (
            <ul className="mt-ds-3 max-h-64 space-y-ds-2 overflow-y-auto text-sm">
              {regression.issues.slice(0, 20).map((issue) => (
                <li key={issue.id} className="text-text-secondary">
                  <span className={issue.severity === "critical" ? "text-danger" : "text-warning"}>
                    [{issue.severity}]
                  </span>{" "}
                  {issue.message}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
