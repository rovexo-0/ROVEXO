import { mapListingCategory } from "@/lib/seller/migration/category/mapper";
import { resolveDuplicates } from "@/lib/seller/migration/duplicate/detector";
import { MIGRATION_BATCH_SIZE } from "@/lib/seller/migration/engine/config";
import {
  countProcessedImages,
  processListingImages,
} from "@/lib/seller/migration/engine/image-processor";
import { normalizeListing } from "@/lib/seller/migration/engine/normalizer";
import type { MigrationBatchResult } from "@/lib/seller/migration/engine/types";
import { getMigrationProvider } from "@/lib/seller/migration/providers/registry";
import { processListingsImageStorage } from "@/lib/seller/migration/images/storage-engine";
import {
  getMigrationJobEngine,
  updateMigrationJobEngine,
  upsertMigrationQueueItemsEngine,
} from "@/lib/seller/migration/repository-engine";
import type {
  DuplicateAction,
  MigrationImportReport,
  MigrationJob,
  MigrationLiveProgress,
} from "@/lib/seller/migration/types";
import { notifyMigrationCompleted, notifyMigrationEvent } from "@/lib/seller/migration/notifications";
import { triggerAutoPublishIfEnabled } from "@/lib/seller/migration/publish/engine";
import { validateMigrationListing } from "@/lib/seller/migration/publish/validator";

function emptyProgress(): MigrationLiveProgress {
  return {
    listingsFound: 0,
    imported: 0,
    images: 0,
    categories: 0,
    publishing: 0,
    speedPerMinute: 0,
    remaining: 0,
    etaSeconds: 0,
    completed: 0,
    currentBatch: 0,
    totalBatches: 0,
  };
}

function emptyReport(): MigrationImportReport {
  return {
    imported: 0,
    published: 0,
    skipped: 0,
    duplicates: 0,
    warnings: 0,
    errors: 0,
    durationSeconds: 0,
    images: 0,
  };
}

function mergeReport(
  current: MigrationImportReport,
  batch: MigrationBatchResult,
  durationSeconds: number,
): MigrationImportReport {
  return {
    imported: current.imported + batch.imported,
    published: current.published + batch.published,
    skipped: current.skipped + batch.skipped,
    duplicates: current.duplicates + batch.duplicates,
    warnings: current.warnings + batch.warnings,
    errors: current.errors + batch.errors,
    images: current.images + batch.images,
    imagesStored: (current.imagesStored ?? 0) + (batch.imagesStored ?? 0),
    imagesFailed: (current.imagesFailed ?? 0) + (batch.imagesFailed ?? 0),
    imagesDownloaded: (current.imagesDownloaded ?? 0) + (batch.imagesDownloaded ?? 0),
    imagesOptimized: (current.imagesOptimized ?? 0) + (batch.imagesOptimized ?? 0),
    durationSeconds,
  };
}

function computeEta(remaining: number, speedPerMinute: number): number {
  if (remaining <= 0) return 0;
  if (speedPerMinute <= 0) return remaining * 2;
  return Math.ceil((remaining / speedPerMinute) * 60);
}

export async function initializeMigrationJob(
  sellerId: string,
  jobId: string,
): Promise<MigrationJob | null> {
  const job = await getMigrationJobEngine(sellerId, jobId);
  if (!job) return null;

  const provider = getMigrationProvider(job.platform);
  const itemsTotal = await provider.estimateTotal({
    sellerId,
    jobId,
    platform: job.platform,
    importMethod: job.importMethod,
    payload: job.input ?? undefined,
  });

  const totalBatches = Math.max(1, Math.ceil(itemsTotal / MIGRATION_BATCH_SIZE));
  const startedAt = new Date().toISOString();

  const updated = await updateMigrationJobEngine(sellerId, jobId, {
    status: "queued",
    progressPercent: 0,
    itemsTotal,
    totalBatches,
    currentBatch: 0,
    startedAt,
    progress: {
      ...emptyProgress(),
      listingsFound: itemsTotal,
      remaining: itemsTotal,
      totalBatches,
    },
    report: emptyReport(),
  });

  if (updated) {
    await notifyMigrationEvent(sellerId, updated, "started");
  }

  return updated;
}

