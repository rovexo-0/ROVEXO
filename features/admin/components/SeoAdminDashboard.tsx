"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { SeoAuditReport } from "@/lib/seo/audit";

type SeoAdminDashboardProps = {
  initialReport: SeoAuditReport;
};

export function SeoAdminDashboard({ initialReport }: SeoAdminDashboardProps) {
  const [report, setReport] = useState(initialReport);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/seo/audit");
      if (!response.ok) return;
      const payload = (await response.json()) as { report: SeoAuditReport };
      setReport(payload.report);
      setMessage("SEO audit refreshed.");
    } finally {
      setBusy(false);
    }
  };

  const syncTaxonomy = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/categories/sync", { method: "POST" });
      const payload = (await response.json()) as { categoriesUpserted?: number; filtersUpserted?: number; errors?: string[] };
      if (!response.ok) {
        setMessage(payload.errors?.[0] ?? "Taxonomy sync failed.");
        return;
      }
      setMessage(`Synced ${payload.categoriesUpserted ?? 0} categories and ${payload.filtersUpserted ?? 0} filters.`);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-ds-6">
      <div className="flex flex-wrap items-center justify-between gap-ds-3">
        <div>
          <h2 className="text-xl font-semibold">SEO Dashboard</h2>
          <p className="text-sm text-text-secondary">Monitor index health, metadata coverage, and sitemap status.</p>
        </div>
        <div className="flex gap-ds-2">
          <Button variant="secondary" onClick={refresh} disabled={busy}>
            Run Audit
          </Button>
          <Button onClick={syncTaxonomy} disabled={busy}>
            Sync Taxonomy
          </Button>
        </div>
      </div>

      {message && <p className="text-sm text-text-secondary">{message}</p>}

      <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">SEO Score</p>
          <p className="mt-ds-1 text-3xl font-bold">{report.score}/100</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Category Pages</p>
          <p className="mt-ds-1 text-3xl font-bold">{report.stats.categoryPages}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Browse Pages</p>
          <p className="mt-ds-1 text-3xl font-bold">{report.stats.browsePages}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Location Pages</p>
          <p className="mt-ds-1 text-3xl font-bold">{report.stats.locationPages}</p>
        </Card>
      </div>

      <Card className="p-ds-4">
        <h3 className="font-semibold">Sitemap Segments</h3>
        <ul className="mt-ds-3 space-y-1 text-sm text-text-secondary">
          {["static", "categories", "locations", "products", "sellers", "business", "blog", "images"].map((segment) => (
            <li key={segment}>/sitemap/{segment}.xml</li>
          ))}
        </ul>
      </Card>

      <Card className="p-ds-4">
        <h3 className="font-semibold">Issues ({report.issues.length})</h3>
        <ul className="mt-ds-4 space-y-ds-3">
          {report.issues.length === 0 ? (
            <li className="text-sm text-text-secondary">No SEO issues detected.</li>
          ) : (
            report.issues.map((issue) => (
              <li key={issue.id} className="flex items-start gap-ds-3 text-sm">
                <Badge variant={issue.severity === "critical" ? "danger" : "warning"}>{issue.severity}</Badge>
                <div>
                  <p>{issue.message}</p>
                  {issue.path && <p className="text-text-muted">{issue.path}</p>}
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
