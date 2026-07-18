"use client";

import { useCallback, useState } from "react";
import { CanonicalButton, CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";
import { useMigrationPublishPoll } from "@/features/seller/migration/hooks/use-migration-publish-poll";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import type { MigrationJob, PublishAction } from "@/lib/seller/migration/types";

type MigrationBulkPublishPanelProps = {
  job: MigrationJob;
  onJobUpdate?: (job: MigrationJob) => void;
  compact?: boolean;
  /** Minimal v1.0 — single Publish action and progress only. */
  minimal?: boolean;
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
  minimal = false,
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
    <div className="flex w-full flex-col gap-ds-4">
      {!compact && !minimal ? (
        <CanonicalSection title="Bulk publish">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title="Validate and publish"
              description="Processing continues in the background if you leave."
              showChevron={false}
            />
          </CanonicalCard>
        </CanonicalSection>
      ) : null}

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {isPublishing && progress && !minimal ? (
        <CanonicalSection title="Publishing">
          <CanonicalCard variant="list">
            <CanonicalMenuRow
              title={localJob.publishStatus.replace("_", " ")}
              value={formatEta(progress.etaSeconds)}
              showChevron={false}
            />
            <CanonicalMenuRow title="Progress" value={`${progress.progressPercent}%`} showChevron={false} />
            <CanonicalMenuRow title="Published" value={String(progress.published)} showChevron={false} />
            <CanonicalMenuRow title="Errors" value={String(progress.errors)} showChevron={false} />
            <CanonicalMenuRow title="Remaining" value={String(progress.remaining)} showChevron={false} />
          </CanonicalCard>
        </CanonicalSection>
      ) : null}

      {finalReport && localJob.publishStatus === "completed" && !minimal ? (
        <CanonicalSection title="Complete">
          <CanonicalCard variant="list">
            <CanonicalMenuRow title="Published" value={String(finalReport.published)} showChevron={false} />
            <CanonicalMenuRow title="Drafts" value={String(finalReport.drafts)} showChevron={false} />
            <CanonicalMenuRow title="Skipped" value={String(finalReport.skipped)} showChevron={false} />
            <CanonicalMenuRow
              title="Success rate"
              value={`${finalReport.successRate}%`}
              showChevron={false}
            />
          </CanonicalCard>
        </CanonicalSection>
      ) : importReport && localJob.publishStatus === "idle" && !minimal ? (
        <CanonicalSection title="Import summary">
          <CanonicalCard variant="list">
            <CanonicalMenuRow title="Imported" value={String(importReport.imported)} showChevron={false} />
            <CanonicalMenuRow title="Warnings" value={String(importReport.warnings)} showChevron={false} />
            <CanonicalMenuRow title="Duplicates" value={String(importReport.duplicates)} showChevron={false} />
            <CanonicalMenuRow title="Errors" value={String(importReport.errors)} showChevron={false} />
          </CanonicalCard>
        </CanonicalSection>
      ) : null}

      {minimal ? (
        <CanonicalButton
          variant="primary"
          fullWidth
          disabled={isSubmitting || isPublishing || localJob.publishStatus === "completed"}
          onClick={() => void runAction("publish_all")}
        >
          {isPublishing ? "Publishing…" : localJob.publishStatus === "completed" ? "Published" : "Publish"}
        </CanonicalButton>
      ) : (
        <div className="flex w-full flex-col gap-ds-2">
          <CanonicalButton
            variant="primary"
            fullWidth
            disabled={isSubmitting || isPublishing}
            onClick={() => void runAction("publish_all")}
          >
            Publish all
          </CanonicalButton>
          <CanonicalButton
            variant="secondary"
            fullWidth
            disabled={isSubmitting || isPublishing}
            onClick={() => void runAction("save_all_draft")}
          >
            Save all as draft
          </CanonicalButton>
          <CanonicalButton
            variant="secondary"
            fullWidth
            disabled={isSubmitting || isPublishing}
            onClick={() => void runAction("retry_failed")}
          >
            Retry failed
          </CanonicalButton>
          <CanonicalButton
            variant="ghost"
            fullWidth
            disabled={isSubmitting}
            onClick={() => void runAction("cancel_pending")}
          >
            Cancel pending
          </CanonicalButton>
          <CanonicalButton
            variant="ghost"
            fullWidth
            disabled={isSubmitting}
            onClick={() => void runAction("delete_drafts")}
          >
            Delete drafts
          </CanonicalButton>
        </div>
      )}

      {!minimal ? (
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            title="CSV report"
            href={`/api/seller/migration/${localJob.id}/report.csv`}
          />
          <CanonicalMenuRow
            title="JSON report"
            href={`/api/seller/migration/${localJob.id}/report.json`}
          />
          {!compact ? (
            <CanonicalMenuRow
              title="Review items"
              description="Categories and listings"
              href={`${BRING_YOUR_ITEM_PATH}?job=${encodeURIComponent(localJob.id)}`}
            />
          ) : null}
        </CanonicalCard>
      ) : null}
    </div>
  );
}
