"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { SeoHealthCenterReport } from "@/lib/seo/engine/health-center";
import type { SeoRegressionReport } from "@/lib/seo/engine/regression";

type SeoHealthCenterProps = {
  initialReport: SeoHealthCenterReport;
};

export function SeoHealthCenter({ initialReport }: SeoHealthCenterProps) {
  const [report, setReport] = useState(initialReport);
  const [regression, setRegression] = useState<SeoRegressionReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/seo/health");
      if (!response.ok) return;
      const payload = (await response.json()) as { report: SeoHealthCenterReport };
      setReport(payload.report);
      setMessage("Health center refreshed.");
    } finally {
      setBusy(false);
    }
  };

  const runRegression = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/seo/regression");
      const payload = (await response.json()) as { report: SeoRegressionReport };
      setRegression(payload.report);
      setMessage(payload.report.passed ? "Regression passed — safe to deploy." : "Regression failed — deployment blocked.");
    } finally {
      setBusy(false);
    }
  };

  const statusVariant =
    report.healthStatus === "healthy" ? "success" : report.healthStatus === "warning" ? "warning" : "danger";

  return (
    <div className="space-y-ds-6">
      <div className="flex flex-wrap items-center justify-between gap-ds-3">
        <div>
          <h2 className="text-xl font-semibold">SEO Health Center</h2>
          <p className="text-sm text-text-secondary">
            {report.platformName} v{report.engineVersion}
          </p>
        </div>
        <div className="flex gap-ds-2">
          <Button variant="secondary" onClick={refresh} disabled={busy}>
            Refresh
          </Button>
          <Button onClick={runRegression} disabled={busy}>
            Run Regression Gate
          </Button>
        </div>
      </div>

      {message && <p className="text-sm text-text-secondary">{message}</p>}

      <div className="flex flex-wrap gap-ds-2">
        <Badge variant={statusVariant}>Platform {report.healthStatus}</Badge>
        <Badge variant={report.regressionPassed ? "success" : "danger"}>
          Regression {report.regressionPassed ? "passed" : "failed"}
        </Badge>
        <Badge variant="default">Score {report.auditScore}/100</Badge>
      </div>

      <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Indexed URLs (est.)</p>
          <p className="mt-ds-1 text-3xl font-bold">{report.coverage.indexedEstimate.toLocaleString()}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Organic landing pages</p>
          <p className="mt-ds-1 text-3xl font-bold">{report.coverage.organicLandingPages.toLocaleString()}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Discovery pages</p>
          <p className="mt-ds-1 text-3xl font-bold">{report.coverage.discoveryPages}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Collections</p>
          <p className="mt-ds-1 text-3xl font-bold">{report.coverage.collectionPages}</p>
        </Card>
      </div>

      <div className="grid gap-ds-4 lg:grid-cols-3">
        <Card className="p-ds-4">
          <h3 className="font-semibold">Crawl &amp; index status</h3>
          <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
            <li>Sitemap valid: {report.crawlStatus.sitemapValid ? "Yes" : "No"}</li>
            <li>Robots healthy: {report.crawlStatus.robotsHealthy ? "Yes" : "No"}</li>
            <li>Segments: {report.crawlStatus.segmentCount}</li>
            <li>CWV status: {report.performance.cwvStatus}</li>
            <li>SEO target: {report.performance.seoTarget}+</li>
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Organic signals</h3>
          <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
            <li>Sessions (est.): {report.organic.sessionsEstimate.toLocaleString()}</li>
            <li>Conversions (est.): {report.organic.conversionsEstimate.toLocaleString()}</li>
            <li>Top queries: {report.organic.topQueries.slice(0, 3).join(", ") || "—"}</li>
            <li>Optimizer run: {new Date(report.optimizer.lastEvaluatedAt).toLocaleString()}</li>
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Emerging entities</h3>
          <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
            <li>Brands: {report.optimizer.emergingBrands.slice(0, 4).join(", ") || "—"}</li>
            <li>Categories: {report.optimizer.emergingCategories.slice(0, 4).join(", ") || "—"}</li>
            <li>Indexable discovery: {report.optimizer.indexableDiscovery}</li>
          </ul>
        </Card>
      </div>

      <div className="grid gap-ds-4 lg:grid-cols-3">
        <Card className="p-ds-4">
          <h3 className="font-semibold">Issue summary</h3>
          <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
            <li>Duplicate metadata: {report.issues.duplicateMetadata}</li>
            <li>Orphan pages: {report.issues.orphanPages}</li>
            <li>Canonical errors: {report.issues.canonicalErrors}</li>
            <li>Sitemap errors: {report.issues.sitemapErrors}</li>
            <li>Structured data errors: {report.issues.structuredDataErrors}</li>
            <li>Broken links: {report.issues.brokenLinks}</li>
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Scalability</h3>
          <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
            <li>Chunk size: {report.scalability.sitemapChunkSize.toLocaleString()} URLs</li>
            <li>Est. chunks: {report.scalability.estimatedChunks}</li>
            <li>Max scale: {report.scalability.maxSupportedUrls}</li>
            <li>Sitemap segments: {report.sitemapSegments}</li>
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Integrations</h3>
          <ul className="mt-ds-3 space-y-ds-1 text-sm text-text-secondary">
            <li>Google Search Console: {report.integrations.searchConsoleReady ? "Ready" : "Pending"}</li>
            <li>Bing Webmaster: {report.integrations.bingWebmasterReady ? "Ready" : "Pending"}</li>
            <li>hreflang / multi-market: {report.integrations.hreflangReady ? "Ready" : "Pending"}</li>
          </ul>
        </Card>
      </div>

      {regression && (
        <Card className="p-ds-4">
          <h3 className="font-semibold">Deployment regression gate</h3>
          <p className="mt-ds-2 text-sm text-text-secondary">
            {regression.criticalCount} critical · {regression.warningCount} warnings
          </p>
          {!regression.passed && (
            <ul className="mt-ds-3 max-h-48 space-y-ds-1 overflow-y-auto text-sm text-danger">
              {regression.issues
                .filter((issue) => issue.severity === "critical")
                .slice(0, 10)
                .map((issue) => (
                  <li key={issue.id}>{issue.message}</li>
                ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
