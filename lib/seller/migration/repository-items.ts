import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesUpdate } from "@/lib/supabase/types/database";
import type { MigrationNormalizedListing } from "@/lib/seller/migration/engine/types";
import type {
  DuplicateAction,
  MigrationQueueItem,
  PublishItemStatus,
  ValidationIssue,
  ValidationStatus,
} from "@/lib/seller/migration/types";

type MigrationItemRow = Tables<"store_migration_items">;

function parseNormalized(value: MigrationItemRow["normalized_data"]): MigrationNormalizedListing | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as MigrationNormalizedListing;
}

function parseValidationErrors(value: MigrationItemRow["validation_errors"]): ValidationIssue[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === "object") as ValidationIssue[];
}

export function mapMigrationItemRow(row: MigrationItemRow): MigrationQueueItem {
  const normalized = parseNormalized(row.normalized_data);
  return {
    id: row.id,
    jobId: row.job_id,
    sellerId: row.seller_id,
    batchIndex: row.batch_index,
    itemIndex: row.item_index,
    status: row.status,
    fingerprint: row.fingerprint,
    duplicateAction: (row.duplicate_action as DuplicateAction) ?? null,
    existingProductId: row.existing_product_id,
    productId: row.product_id,
    validationStatus: (row.validation_status as ValidationStatus) ?? "pending",
    validationErrors: parseValidationErrors(row.validation_errors),
    suggestedCategorySlug: row.suggested_category_slug,
    publishStatus: (row.publish_status as PublishItemStatus) ?? "pending",
    selected: row.selected ?? true,
    warnings: Array.isArray(row.warnings) ? (row.warnings as string[]) : [],
    normalizedData: (row.normalized_data as Record<string, unknown>) ?? null,
    title: normalized?.title ?? "Imported item",
    price: normalized?.price ?? 0,
  };
}

export async function listMigrationItemsForJob(
  sellerId: string,
  jobId: string,
): Promise<MigrationQueueItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_migration_items")
    .select("*")
    .eq("job_id", jobId)
    .eq("seller_id", sellerId)
    .order("item_index", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => mapMigrationItemRow(row as MigrationItemRow));
}

export async function listMigrationItemsEngine(
  sellerId: string,
  jobId: string,
  filter?: { publishStatus?: PublishItemStatus[]; selectedOnly?: boolean },
): Promise<MigrationQueueItem[]> {
  const admin = createAdminClient();
  let query = admin
    .from("store_migration_items")
    .select("*")
    .eq("job_id", jobId)
    .eq("seller_id", sellerId)
    .order("item_index", { ascending: true });

  if (filter?.publishStatus?.length) {
    query = query.in("publish_status", filter.publishStatus);
  }
  if (filter?.selectedOnly) {
    query = query.eq("selected", true);
  }

  const { data, error } = await query.limit(500);
  if (error || !data) return [];
  return data.map((row) => mapMigrationItemRow(row as MigrationItemRow));
}

export async function updateMigrationItemForSeller(
  sellerId: string,
  itemId: string,
  patch: TablesUpdate<"store_migration_items">,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("store_migration_items")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("seller_id", sellerId);
}

export async function updateMigrationItemEngine(
  sellerId: string,
  itemId: string,
  patch: TablesUpdate<"store_migration_items">,
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("store_migration_items")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("seller_id", sellerId);
}

export async function updateMigrationItemsBulkEngine(
  sellerId: string,
  jobId: string,
  patch: TablesUpdate<"store_migration_items">,
  filter?: { publishStatus?: PublishItemStatus[] },
): Promise<void> {
  const admin = createAdminClient();
  let query = admin
    .from("store_migration_items")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("job_id", jobId)
    .eq("seller_id", sellerId);

  if (filter?.publishStatus?.length) {
    query = query.in("publish_status", filter.publishStatus);
  }

  await query;
}

export async function countMigrationItemsByPublishStatus(
  sellerId: string,
  jobId: string,
): Promise<Record<string, number>> {
  const items = await listMigrationItemsEngine(sellerId, jobId);
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.publishStatus] = (counts[item.publishStatus] ?? 0) + 1;
  }
  return counts;
}
