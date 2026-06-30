import type { MigrationJob, MigrationQueueItem, MigrationFinalReport } from "@/lib/seller/migration/types";

export function buildCsvReport(job: MigrationJob, items: MigrationQueueItem[]): string {
  const header = [
    "item_index",
    "title",
    "price",
    "validation_status",
    "publish_status",
    "duplicate_action",
    "product_id",
    "warnings",
    "errors",
  ].join(",");

  const rows = items.map((item) =>
    [
      item.itemIndex,
      `"${item.title.replace(/"/g, '""')}"`,
      item.price,
      item.validationStatus,
      item.publishStatus,
      item.duplicateAction ?? "",
      item.productId ?? "",
      `"${item.warnings.join("; ").replace(/"/g, '""')}"`,
      `"${item.validationErrors.map((e) => e.message).join("; ").replace(/"/g, '""')}"`,
    ].join(","),
  );

  const report = job.publishReport ?? job.report;
  const summary = [
    "",
    "summary",
    `platform,${job.platform}`,
    `imported,${report?.imported ?? 0}`,
    `published,${report?.published ?? 0}`,
    `drafts,${(report as MigrationFinalReport)?.drafts ?? 0}`,
    `skipped,${report?.skipped ?? 0}`,
    `duplicates,${report?.duplicates ?? 0}`,
    `warnings,${report?.warnings ?? 0}`,
    `errors,${report?.errors ?? 0}`,
    `success_rate,${(report as MigrationFinalReport)?.successRate ?? 0}`,
  ].join("\n");

  return [header, ...rows, summary].join("\n");
}

export function buildJsonReport(job: MigrationJob, items: MigrationQueueItem[]) {
  return {
    job: {
      id: job.id,
      platform: job.platform,
      importMethod: job.importMethod,
      status: job.status,
      publishStatus: job.publishStatus,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    },
    importReport: job.report,
    publishReport: job.publishReport,
    publishProgress: job.publishProgress,
    items: items.map((item) => ({
      itemIndex: item.itemIndex,
      title: item.title,
      price: item.price,
      validationStatus: item.validationStatus,
      validationErrors: item.validationErrors,
      publishStatus: item.publishStatus,
      duplicateAction: item.duplicateAction,
      productId: item.productId,
      suggestedCategorySlug: item.suggestedCategorySlug,
      warnings: item.warnings,
    })),
  };
}
