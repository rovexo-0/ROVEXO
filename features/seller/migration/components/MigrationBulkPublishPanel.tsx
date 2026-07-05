"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useMigrationPublishPoll } from "@/features/seller/migration/hooks/use-migration-publish-poll";
import { IMPORT_WIZARD_PATH } from "@/lib/seller/migration/config";
import type { MigrationJob, PublishAction } from "@/lib/seller/migration/types";

type MigrationBulkPublishPanelProps = {
  job: MigrationJob;
  onJobUpdate?: (job: MigrationJob) => void;
  compact?: boolean;
};

function formatEta(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return "Calculating…";
  if (seconds < 60) return `~${seconds}s`;
  return `~${Math.ceil(seconds / 60)} min`;
}

export function MigrationBulkPublishPanel({
  job,
  onJobUpdate,
  compact = false,
}: MigrationBulkPublishPanelProps) {
  const [localJob, setLocalJob] = useState(job);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(
    localJob.publishStatus === "queued" || localJob.publishStatus === "publishing",
  );

  const handleUpdate = useCallback(
    (next: MigrationJob) => {
      setLocalJob(next);
      onJobUpdate?.(next);
    },
    [onJobUpdate],
  );

  const handleComplete = useCallback(
    (next: MigrationJob) => {
      setLocalJob(next);
      setIsPolling(false);
      onJobUpdate?.(next);
    },
    [onJobUpdate],
  );

  useMigrationPublishPoll({
    jobId: localJob.id,
    enabled: isPolling,
    onUpdate: handleUpdate,
    onComplete: handleComplete,
  });

  const progress = localJob.publishProgress;
  const finalReport = localJob.publishReport;
  const importReport = localJob.report;
  const isPublishing =
    localJob.publishStatus === "queued" || localJob.publishStatus === "publishing";

  const runAction = async (action: PublishAction, extra?: Record<string, unknown>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/seller/migration/${localJob.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Publish action failed.");
      }
      const payload = (await response.json()) as { job: MigrationJob };
      setLocalJob(payload.job);
      onJobUpdate?.(payload.job);
      if (
        payload.job.publishStatus === "queued" ||
        payload.job.publishStatus === "publishing"
      ) {
        setIsPolling(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish action failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-ds-4">
      {!compact ? (
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Bulk publish</h3>
          <p className="mt-ds-1 text-xs text-text-secondary">
            Validate and publish imported listings. Processing continues in the background if you
            leave this page.
          </p>
        </div>
      ) : null}

      {error ? (
        <Card padding="sm" className="border-error/30 bg-error/5" role="alert">
          <p className="text-sm text-error">{error}</p>
        </Card>
      ) : null}

      {isPublishing && progress ? (
        <Card padding="md" className="border-primary/20">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium capitalize text-text-primary">
              {localJob.publishStatus.replace("_", " ")}
            </span>
            <span className="text-text-secondary">{formatEta(progress.etaSeconds)}</span>
          </div>
          <div
            className="mt-ds-3 h-2 overflow-hidden rounded-ds-full bg-surface"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.progressPercent}
          >
            <div
              className="h-full rounded-ds-full bg-primary transition-[width] duration-500"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
          <dl className="mt-ds-3 grid grid-cols-2 gap-ds-2 text-xs sm:grid-cols-4">
            <MiniStat label="Validated" value={progress.validated} />
            <MiniStat label="Images" value={progress.imagesProcessed} />
            <MiniStat label="Categories" value={progress.categoriesMapped} />
            <MiniStat label="Published" value={progress.published} />
            <MiniStat label="Skipped" value={progress.skipped} />
            <MiniStat label="Errors" value={progress.errors} />
            <MiniStat label="Speed/min" value={progress.speedPerMinute} />
            <MiniStat label="Remaining" value={progress.remaining} />
          </dl>
        </Card>
      ) : null}

      {finalReport && localJob.publishStatus === "completed" ? (
        <Card padding="md" className="border-success/30 bg-success/5">
          <p className="text-sm font-semibold text-success">Publishing complete</p>
          <dl className="mt-ds-3 grid grid-cols-2 gap-ds-2 text-xs sm:grid-cols-4">
            <MiniStat label="Published" value={finalReport.published} />
            <MiniStat label="Drafts" value={finalReport.drafts} />
            <MiniStat label="Skipped" value={finalReport.skipped} />
            <MiniStat label="Success rate" value={`${finalReport.successRate}%`} />
          </dl>
        </Card>
      ) : importReport && localJob.publishStatus === "idle" ? (
        <Card padding="md" className="border-border">
          <dl className="grid grid-cols-2 gap-ds-2 text-xs sm:grid-cols-4">
            <MiniStat label="Imported" value={importReport.imported} />
            <MiniStat label="Warnings" value={importReport.warnings} />
            <MiniStat label="Duplicates" value={importReport.duplicates} />
            <MiniStat label="Errors" value={importReport.errors} />
          </dl>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-ds-2">
        <Button
          size="sm"
          disabled={isSubmitting || isPublishing}
          onClick={() => void runAction("publish_all")}
        >
          Publish all
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isSubmitting || isPublishing}
          onClick={() => void runAction("save_all_draft")}
        >
          Save all as draft
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isSubmitting || isPublishing}
          onClick={() => void runAction("retry_failed")}
        >
          Retry failed
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => void runAction("cancel_pending")}
        >
          Cancel pending
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => void runAction("delete_drafts")}
        >
          Delete drafts
        </Button>
      </div>

      <div className="flex flex-wrap gap-ds-2">
        <a
          href={`/api/seller/migration/${localJob.id}/report.csv`}
          className="text-xs font-medium text-primary underline"
        >
          Download CSV report
        </a>
        <a
          href={`/api/seller/migration/${localJob.id}/report.json`}
          className="text-xs font-medium text-primary underline"
        >
          Download JSON report
        </a>
        {!compact ? (
          <Link
            href={`${IMPORT_WIZARD_PATH}?job=${encodeURIComponent(localJob.id)}`}
            className="text-xs font-medium text-primary underline"
          >
            Review items &amp; categories
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt className="text-text-secondary">{label}</dt>
      <dd className="font-semibold text-text-primary">{value}</dd>
    </div>
  );
}
