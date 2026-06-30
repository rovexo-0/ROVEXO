import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, TablesUpdate } from "@/lib/supabase/types/database";
import { createClient } from "@/lib/supabase/server";
import type { ConnectorConnectionStatus } from "@/lib/seller/migration/connectors/types";
import type {
  MarketplaceHealthStatus,
  MarketplaceSyncStatus,
} from "@/lib/seller/marketplace/types";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

export type MarketplaceConnectorRecord = {
  sellerId: string;
  platform: MigrationPlatformId;
  connectionStatus: ConnectorConnectionStatus;
  enabled: boolean;
  healthStatus: MarketplaceHealthStatus;
  syncStatus: MarketplaceSyncStatus;
  providerVersion: string;
  settings: Record<string, unknown>;
  lastSyncAt: string | null;
  lastHealthCheckAt: string | null;
  lastError: string | null;
};

export async function getMarketplaceConnectorRecord(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<MarketplaceConnectorRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_migration_connectors")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("platform", platform)
    .maybeSingle();

  if (error || !data) return null;

  return mapRow(data);
}

export async function listMarketplaceConnectorRecords(
  sellerId: string,
): Promise<MarketplaceConnectorRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_migration_connectors")
    .select("*")
    .eq("seller_id", sellerId);

  if (error || !data) return [];
  return data.map((row) => mapRow(row));
}

export async function updateMarketplaceConnectorRecord(
  sellerId: string,
  platform: MigrationPlatformId,
  patch: Partial<{
    enabled: boolean;
    healthStatus: MarketplaceHealthStatus;
    syncStatus: MarketplaceSyncStatus;
    lastHealthCheckAt: string;
    lastError: string | null;
    settings: Record<string, unknown>;
  }>,
): Promise<void> {
  const admin = createAdminClient();
  const update: TablesUpdate<"store_migration_connectors"> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.enabled !== undefined) update.enabled = patch.enabled;
  if (patch.healthStatus !== undefined) update.health_status = patch.healthStatus;
  if (patch.syncStatus !== undefined) update.sync_status = patch.syncStatus;
  if (patch.lastHealthCheckAt !== undefined) update.last_health_check_at = patch.lastHealthCheckAt;
  if (patch.lastError !== undefined) update.last_error = patch.lastError;
  if (patch.settings !== undefined) update.settings = patch.settings as Json;

  await admin
    .from("store_migration_connectors")
    .update(update)
    .eq("seller_id", sellerId)
    .eq("platform", platform);
}

function mapRow(row: {
  seller_id: string;
  platform: string;
  connection_status: string;
  enabled?: boolean;
  health_status?: string;
  sync_status?: string;
  provider_version?: string;
  settings: unknown;
  last_sync_at: string | null;
  last_health_check_at?: string | null;
  last_error: string | null;
}): MarketplaceConnectorRecord {
  return {
    sellerId: row.seller_id,
    platform: row.platform as MigrationPlatformId,
    connectionStatus: row.connection_status as ConnectorConnectionStatus,
    enabled: row.enabled ?? true,
    healthStatus: (row.health_status as MarketplaceHealthStatus) ?? "offline",
    syncStatus: (row.sync_status as MarketplaceSyncStatus) ?? "disconnected",
    providerVersion: row.provider_version ?? "1.0.0",
    settings: (row.settings as Record<string, unknown>) ?? {},
    lastSyncAt: row.last_sync_at,
    lastHealthCheckAt: row.last_health_check_at ?? null,
    lastError: row.last_error,
  };
}
