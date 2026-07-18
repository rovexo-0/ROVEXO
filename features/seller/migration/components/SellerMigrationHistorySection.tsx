import { MIGRATION_CENTER_PATH } from "@/lib/seller/migration/config";
import type { SellerMigrationSummary } from "@/lib/seller/migration/types";
import { CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";

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
    <CanonicalSection title="Recent migrations">
      <CanonicalCard variant="list">
        <CanonicalMenuRow
          title="New migration"
          description={
            summary.latestImportStatus
              ? `Latest: ${statusLabel(summary.latestImportStatus)}`
              : "Start a new import"
          }
          href={MIGRATION_CENTER_PATH}
        />
        {summary.recentJobs.map((job) => {
          const isActive = job.status === "processing" || job.status === "queued";
          const actionLabel =
            job.publishStatus === "failed"
              ? "Retry"
              : isActive
                ? "Resume"
                : "Open";
          return (
            <CanonicalMenuRow
              key={job.id}
              title={job.platform.replace(/_/g, " ")}
              description={`${job.imported} imported · ${job.published} published${
                job.warnings > 0 ? ` · ${job.warnings} warnings` : ""
              }`}
              value={actionLabel}
              href={`${MIGRATION_CENTER_PATH}?job=${job.id}`}
            />
          );
        })}
        {summary.failedPublishCount > 0 && latest ? (
          <CanonicalMenuRow
            title="Failed publishes"
            description={`${summary.failedPublishCount} listing${
              summary.failedPublishCount === 1 ? "" : "s"
            } need review`}
            href={`${MIGRATION_CENTER_PATH}?job=${latest.id}`}
            value="Review"
          />
        ) : null}
      </CanonicalCard>
    </CanonicalSection>
  );
}
