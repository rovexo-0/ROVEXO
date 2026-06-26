import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/types/database";
import {
  mapMigrationJobRow,
  type MigrationJobRow,
  type QueueItemInput,
} from "@/lib/seller/migration/repository-mappers";
import type {
  CreateMigrationJobInput,
  MigrationImportReport,
  MigrationJob,
  MigrationJobStats,
  MigrationJobStatus,
  MigrationLiveProgress,
} from "@/lib/seller/migration/types";

const EMPTY_STATS: MigrationJobStats = {
  imported: 0,
  ready: 0,
  warnings: 0,
  completed: 0,
};

export type { QueueItemInput };

export async function createMigrationJob(input: CreateMigrationJobInput): Promise<MigrationJob | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_migration_jobs")
    .insert({
      seller_id: input.sellerId,
      platform: input.platform,
      import_method: input.importMethod,
      status: "draft",
      progress_percent: 0,
      stats: EMPTY_STATS,
      duplicate_policy: input.duplicatePolicy ?? "skip",
      input_payload: input.input ?? null,
      notify_on_complete: input.notifyOnComplete ?? true,
      auto_publish: input.autoPublish ?? false,
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return mapMigrationJobRow(data as MigrationJobRow);
}

export async function getMigrationJobForSeller(
  sellerId: string,
  jobId: string,
): Promise<MigrationJob | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_migration_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (error || !data) return null;
  return mapMigrationJobRow(data as MigrationJobRow);
}

export async function listMigrationJobsForSeller(sellerId: string): Promise<MigrationJob[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_migration_jobs")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data.map((row) => mapMigrationJobRow(row as MigrationJobRow));
}

export async function listActivePublishJobs(): Promise<MigrationJob[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("store_migration_jobs")
    .select("*")
    .eq("status", "completed")
    .in("publish_status", ["queued", "publishing"])
    .order("updated_at", { ascending: true })
    .limit(20);

  if (error || !data) return [];
  return data.map((row) => mapMigrationJobRow(row as MigrationJobRow));
}

export async function listActiveMigrationJobs(): Promise<MigrationJob[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("store_migration_jobs")
    .select("*")
    .in("status", ["queued", "processing"])
    .order("updated_at", { ascending: true })
    .limit(20);

  if (error || !data) return [];
  return data.map((row) => mapMigrationJobRow(row as MigrationJobRow));
}

export async function updateMigrationJobForSeller(
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
  }>,
): Promise<MigrationJob | null> {
  const supabase = await createClient();
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

  const { data, error } = await supabase
    .from("store_migration_jobs")
    .update(update)
    .eq("id", jobId)
    .eq("seller_id", sellerId)
    .select("*")
    .single();

  if (error || !data) return null;
  return mapMigrationJobRow(data as MigrationJobRow);
}

export async function upsertMigrationQueueItems(
  jobId: string,
  sellerId: string,
  items: QueueItemInput[],
): Promise<void> {
  if (!items.length) return;
  const supabase = await createClient();
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

  await supabase.from("store_migration_items").upsert(rows, { onConflict: "job_id,item_index" });
}
