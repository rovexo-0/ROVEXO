"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { HelpAnalyticsSummary } from "@/lib/help/analytics";
import type { HelpContentRequirement } from "@/lib/help/types";

type HelpAdminPayload = {
  analytics: HelpAnalyticsSummary & {
    contentStats: { topics: number; articles: number; decisionTrees: number };
  };
  incompleteDocs: HelpContentRequirement[];
  topics: number;
  articles: number;
  trees: number;
};

type HelpAdminDashboardProps = {
  initialData: HelpAdminPayload;
};

export function HelpAdminDashboard({ initialData }: HelpAdminDashboardProps) {
  const [data, setData] = useState(initialData);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/help");
      if (!response.ok) return;
      setData((await response.json()) as HelpAdminPayload);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-ds-6">
      <div className="flex flex-wrap items-center justify-between gap-ds-3">
        <div>
          <h2 className="text-xl font-semibold">Help Center Management</h2>
          <p className="text-sm text-text-secondary">
            Categories, articles, decision trees, analytics, and documentation coverage.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void refresh()} disabled={busy}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Help Topics</p>
          <p className="mt-ds-1 text-3xl font-bold">{data.topics}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Articles</p>
          <p className="mt-ds-1 text-3xl font-bold">{data.articles}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Decision Trees</p>
          <p className="mt-ds-1 text-3xl font-bold">{data.trees}</p>
        </Card>
        <Card className="p-ds-4">
          <p className="text-sm text-text-secondary">Search Success</p>
          <p className="mt-ds-1 text-3xl font-bold">{data.analytics.searchSuccessRate}%</p>
        </Card>
      </div>

      <div className="grid gap-ds-4 lg:grid-cols-2">
        <Card className="p-ds-4">
          <h3 className="font-semibold">Most viewed articles</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {data.analytics.topArticles.map((item) => (
              <li key={item.slug} className="flex justify-between gap-ds-3">
                <span>{item.slug}</span>
                <Badge>{item.views}</Badge>
              </li>
            ))}
            {!data.analytics.topArticles.length ? <li className="text-text-secondary">No events yet</li> : null}
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Most opened decision trees</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {data.analytics.topTrees.map((item) => (
              <li key={item.slug} className="flex justify-between gap-ds-3">
                <span>{item.slug}</span>
                <Badge>{item.starts}</Badge>
              </li>
            ))}
            {!data.analytics.topTrees.length ? <li className="text-text-secondary">No events yet</li> : null}
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Most failed searches</h3>
          <ul className="mt-ds-3 space-y-ds-2 text-sm">
            {data.analytics.failedSearches.map((item) => (
              <li key={item.query} className="flex justify-between gap-ds-3">
                <span>{item.query}</span>
                <Badge>{item.count}</Badge>
              </li>
            ))}
            {!data.analytics.failedSearches.length ? <li className="text-text-secondary">No failed searches yet</li> : null}
          </ul>
        </Card>
        <Card className="p-ds-4">
          <h3 className="font-semibold">Support requests from help flow</h3>
          <p className="mt-ds-3 text-3xl font-bold">{data.analytics.supportTicketsGenerated}</p>
          <p className="mt-ds-1 text-sm text-text-secondary">Tracked via guided troubleshooting submissions</p>
        </Card>
      </div>

      <Card className="p-ds-4">
        <h3 className="font-semibold">Auto-documentation requirements</h3>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Features cannot be marked complete without Help Center coverage.
        </p>
        <ul className="mt-ds-4 space-y-ds-3">
          {data.incompleteDocs.length ? (
            data.incompleteDocs.map((item) => (
              <li key={item.featureId} className="rounded-ds-lg border border-border px-ds-4 py-ds-3 text-sm">
                <p className="font-medium">{item.featureName}</p>
                <p className="text-text-secondary">Topic: {item.requiredTopicSlug}</p>
              </li>
            ))
          ) : (
            <li className="text-sm text-text-secondary">All registered features have baseline help documentation.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
