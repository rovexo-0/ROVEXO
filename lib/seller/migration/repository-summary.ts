import { listMigrationJobsForSeller } from "@/lib/seller/migration/repository";
import { countMigrationItemsByPublishStatus } from "@/lib/seller/migration/repository-items";
import type { SellerMigrationSummary } from "@/lib/seller/migration/types";

export async function getSellerMigrationSummary(sellerId: string): Promise<SellerMigrationSummary> {
  const jobs = await listMigrationJobsForSeller(sellerId);
  const latest = jobs[0] ?? null;

  let failedPublishCount = 0;
  if (latest?.id && latest.publishStatus === "failed") {
    const counts = await countMigrationItemsByPublishStatus(sellerId, latest.id);
    failedPublishCount = counts.failed ?? 0;
  }

  return {
    recentJobs: jobs.slice(0, 5).map((job) => ({
      id: job.id,
      platform: job.platform,
      status: job.status,
      publishStatus: job.publishStatus,
      imported: job.report?.imported ?? job.stats.imported,
      published: job.publishReport?.published ?? job.report?.published ?? 0,
      warnings: job.report?.warnings ?? job.stats.warnings,
      createdAt: job.createdAt,
    })),
    latestImportStatus: latest?.status ?? null,
    lastPublishStatus: latest?.publishStatus ?? null,
    failedPublishCount,
  };
}
