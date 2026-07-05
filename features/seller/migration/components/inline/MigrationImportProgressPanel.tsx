"use client";

import type { MigrationJob } from "@/lib/seller/migration/types";

type MigrationImportProgressPanelProps = {
  job: MigrationJob | null;
  isSubmitting: boolean;
  platformLabel: string;
};

function formatEta(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return "Calculating…";
  if (seconds < 60) return `~${seconds}s remaining`;
  const minutes = Math.ceil(seconds / 60);
  return `~${minutes} min remaining`;
}

export function MigrationImportProgressPanel({
  job,
  isSubmitting,
  platformLabel,
}: MigrationImportProgressPanelProps) {
  const live = job?.progress;
  const progress = job?.progressPercent ?? (isSubmitting ? 15 : 0);
  const status = job?.status ?? (isSubmitting ? "processing" : "queued");
  const report = job?.report;

  return (
    <div className="byi-progress">
      <div>
        <h2 className="byi-section-title">Import in progress</h2>
        <p className="byi-section-subtitle">
          Importing your {platformLabel} catalogue inline. Progress updates automatically.
        </p>
      </div>

      <div className="byi-connect-card">
        <div className="flex items-center justify-between gap-ds-2 text-sm">
          <span className="font-medium capitalize text-text-primary">{status.replace("_", " ")}</span>
          <span className="text-text-secondary">{formatEta(live?.etaSeconds ?? job?.estimatedSeconds)}</span>
        </div>

        <div
          className="byi-progress__bar mt-ds-3"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Import progress"
        >
          <div className="byi-progress__fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-ds-2 text-right text-xs font-semibold text-text-secondary">{progress}%</p>

        <dl className="byi-stat-grid mt-ds-4">
          <Stat label="Imported" value={live?.imported ?? job?.stats.imported ?? 0} />
          <Stat label="Skipped" value={report?.skipped ?? 0} />
          <Stat label="Duplicates" value={report?.duplicates ?? 0} />
          <Stat label="Failed" value={report?.errors ?? 0} />
          <Stat label="Remaining" value={live?.remaining ?? 0} />
          <Stat label="Images" value={live?.images ?? 0} />
          <Stat label="Listings found" value={live?.listingsFound ?? job?.itemsTotal ?? 0} />
          <Stat
            label="Batch"
            value={`${live?.currentBatch ?? job?.currentBatch ?? 0}/${live?.totalBatches ?? job?.totalBatches ?? 0}`}
            text
          />
          <Stat label="Completed" value={live?.completed ?? 0} />
        </dl>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  text = false,
}: {
  label: string;
  value: number | string;
  text?: boolean;
}) {
  return (
    <div>
      <dt className="byi-stat__label">{label}</dt>
      <dd className={`byi-stat__value ${text ? "text-sm" : ""}`}>{value}</dd>
    </div>
  );
}