export async function processMigrationBatch(
  sellerId: string,
  jobId: string,
): Promise<MigrationJob | null> {
  const job = await getMigrationJobEngine(sellerId, jobId);
  if (!job) return null;
  if (job.status === "completed" || job.status === "failed") return job;

  const provider = getMigrationProvider(job.platform);
  const batchIndex = job.currentBatch;
  const offset = batchIndex * MIGRATION_BATCH_SIZE;
  const duplicatePolicy: DuplicateAction = job.duplicatePolicy ?? "skip";

  if (batchIndex === 0) {
    await notifyMigrationEvent(sellerId, job, "processing");
  }

  await updateMigrationJobEngine(sellerId, jobId, {
    status: "processing",
    progressPercent: job.totalBatches
      ? Math.min(99, Math.round((batchIndex / job.totalBatches) * 100))
      : 0,
  });

  const connectorInput = {
    sellerId,
    jobId,
    platform: job.platform,
    importMethod: job.importMethod,
    payload: job.input ?? undefined,
    offset,
    limit: MIGRATION_BATCH_SIZE,
  };

  await provider.connect(connectorInput);
  const rawListings = await provider.fetchListings(connectorInput);

  const normalized = rawListings.map(normalizeListing);
  const withCategories = await Promise.all(
    normalized.map((item) => mapListingCategory(item, sellerId, job.platform)),
  );
  const withImageUrls = withCategories.map(processListingImages);
  const { listings: withImages, stats: imageStats } = await processListingsImageStorage(
    withImageUrls,
    sellerId,
    jobId,
  );
  const duplicateResolutions = await resolveDuplicates(sellerId, withImages, duplicatePolicy);

  let imported = 0;
  let skipped = 0;
  let duplicates = 0;
  let warnings = 0;
  let errors = 0;
  let published = 0;

  const queueRows = duplicateResolutions.flatMap((resolution, itemIndex) => {
    const { listing, isDuplicate, action, existingProductId } = resolution;
    const validation = validateMigrationListing(listing);

    if (validation.status === "invalid") {
      errors += 1;
      skipped += 1;
      return [];
    }

    if (listing.warnings.length) warnings += listing.warnings.length;
    if (validation.status === "warning") warnings += validation.errors.length;

    if (isDuplicate && action === "skip") {
      skipped += 1;
      duplicates += 1;
    } else if (isDuplicate && action !== "create_new") {
      duplicates += 1;
      imported += 1;
      published += action === "replace" || action === "update" ? 1 : 0;
    } else {
      imported += 1;
      published += 1;
    }

    return [
      {
        batchIndex,
        itemIndex: offset + itemIndex,
        status: isDuplicate && action === "skip" ? "skipped" : "imported",
        fingerprint: listing.fingerprint,
        duplicateAction: action,
        existingProductId: existingProductId ?? null,
        normalizedData: listing,
        warnings: [
          ...listing.warnings,
          ...validation.errors.map((issue) => issue.message),
        ],
      },
    ];
  });

  await upsertMigrationQueueItemsEngine(jobId, sellerId, queueRows);

  const batchResult: MigrationBatchResult = {
    processed: rawListings.length,
    imported,
    skipped,
    duplicates,
    warnings,
    errors,
    images: countProcessedImages(withImages),
    published,
    imagesStored: imageStats.stored,
    imagesFailed: imageStats.failed,
    imagesDownloaded: imageStats.downloaded,
    imagesOptimized: imageStats.optimized,
  };

  const nextBatch = batchIndex + 1;
  const isComplete = nextBatch >= job.totalBatches || rawListings.length === 0;
  const startedMs = job.startedAt ? new Date(job.startedAt).getTime() : Date.now();
  const durationSeconds = Math.round((Date.now() - startedMs) / 1000);
  const processedSoFar = Math.min(job.itemsTotal, offset + rawListings.length);
  const remaining = Math.max(0, job.itemsTotal - processedSoFar);
  const speedPerMinute =
    durationSeconds > 0 ? Math.round((processedSoFar / durationSeconds) * 60) : processedSoFar;

  const report = mergeReport(job.report ?? emptyReport(), batchResult, durationSeconds);
  const progress: MigrationLiveProgress = {
    listingsFound: job.itemsTotal,
    imported: report.imported,
    images: report.images,
    categories: withCategories.filter((l) => l.categorySlug).length + (job.progress?.categories ?? 0),
    publishing: report.published,
    speedPerMinute,
    remaining,
    etaSeconds: computeEta(remaining, speedPerMinute),
    completed: processedSoFar,
    currentBatch: nextBatch,
    totalBatches: job.totalBatches,
    imagesDownloaded: report.imagesDownloaded,
    imagesStored: report.imagesStored,
    imagesOptimized: report.imagesOptimized,
    imagesRemaining: Math.max(0, report.images - (report.imagesStored ?? 0)),
  };

  const legacyStats = {
    imported: report.imported,
    ready: report.imported - report.warnings,
    warnings: report.warnings,
    completed: report.published,
  };

  const updated = await updateMigrationJobEngine(sellerId, jobId, {
    status: isComplete ? "completed" : "processing",
    progressPercent: isComplete ? 100 : Math.round((processedSoFar / Math.max(job.itemsTotal, 1)) * 100),
    estimatedSeconds: progress.etaSeconds,
    currentBatch: nextBatch,
    stats: legacyStats,
    progress,
    report,
    completedAt: isComplete ? new Date().toISOString() : null,
  });

  if (isComplete && updated) {
    if (job.notifyOnComplete !== false) {
      await notifyMigrationCompleted(sellerId, updated);
    }
    await triggerAutoPublishIfEnabled(sellerId, jobId);
  }

  return updated;
}

export async function runMigrationEngine(
  sellerId: string,
  jobId: string,
  maxBatches = 5,
): Promise<MigrationJob | null> {
  let job = await getMigrationJobEngine(sellerId, jobId);
  if (!job) return null;

  if (job.status === "draft") {
    job = await initializeMigrationJob(sellerId, jobId);
  }

  if (!job || job.status === "completed" || job.status === "failed") {
    return job;
  }

  let batchesRun = 0;
  while (batchesRun < maxBatches && job.status !== "completed" && job.status !== "failed") {
    job = await processMigrationBatch(sellerId, jobId);
    if (!job) break;
    batchesRun += 1;
    if (job.currentBatch >= job.totalBatches) break;
  }

  return job;
}

/** @deprecated Use runMigrationEngine — kept for backward compatibility. */
export async function runMigrationJobStub(
  sellerId: string,
  jobId: string,
): Promise<MigrationJob | null> {
  return runMigrationEngine(sellerId, jobId, 999);
}
