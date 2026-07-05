import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MIGRATION_CENTER_PATH } from "@/lib/seller/migration/config";
import type { SellerMigrationSummary } from "@/lib/seller/migration/types";

type SellerMigrationHistorySectionProps = {
  summary: SellerMigrationSummary;
};

function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export function SellerMigrationHistorySection({ summary }: SellerMigrationHistorySectionProps) {
  if (!summary.recentJobs.length) return null;

  const latest = summary.recentJobs[0];

  return (
    <Card padding="lg" className="border-border">
      <div className="flex items-start justify-between gap-ds-3">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Recent migrations</h2>
          <p className="mt-ds-1 text-sm text-text-secondary">
            Latest import: {summary.latestImportStatus ? statusLabel(summary.latestImportStatus) : "—"}
            {" · "}
            Publish: {summary.lastPublishStatus ? statusLabel(summary.lastPublishStatus) : "—"}
          </p>
        </div>
        <Link
          href={MIGRATION_CENTER_PATH}
          className="shrink-0 text-xs font-medium text-primary underline"
        >
          New migration
        </Link>
      </div>

      <ul className="mt-ds-4 flex flex-col gap-ds-2">
        {summary.recentJobs.map((job) => (
          <li
            key={job.id}
            className="flex flex-wrap items-center justify-between gap-ds-2 rounded-ds-md border border-border px-ds-3 py-ds-2 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium capitalize text-text-primary">
                {job.platform.replace(/_/g, " ")}
              </p>
              <p className="text-xs text-text-secondary">
                {job.imported} imported · {job.published} published
                {job.warnings > 0 ? ` · ${job.warnings} warnings` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-ds-2">
              {(job.status === "processing" || job.status === "queued") ? (
                <Link href={`${MIGRATION_CENTER_PATH}?job=${job.id}`}>
                  <Button size="sm" variant="primary">
                    Resume import
                  </Button>
                </Link>
              ) : null}
              <Link href={`${MIGRATION_CENTER_PATH}?job=${job.id}`}>
                <Button size="sm" variant="outline">
                  Open import
                </Button>
              </Link>
              {job.publishStatus === "failed" ? (
                <Link href={`${MIGRATION_CENTER_PATH}?job=${job.id}`}>
                  <Button size="sm">Retry failed</Button>
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {summary.failedPublishCount > 0 && latest ? (
        <p className="mt-ds-3 text-xs text-warning">
          {summary.failedPublishCount} listing{summary.failedPublishCount === 1 ? "" : "s"} failed to
          publish.{" "}
          <Link href={`${MIGRATION_CENTER_PATH}?job=${latest.id}`} className="underline">
            Review and retry
          </Link>
        </p>
      ) : null}
    </Card>
  );
}
