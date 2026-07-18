"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { MigrationBulkPublishPanel } from "@/features/seller/migration/components/MigrationBulkPublishPanel";
import { MigrationImportProgressPanel } from "@/features/seller/migration/components/inline/MigrationImportProgressPanel";
import { MigrationItemReviewPanel } from "@/features/seller/migration/components/inline/MigrationItemReviewPanel";
import { MigrationReportStep } from "@/features/seller/migration/components/steps/MigrationReportStep";
import { resolveImportErrorRecovery } from "@/lib/bring-your-item/import-errors";
import type { MigrationJob, MigrationQueueItem } from "@/lib/seller/migration/types";

type MigrationImportStepProps = {
  job: MigrationJob | null;
  jobId: string | null;
  queueItems: MigrationQueueItem[];
  onQueueItemsChange: (items: MigrationQueueItem[]) => void;
  isSubmitting: boolean;
  isPolling: boolean;
  platformLabel: string;
  importComplete: boolean;
  importFailed: boolean;
  onStartAnother: () => void;
  onRetry: () => void;
  onCancel: () => void;
};

export function MigrationImportStep({
  job,
  jobId,
  queueItems,
  onQueueItemsChange,
  isSubmitting,
  isPolling,
  platformLabel,
  importComplete,
  importFailed,
  onStartAnother,
  onRetry,
  onCancel,
}: MigrationImportStepProps) {
  useEffect(() => {
    if (!importComplete || !jobId || queueItems.length > 0) return;
    void fetch(`/api/seller/migration/${jobId}/items`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { items?: MigrationQueueItem[] } | null) => {
        if (payload?.items) onQueueItemsChange(payload.items);
      })
      .catch(() => undefined);
  }, [importComplete, jobId, onQueueItemsChange, queueItems.length]);

  if (importComplete && job) {
    return (
      <div className="byi-panel__body flex flex-col gap-ds-4">
        <MigrationReportStep job={job} onStartAnother={onStartAnother} />
        <MigrationItemReviewPanel
          jobId={job.id}
          items={queueItems}
          onItemsChange={onQueueItemsChange}
        />
        <MigrationBulkPublishPanel job={job} compact />
      </div>
    );
  }

  const failure = importFailed ? resolveImportErrorRecovery(job?.errorMessage ?? "Import failed.") : null;

  return (
    <div className="byi-panel__body flex flex-col gap-ds-4">
      <MigrationImportProgressPanel
        job={job}
        isSubmitting={isSubmitting || isPolling}
        platformLabel={platformLabel}
      />
      {importFailed && failure ? (
        <div className="byi-alert" role="alert">
          <p className="byi-alert__title">{failure.title}</p>
          <p className="byi-alert__message">{failure.message}</p>
          <div className="byi-actions mt-ds-3">
            {failure.canRetry ? (
              <Button fullWidth onClick={() => void onRetry()}>
                Retry import
              </Button>
            ) : null}
            {failure.canCancel ? (
              <Button fullWidth variant="outline" onClick={() => void onCancel()}>
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      ) : isPolling || isSubmitting ? (
        <Button fullWidth variant="outline" onClick={() => void onCancel()}>
          Cancel import
        </Button>
      ) : null}
    </div>
  );
}
