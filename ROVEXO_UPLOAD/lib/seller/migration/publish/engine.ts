import { rememberCategoryMapping } from "@/lib/seller/migration/category/mapper";
import type { MigrationNormalizedListing } from "@/lib/seller/migration/engine/types";
import { validateMigrationImages } from "@/lib/seller/migration/publish/image-validator";
import { createMigrationListing, deleteMigrationDraftListing } from "@/lib/seller/migration/publish/listing-creator";
import { validateMigrationListing } from "@/lib/seller/migration/publish/validator";
import { PUBLISH_BATCH_SIZE } from "@/lib/seller/migration/publish/config";
import {
  getMigrationJobEngine,
  updateMigrationJobEngine,
} from "@/lib/seller/migration/repository-engine";
import {
  listMigrationItemsEngine,
  updateMigrationItemEngine,
  updateMigrationItemsBulkEngine,
} from "@/lib/seller/migration/repository-items";
import { notifyPublishingEvent } from "@/lib/seller/migration/notifications";
import type {
  MigrationFinalReport,
  MigrationJob,
  MigrationPublishProgress,
  PublishAction,
} from "@/lib/seller/migration/types";

function emptyPublishProgress(total: number): MigrationPublishProgress {
  return {
    listingsFound: total,
    imported: total,
    validated: 0,
    imagesProcessed: 0,
    categoriesMapped: 0,
    publishing: 0,
    published: 0,
    skipped: 0,
    warnings: 0,
    errors: 0,
    speedPerMinute: 0,
    remaining: total,
    etaSeconds: 0,
    progressPercent: 0,
    currentBatch: 0,
    totalBatches: Math.max(1, Math.ceil(total / PUBLISH_BATCH_SIZE)),
  };
}

function buildFinalReport(
  job: MigrationJob,
  counts: Record<string, number>,
  durationSeconds: number,
): MigrationFinalReport {
  const imported = job.report?.imported ?? job.itemsTotal;
  const published = counts.published ?? 0;
  const drafts = counts.draft ?? 0;
  const skipped = counts.skipped ?? 0;
  const errors = counts.failed ?? 0;
  const warnings = job.report?.warnings ?? 0;
  const attempted = published + drafts + skipped + errors;
  const successRate = attempted > 0 ? Math.round(((published + drafts) / attempted) * 100) : 0;

  return {
    imported,
    published,
    drafts,
    skipped,
    duplicates: job.report?.duplicates ?? 0,
    warnings,
    errors,
    images: job.report?.images ?? 0,
    categories: job.publishProgress?.categoriesMapped ?? 0,
    durationSeconds,
    processingTimeSeconds: durationSeconds,
    successRate,
  };
}

async function validateJobItems(sellerId: string, jobId: string): Promise<void> {
  const items = await listMigrationItemsEngine(sellerId, jobId, {
    publishStatus: ["pending", "failed"],
  });

  for (const item of items) {
    const normalized = item.normalizedData as MigrationNormalizedListing | null;
    if (!normalized) {
      await updateMigrationItemEngine(sellerId, item.id, {
        validation_status: "invalid",
        validation_errors: [{ field: "data", message: "Missing listing data." }],
      });
      continue;
    }

    const validation = validateMigrationListing(normalized);
    const imageCheck = validateMigrationImages(normalized.processedImages ?? []);

    const errors = [...validation.errors, ...imageCheck.errors];
    const status =
      errors.some((e) => e.field !== "general") && validation.status === "invalid"
        ? "invalid"
        : validation.status;

    await updateMigrationItemEngine(sellerId, item.id, {
      validation_status: status,
      validation_errors: errors,
      suggested_category_slug: validation.suggestedCategorySlug,
    });
  }
}

async function publishItem(
  sellerId: string,
  job: MigrationJob,
  itemId: string,
  mode: "published" | "draft",
): Promise<"published" | "draft" | "skipped" | "failed"> {
  const items = await listMigrationItemsEngine(sellerId, job.id);
  const item = items.find((row) => row.id === itemId);
  if (!item) return "failed";

  if (item.status === "skipped" || item.duplicateAction === "skip") {
    await updateMigrationItemEngine(sellerId, item.id, { publish_status: "skipped" });
    return "skipped";
  }

  if (item.validationStatus === "invalid") {
    await updateMigrationItemEngine(sellerId, item.id, { publish_status: "failed" });
    return "failed";
  }

  const normalized = item.normalizedData as MigrationNormalizedListing;
  const productId = await createMigrationListing({
    sellerId,
    listing: normalized,
    status: mode,
  });

  if (!productId) {
    await updateMigrationItemEngine(sellerId, item.id, { publish_status: "failed" });
    return "failed";
  }

  await updateMigrationItemEngine(sellerId, item.id, {
    publish_status: mode,
    product_id: productId,
  });

  return mode;
}

