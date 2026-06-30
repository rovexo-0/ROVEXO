"use client";

import { useCallback, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  PRODUCTION_ASSET_SECTION_LABELS,
  type ProductionAssetValidationReport,
} from "@/lib/super-admin/production-assets/types";

type ProductionAssetValidatorPanelProps = {
  initialReport: ProductionAssetValidationReport;
};

type ActionKind = "validate" | "rebuild" | "deploy";

export function ProductionAssetValidatorPanel({
  initialReport,
}: ProductionAssetValidatorPanelProps) {
  const [report, setReport] = useState(initialReport);
  const [output, setOutput] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runAction = useCallback((action: ActionKind) => {
    startTransition(async () => {
      setMessage(null);
      setOutput(null);
      try {
        const response = await fetch("/api/super-admin/production-assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          message: string;
          output?: string;
          report?: ProductionAssetValidationReport;
        };
        if (data.report) setReport(data.report);
        setMessage(data.message);
        setOutput(data.output ?? null);
      } catch {
        setMessage("Validation request failed.");
      }
    });
  }, []);

  const summaryCards = [
    { label: "Total Assets", value: report.summary.totalAssets },
    { label: "Premium Assets", value: report.summary.premiumAssets },
    { label: "Placeholder Assets", value: report.summary.placeholderAssets },
    { label: "Missing Assets", value: report.summary.missingAssets },
    { label: "Broken Assets", value: report.summary.brokenAssets },
    { label: "Stale Assets", value: report.summary.staleAssets },
  ];

  return (
    <div className="space-y-ds-6">
      <div className="grid gap-ds-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="rx-surface-card rounded-ds-xl p-ds-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{card.label}</p>
            <p className="mt-ds-2 text-3xl font-bold tracking-tight text-text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-ds-4 lg:grid-cols-2">
        <div className="rx-surface-card rounded-ds-xl p-ds-5">
          <h2 className="text-sm font-semibold text-text-primary">Image Formats</h2>
          <dl className="mt-ds-4 grid grid-cols-2 gap-ds-3 text-sm">
            <div>
              <dt className="text-text-muted">AVIF</dt>
              <dd className="font-semibold text-text-primary">{report.formats.avif}</dd>
            </div>
            <div>
              <dt className="text-text-muted">WebP</dt>
              <dd className="font-semibold text-text-primary">{report.formats.webp}</dd>
            </div>
            <div>
              <dt className="text-text-muted">PNG</dt>
              <dd className="font-semibold text-text-primary">{report.formats.png}</dd>
            </div>
            <div>
              <dt className="text-text-muted">SVG (blocked)</dt>
              <dd className={cn("font-semibold", report.formats.svg > 0 ? "text-destructive" : "text-text-primary")}>
                {report.formats.svg}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rx-surface-card rounded-ds-xl p-ds-5">
          <h2 className="text-sm font-semibold text-text-primary">Deployment Status</h2>
          <dl className="mt-ds-4 space-y-ds-3 text-sm">
            <div className="flex items-center justify-between gap-ds-3">
              <dt className="text-text-muted">Validation Status</dt>
              <dd
                className={cn(
                  "rounded-ds-full px-ds-3 py-ds-1 text-xs font-semibold uppercase tracking-wide",
                  report.deploymentReady ? "bg-emerald-500/15 text-emerald-700" : "bg-destructive/15 text-destructive",
                )}
              >
                {report.status}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-ds-3">
              <dt className="text-text-muted">Responsive Categories</dt>
              <dd className="font-medium text-text-primary">{report.responsiveImages.category ? "Complete" : "Incomplete"}</dd>
            </div>
            <div className="flex items-center justify-between gap-ds-3">
              <dt className="text-text-muted">Responsive Hero</dt>
              <dd className="font-medium text-text-primary">{report.responsiveImages.hero ? "Complete" : "Incomplete"}</dd>
            </div>
            <div className="flex items-center justify-between gap-ds-3">
              <dt className="text-text-muted">Deployment Ready</dt>
              <dd className="font-medium text-text-primary">{report.deploymentReady ? "Yes" : "No"}</dd>
            </div>
            <div className="flex items-center justify-between gap-ds-3">
              <dt className="text-text-muted">Last Validation</dt>
              <dd className="font-medium text-text-primary">{new Date(report.validatedAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex flex-wrap gap-ds-3">
        <Button disabled={isPending} onClick={() => runAction("validate")}>
          Run Validation
        </Button>
        <Button variant="secondary" disabled={isPending} onClick={() => runAction("rebuild")}>
          Rebuild Assets
        </Button>
        <Button variant="secondary" disabled={isPending || !report.deploymentReady} onClick={() => runAction("deploy")}>
          Deploy Approved Assets
        </Button>
      </div>

      {message ? (
        <p
          className={cn(
            "rounded-ds-lg px-ds-4 py-ds-3 text-sm",
            report.deploymentReady ? "bg-emerald-500/10 text-emerald-800" : "bg-destructive/10 text-destructive",
          )}
        >
          {message}
        </p>
      ) : null}

      <div className="rx-surface-card overflow-hidden rounded-ds-xl">
        <div className="border-b border-border px-ds-5 py-ds-4">
          <h2 className="text-sm font-semibold text-text-primary">Validation Sections</h2>
        </div>
        <ul className="divide-y divide-border">
          {Object.entries(PRODUCTION_ASSET_SECTION_LABELS).map(([key, label]) => {
            const section = report.sections[key as keyof typeof report.sections];
            return (
              <li key={key} className="flex items-center justify-between gap-ds-4 px-ds-5 py-ds-3 text-sm">
                <span className="text-text-primary">{label}</span>
                <span className="flex items-center gap-ds-3">
                  <span className="text-text-muted">{section.assetCount} assets</span>
                  <span
                    className={cn(
                      "rounded-ds-full px-ds-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                      section.status === "passed" && "bg-emerald-500/15 text-emerald-700",
                      section.status === "failed" && "bg-destructive/15 text-destructive",
                      section.status === "skipped" && "bg-surface-muted text-text-muted",
                    )}
                  >
                    {section.status}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {report.issues.length > 0 ? (
        <div className="rx-surface-card overflow-hidden rounded-ds-xl">
          <div className="border-b border-border px-ds-5 py-ds-4">
            <h2 className="text-sm font-semibold text-destructive">Blocking Issues ({report.issues.length})</h2>
          </div>
          <ul className="max-h-96 divide-y divide-border overflow-y-auto">
            {report.issues.map((issue) => (
              <li key={`${issue.code}-${issue.path}`} className="px-ds-5 py-ds-3 text-sm">
                <p className="font-medium text-text-primary">{issue.path}</p>
                <p className="mt-ds-1 text-text-secondary">{issue.message}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {output ? (
        <pre className="overflow-x-auto rounded-ds-xl bg-surface-muted p-ds-4 text-xs text-text-secondary">{output}</pre>
      ) : null}
    </div>
  );
}
