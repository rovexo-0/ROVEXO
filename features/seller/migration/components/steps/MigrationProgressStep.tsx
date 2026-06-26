"use client";

import { Card } from "@/components/ui/Card";
import type { MigrationJob } from "@/lib/seller/migration/types";

type MigrationProgressStepProps = {
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

export function MigrationProgressStep({ job, isSubmitting, platformLabel }: MigrationProgressStepProps) {
  const live = job?.progress;
  const progress = job?.progressPercent ?? (isSubmitting ? 15 : 0);
  const status = job?.status ?? (isSubmitting ? "processing" : "queued");

  return (
    <div className="flex flex-col gap-ds-4">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Migration in progress</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Importing your {platformLabel} catalogue into ROVEXO. You can leave this page — migration
          continues in the background.
        </p>
      </div>

      <Card padding="lg" className="">
        <div className="flex items-center justify-between gap-ds-2 text-sm">
          <span className="font-medium capitalize text-text-primary">{status.replace("_", " ")}</span>
          <span className="text-text-secondary">
            {formatEta(live?.etaSeconds ?? job?.estimatedSeconds)}
          </span>
        </div>

        <div
          className="mt-ds-3 h-3 overflow-hidden rounded-ds-full bg-surface"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Migration progress"
        >
          <div
            className="h-full rounded-ds-full bg-primary transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-ds-2 text-right text-xs font-semibold text-text-secondary">{progress}%</p>

        <dl className="mt-ds-4 grid grid-cols-2 gap-ds-3 text-sm sm:grid-cols-3">
          <Stat label="Listings found" value={live?.listingsFound ?? job?.itemsTotal ?? 0} />
          <Stat label="Imported" value={live?.imported ?? job?.stats.imported ?? 0} />
          <Stat label="Images" value={live?.images ?? 0} />
          <Stat label="Categories" value={live?.categories ?? 0} />
          <Stat label="Publishing" value={live?.publishing ?? 0} />
          <Stat label="Remaining" value={live?.remaining ?? 0} />
          <Stat label="Speed / min" value={live?.speedPerMinute ?? 0} />
          <Stat label="Batch" value={`${live?.currentBatch ?? job?.currentBatch ?? 0}/${live?.totalBatches ?? job?.totalBatches ?? 0}`} text />
          <Stat label="Completed" value={live?.completed ?? 0} />
        </dl>
      </Card>
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
      <dt className="text-text-secondary">{label}</dt>
      <dd className={`mt-ds-1 font-bold text-text-primary ${text ? "text-sm" : "text-lg"}`}>{value}</dd>
    </div>
  );
}