export async function queuePublishJob(
  sellerId: string,
  jobId: string,
  action: PublishAction,
  options?: { scheduledAt?: string; itemIds?: string[] },
): Promise<MigrationJob | null> {
  const job = await getMigrationJobEngine(sellerId, jobId);
  if (!job || job.status !== "completed") return null;

  if (action === "cancel_pending") {
    await updateMigrationItemsBulkEngine(sellerId, jobId, { publish_status: "cancelled" }, {
      publishStatus: ["pending"],
    });
    return updateMigrationJobEngine(sellerId, jobId, { publishStatus: "cancelled" });
  }

  if (action === "delete_drafts") {
    const draftItems = await listMigrationItemsEngine(sellerId, jobId, {
      publishStatus: ["draft"],
    });
    for (const item of draftItems) {
      if (item.productId) {
        await deleteMigrationDraftListing(sellerId, item.productId);
      }
      await updateMigrationItemEngine(sellerId, item.id, {
        publish_status: "cancelled",
        product_id: null,
      });
    }
    return getMigrationJobEngine(sellerId, jobId);
  }

  if (action === "schedule_publish" && options?.scheduledAt) {
    return updateMigrationJobEngine(sellerId, jobId, {
      scheduledPublishAt: options.scheduledAt,
      publishStatus: "queued",
    });
  }

  if (action === "retry_failed") {
    await updateMigrationItemsBulkEngine(
      sellerId,
      jobId,
      { publish_status: "pending", selected: true },
      { publishStatus: ["failed"] },
    );
  }

  await validateJobItems(sellerId, jobId);

  if (action === "publish_selected" && options?.itemIds?.length) {
    const allItems = await listMigrationItemsEngine(sellerId, jobId);
    for (const item of allItems) {
      await updateMigrationItemEngine(sellerId, item.id, {
        selected: options.itemIds.includes(item.id),
      });
    }
  } else if (action === "publish_all" || action === "save_all_draft") {
    await updateMigrationItemsBulkEngine(sellerId, jobId, { selected: true });
  }

  const totalItems = (await listMigrationItemsEngine(sellerId, jobId)).filter(
    (i) => i.publishStatus === "pending" || i.publishStatus === "failed",
  ).length;

  await notifyPublishingEvent(sellerId, job, "started");

  const queued = await updateMigrationJobEngine(sellerId, jobId, {
    publishStatus: "queued",
    publishBatch: 0,
    publishTotalBatches: Math.max(1, Math.ceil(totalItems / PUBLISH_BATCH_SIZE)),
    publishProgress: emptyPublishProgress(totalItems),
    autoPublish: action === "publish_all",
  });

  if (action === "save_all_draft" && queued) {
    return runPublishEngine(sellerId, jobId, 5, "draft");
  }

  return queued;
}

