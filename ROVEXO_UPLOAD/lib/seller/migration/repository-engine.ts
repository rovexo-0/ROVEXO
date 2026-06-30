import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/types/database";
import {
  mapMigrationJobRow,
  type MigrationJobRow,
  type QueueItemInput,
} from "@/lib/seller/migration/repository-mappers";
import type {
  MigrationFinalReport,
  MigrationImportReport,
  MigrationJob,
  MigrationJobStats,
  MigrationJobStatus,
  MigrationLiveProgress,
  MigrationPublishProgress,
  PublishJobStatus,
} from "@/lib/seller/migration/types";

export async function getMigrationJobEngine(
  sellerId: string,
  jobId: string,
): Promise<MigrationJob | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("store_migration_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (error || !data) return null;
  return mapMigrationJobRow(data as MigrationJobRow);
}

export async function updateMigrationJobEngine(
  sellerId: string,
  jobId: string,
  patch: Partial<{
    status: MigrationJobStatus;
    progressPercent: number;
    estimatedSeconds: number | null;
    stats: MigrationJobStats;
    progress: MigrationLiveProgress;
    report: MigrationImportReport;
    errorMessage: string | null;
    itemsTotal: number;
    currentBatch: number;
    totalBatches: number;
    startedAt: string;
    completedAt: string | null;
    publishStatus: PublishJobStatus;
    publishProgress: MigrationPublishProgress;
    publishReport: MigrationFinalReport;
    autoPublish: boolean;
    scheduledPublishAt: string | null;
    publishBatch: number;
    publishTotalBatches: number;
  }>,
): Promise<MigrationJob | null> {
  const admin = createAdminClient();
  const update: TablesUpdate<"store_migration_jobs"> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.progressPercent !== undefined) update.progress_percent = patch.progressPercent;
  if (patch.estimatedSeconds !== undefined) update.estimated_seconds = patch.estimatedSeconds;
  if (patch.stats !== undefined) update.stats = patch.stats;
  if (patch.progress !== undefined) update.progress = patch.progress;
  if (patch.report !== undefined) update.report = patch.report;
  if (patch.errorMessage !== undefined) update.error_message = patch.errorMessage;
  if (patch.itemsTotal !== undefined) update.items_total = patch.itemsTotal;
  if (patch.currentBatch !== undefined) update.current_batch = patch.currentBatch;
  if (patch.totalBatches !== undefined) update.total_batches = patch.totalBatches;
  if (patch.startedAt !== undefined) update.started_at = patch.startedAt;
  if (patch.completedAt !== undefined) update.completed_at = patch.completedAt;
  if (patch.publishStatus !== undefined) update.publish_status = patch.publishStatus;
  if (patch.publishProgress !== undefined) update.publish_progress = patch.publishProgress;
  if (patch.publishReport !== undefined) update.publish_report = patch.publishReport;
  if (patch.autoPublish !== undefined) update.auto_publish = patch.autoPublish;
  if (patch.scheduledPublishAt !== undefined) update.scheduled_publish_at = patch.scheduledPublishAt;
  if (patch.publishBatch !== undefined) update.publish_batch = patch.publishBatch;
  if (patch.publishTotalBatches !== undefined) update.publish_total_batches = patch.publishTotalBatches;

  const { data, error } = await admin
    .from("store_migration_jobs")
    .update(update)
    .eq("id", jobId)
    .eq("seller_id", sellerId)
    .select("*")
    .single();

  if (error || !data) return null;
  return mapMigrationJobRow(data as MigrationJobRow);
}

export async function upsertMigrationQueueItemsEngine(
  jobId: string,
  sellerId: string,
  items: QueueItemInput[],
): Promise<void> {
  if (!items.length) return;
  const admin = createAdminClient();
  const rows: TablesInsert<"store_migration_items">[] = items.map((item) => ({
    job_id: jobId,
    seller_id: sellerId,
    batch_index: item.batchIndex,
    item_index: item.itemIndex,
    status: item.status,
    fingerprint: item.fingerprint,
    duplicate_action: item.duplicateAction,
    existing_product_id: item.existingProductId,
    normalized_data: item.normalizedData as TablesInsert<"store_migration_items">["normalized_data"],
    warnings: item.warnings,
  }));

  await admin.from("store_migration_items").upsert(rows, { onConflict: "job_id,item_index" });
}
