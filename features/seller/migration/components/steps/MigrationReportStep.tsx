"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
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
        <h2 className="byi-section-title">Import complete</h2>
        <p className="byi-section-subtitle">
          Duplicate detection and validation finished. Review, publish, or start another import inline.
        </p>
      </div>

      <div className="byi-connect-card byi-report-success">
        <p className="text-sm font-semibold text-success">Import succeeded</p>
        {report?.durationSeconds ? (
          <p className="mt-ds-1 text-xs text-text-secondary">
            Duration: {formatDuration(report.durationSeconds)}
          </p>
        ) : null}
        <dl className="byi-stat-grid mt-ds-4 sm:grid-cols-4">
          <ReportStat label="Imported" value={report?.imported ?? stats.imported} />
          <ReportStat label="Published" value={report?.published ?? stats.completed} highlight />
          <ReportStat label="Skipped" value={report?.skipped ?? 0} />
          <ReportStat label="Duplicates" value={report?.duplicates ?? 0} warn={(report?.duplicates ?? 0) > 0} />
          <ReportStat label="Warnings" value={report?.warnings ?? stats.warnings} warn={(report?.warnings ?? 0) > 0} />
          <ReportStat label="Failed" value={report?.errors ?? 0} warn={(report?.errors ?? 0) > 0} />
          <ReportStat label="Images" value={report?.images ?? 0} />
          <ReportStat label="Ready" value={stats.ready} highlight />
        </dl>
      </div>

      <div className="byi-actions">
        <Link href="/seller/listings?filter=draft" className="flex-1">
          <Button fullWidth variant="outline">
            Review draft listings
          </Button>
        </Link>
        <Button fullWidth variant="outline" onClick={onStartAnother}>
          Start another import
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
      <dt className="byi-stat__label">{label}</dt>
      <dd
        className={
          warn
            ? "byi-stat__value text-warning"
            : highlight
              ? "byi-stat__value text-primary"
              : "byi-stat__value"
        }
      >
        {value}
      </dd>
    </div>
  );
}
