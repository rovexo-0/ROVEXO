import type { Tables } from "@/lib/supabase/types/database";
import type {
  DuplicateAction,
  MigrationFinalReport,
  MigrationImportReport,
  MigrationInputPayload,
  MigrationJob,
  MigrationJobStats,
  MigrationJobStatus,
  MigrationLiveProgress,
  MigrationPublishProgress,
  MigrationImportMethodId,
  MigrationPlatformId,
  PublishJobStatus,
} from "@/lib/seller/migration/types";

export type MigrationJobRow = Tables<"store_migration_jobs">;

export type QueueItemInput = {
  batchIndex: number;
  itemIndex: number;
  status: string;
  fingerprint: string;
  duplicateAction: string;
  existingProductId: string | null;
  normalizedData: unknown;
  warnings: string[];
};

const EMPTY_STATS: MigrationJobStats = {
  imported: 0,
  ready: 0,
  warnings: 0,
  completed: 0,
};

function parseStats(value: MigrationJobRow["stats"]): MigrationJobStats {
  if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY_STATS;
  const record = value as Record<string, unknown>;
  return {
    imported: Number(record.imported ?? 0),
    ready: Number(record.ready ?? 0),
    warnings: Number(record.warnings ?? 0),
    completed: Number(record.completed ?? 0),
  };
}

function parseProgress(value: MigrationJobRow["progress"]): MigrationLiveProgress | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const r = value as Record<string, unknown>;
  return {
    listingsFound: Number(r.listingsFound ?? 0),
    imported: Number(r.imported ?? 0),
    images: Number(r.images ?? 0),
    categories: Number(r.categories ?? 0),
    publishing: Number(r.publishing ?? 0),
    speedPerMinute: Number(r.speedPerMinute ?? 0),
    remaining: Number(r.remaining ?? 0),
    etaSeconds: Number(r.etaSeconds ?? 0),
    completed: Number(r.completed ?? 0),
    currentBatch: Number(r.currentBatch ?? 0),
    totalBatches: Number(r.totalBatches ?? 0),
  };
}

function parseReport(value: MigrationJobRow["report"]): MigrationImportReport | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const r = value as Record<string, unknown>;
  return {
    imported: Number(r.imported ?? 0),
    published: Number(r.published ?? 0),
    skipped: Number(r.skipped ?? 0),
    duplicates: Number(r.duplicates ?? 0),
    warnings: Number(r.warnings ?? 0),
    errors: Number(r.errors ?? 0),
    durationSeconds: Number(r.durationSeconds ?? 0),
    images: Number(r.images ?? 0),
  };
}

function parsePublishProgress(value: MigrationJobRow["publish_progress"]): MigrationPublishProgress | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const r = value as Record<string, unknown>;
  return {
    listingsFound: Number(r.listingsFound ?? 0),
    imported: Number(r.imported ?? 0),
    validated: Number(r.validated ?? 0),
    imagesProcessed: Number(r.imagesProcessed ?? 0),
    categoriesMapped: Number(r.categoriesMapped ?? 0),
    publishing: Number(r.publishing ?? 0),
    published: Number(r.published ?? 0),
    skipped: Number(r.skipped ?? 0),
    warnings: Number(r.warnings ?? 0),
    errors: Number(r.errors ?? 0),
    speedPerMinute: Number(r.speedPerMinute ?? 0),
    remaining: Number(r.remaining ?? 0),
    etaSeconds: Number(r.etaSeconds ?? 0),
    progressPercent: Number(r.progressPercent ?? 0),
    currentBatch: Number(r.currentBatch ?? 0),
    totalBatches: Number(r.totalBatches ?? 0),
  };
}

function parsePublishReport(value: MigrationJobRow["publish_report"]): MigrationFinalReport | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const r = value as Record<string, unknown>;
  return {
    imported: Number(r.imported ?? 0),
    published: Number(r.published ?? 0),
    drafts: Number(r.drafts ?? 0),
    skipped: Number(r.skipped ?? 0),
    duplicates: Number(r.duplicates ?? 0),
    warnings: Number(r.warnings ?? 0),
    errors: Number(r.errors ?? 0),
    images: Number(r.images ?? 0),
    categories: Number(r.categories ?? 0),
    durationSeconds: Number(r.durationSeconds ?? 0),
    processingTimeSeconds: Number(r.processingTimeSeconds ?? r.durationSeconds ?? 0),
    successRate: Number(r.successRate ?? 0),
  };
}

function parseInput(value: MigrationJobRow["input_payload"]): MigrationInputPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as MigrationInputPayload;
}

export function mapMigrationJobRow(row: MigrationJobRow): MigrationJob {
  return {
    id: row.id,
    sellerId: row.seller_id,
    platform: row.platform as MigrationPlatformId,
    importMethod: row.import_method as MigrationImportMethodId,
    status: row.status as MigrationJobStatus,
    progressPercent: row.progress_percent,
    estimatedSeconds: row.estimated_seconds,
    stats: parseStats(row.stats),
    progress: parseProgress(row.progress),
    report: parseReport(row.report),
    duplicatePolicy: (row.duplicate_policy as DuplicateAction) ?? "skip",
    input: parseInput(row.input_payload),
    itemsTotal: row.items_total ?? 0,
    currentBatch: row.current_batch ?? 0,
    totalBatches: row.total_batches ?? 0,
    notifyOnComplete: row.notify_on_complete ?? true,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishStatus: (row.publish_status as PublishJobStatus) ?? "idle",
    publishProgress: parsePublishProgress(row.publish_progress),
    publishReport: parsePublishReport(row.publish_report),
    autoPublish: row.auto_publish ?? false,
    scheduledPublishAt: row.scheduled_publish_at,
    publishBatch: row.publish_batch ?? 0,
    publishTotalBatches: row.publish_total_batches ?? 0,
  };
}