export async function processPublishBatch(
  sellerId: string,
  jobId: string,
  mode: "published" | "draft" = "published",
): Promise<MigrationJob | null> {
  const job = await getMigrationJobEngine(sellerId, jobId);
  if (!job) return null;
  if (job.publishStatus === "cancelled" || job.publishStatus === "completed") return job;

  if (job.scheduledPublishAt && new Date(job.scheduledPublishAt).getTime() > Date.now()) {
    return job;
  }

  const publishMode = mode;

  await updateMigrationJobEngine(sellerId, jobId, { publishStatus: "publishing" });

  const candidates = await listMigrationItemsEngine(sellerId, jobId, {
    publishStatus: ["pending", "failed"],
  });
  const selected = candidates.filter((item) => item.selected);
  const batch = selected.slice(0, PUBLISH_BATCH_SIZE);

  const counts: Record<string, number> = {};
  let validated = 0;
  let imagesProcessed = 0;
  let categoriesMapped = 0;

  for (const item of batch) {
    if (item.validationStatus === "invalid") {
      counts.failed = (counts.failed ?? 0) + 1;
      continue;
    }
    validated += 1;
    const normalized = item.normalizedData as MigrationNormalizedListing;
    imagesProcessed += normalized?.processedImages?.length ?? 0;
    if (normalized?.categorySlug) categoriesMapped += 1;

    const result = await publishItem(
      sellerId,
      job,
      item.id,
      publishMode === "draft" ? "draft" : "published",
    );
    counts[result] = (counts[result] ?? 0) + 1;
  }

  const allItems = await listMigrationItemsEngine(sellerId, jobId);
  const aggregate: Record<string, number> = {};
  for (const item of allItems) {
    aggregate[item.publishStatus] = (aggregate[item.publishStatus] ?? 0) + 1;
  }

  const remaining = (aggregate.pending ?? 0) + (aggregate.failed ?? 0);
  const published = aggregate.published ?? 0;
  const total = allItems.length;
  const processed = total - remaining;
  const isComplete = remaining === 0 || batch.length === 0;
  const startedMs = job.startedAt ? new Date(job.startedAt).getTime() : Date.now();
  const durationSeconds = Math.round((Date.now() - startedMs) / 1000);
  const speedPerMinute =
    durationSeconds > 0 ? Math.round((processed / durationSeconds) * 60) : processed;

  const publishProgress: MigrationPublishProgress = {
    listingsFound: total,
    imported: job.report?.imported ?? total,
    validated: validated + (job.publishProgress?.validated ?? 0),
    imagesProcessed: imagesProcessed + (job.publishProgress?.imagesProcessed ?? 0),
    categoriesMapped: categoriesMapped + (job.publishProgress?.categoriesMapped ?? 0),
    publishing: isComplete ? 0 : batch.length,
    published,
    skipped: aggregate.skipped ?? 0,
    warnings: job.report?.warnings ?? 0,
    errors: aggregate.failed ?? 0,
    speedPerMinute,
    remaining,
    etaSeconds: speedPerMinute > 0 ? Math.ceil((remaining / speedPerMinute) * 60) : remaining * 2,
    progressPercent: total > 0 ? Math.round((processed / total) * 100) : 100,
    currentBatch: (job.publishBatch ?? 0) + 1,
    totalBatches: job.publishTotalBatches ?? 1,
  };

  const publishReport = buildFinalReport(job, aggregate, durationSeconds);

  const updated = await updateMigrationJobEngine(sellerId, jobId, {
    publishStatus: isComplete ? "completed" : "publishing",
    publishBatch: (job.publishBatch ?? 0) + 1,
    publishProgress,
    publishReport,
  });

  if (isComplete && updated) {
    const hasWarnings = (publishReport.warnings ?? 0) > 0 || (publishReport.errors ?? 0) > 0;
    await notifyPublishingEvent(sellerId, updated, hasWarnings ? "completed_warnings" : "completed");
  }

  return updated;
}

export async function runPublishEngine(
  sellerId: string,
  jobId: string,
  maxBatches = 5,
  mode: "published" | "draft" = "published",
): Promise<MigrationJob | null> {
  let job = await getMigrationJobEngine(sellerId, jobId);
  if (!job) return null;

  if (job.publishStatus === "idle") {
    job = await queuePublishJob(
      sellerId,
      jobId,
      mode === "draft" ? "save_all_draft" : "publish_all",
    );
  }

  if (!job || job.publishStatus === "cancelled") return job;

  const publishMode = mode;
  let batches = 0;
  while (batches < maxBatches && job.publishStatus !== "completed" && job.publishStatus !== "cancelled") {
    job = await processPublishBatch(sellerId, jobId, publishMode);
    if (!job) break;
    batches += 1;
    if (job.publishStatus === "completed") break;
  }

  return job;
}

export async function updateItemCategoryMapping(
  sellerId: string,
  jobId: string,
  itemId: string,
  categorySlug: string,
  platform: string,
  sourceCategory: string,
): Promise<void> {
  const items = await listMigrationItemsEngine(sellerId, jobId);
  const item = items.find((row) => row.id === itemId);
  if (!item?.normalizedData) return;

  const normalized = { ...(item.normalizedData as MigrationNormalizedListing), categorySlug };
  await rememberCategoryMapping(sellerId, platform, sourceCategory, categorySlug);
  await updateMigrationItemEngine(sellerId, itemId, {
    normalized_data: normalized,
    suggested_category_slug: categorySlug,
    validation_status: "valid",
    validation_errors: [],
  });
}

export async function triggerAutoPublishIfEnabled(sellerId: string, jobId: string): Promise<void> {
  const job = await getMigrationJobEngine(sellerId, jobId);
  if (!job?.autoPublish || job.status !== "completed") return;
  await queuePublishJob(sellerId, jobId, "publish_all");
  await runPublishEngine(sellerId, jobId, 3);
}
