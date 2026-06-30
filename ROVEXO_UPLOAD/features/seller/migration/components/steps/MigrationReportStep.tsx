"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MigrationBulkPublishPanel } from "@/features/seller/migration/components/MigrationBulkPublishPanel";
import type { MigrationJob } from "@/lib/seller/migration/types";

type MigrationReportStepProps = {
  job: MigrationJob | null;
  onStartAnother: () => void;
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

export function MigrationReportStep({ job, onStartAnother }: MigrationReportStepProps) {
  const report = job?.report;
  const stats = job?.stats ?? { imported: 0, ready: 0, warnings: 0, completed: 0 };

  return (
    <div className="flex flex-col gap-ds-4">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Import report</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Your migration job finished. Review the summary before publishing listings.
        </p>
      </div>

      <Card padding="lg" className="border-success/30 bg-success/5">
        <p className="text-sm font-semibold text-success">Migration completed</p>
        {report?.durationSeconds ? (
          <p className="mt-ds-1 text-xs text-text-secondary">
            Duration: {formatDuration(report.durationSeconds)}
          </p>
        ) : null}
        <dl className="mt-ds-4 grid grid-cols-2 gap-ds-3 sm:grid-cols-4">
          <ReportStat label="Imported" value={report?.imported ?? stats.imported} />
          <ReportStat label="Published" value={report?.published ?? stats.completed} highlight />
          <ReportStat label="Skipped" value={report?.skipped ?? 0} />
          <ReportStat label="Duplicates" value={report?.duplicates ?? 0} warn={(report?.duplicates ?? 0) > 0} />
          <ReportStat label="Warnings" value={report?.warnings ?? stats.warnings} warn={(report?.warnings ?? 0) > 0} />
          <ReportStat label="Errors" value={report?.errors ?? 0} warn={(report?.errors ?? 0) > 0} />
          <ReportStat label="Images" value={report?.images ?? 0} />
          <ReportStat label="Ready" value={stats.ready} highlight />
        </dl>
      </Card>

      {job?.status === "completed" && job ? (
        <Card padding="lg" className="">
          <MigrationBulkPublishPanel job={job} compact />
        </Card>
      ) : null}

      <div className="flex flex-col gap-ds-2 sm:flex-row">
        <Link href="/seller/listings?filter=draft" className="flex-1">
          <Button fullWidth variant="primary">
            Review draft listings
          </Button>
        </Link>
        <Button fullWidth variant="outline" onClick={onStartAnother}>
          Start another migration
        </Button>
      </div>
    </div>
  );
}

function ReportStat({
  label,
  value,
  highlight = false,
  warn = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd
        className={
          warn
            ? "mt-ds-1 text-2xl font-bold text-warning"
            : highlight
              ? "mt-ds-1 text-2xl font-bold text-primary"
              : "mt-ds-1 text-2xl font-bold text-text-primary"
        }
      >
        {value}
      </dd>
    </div>
  );
}
