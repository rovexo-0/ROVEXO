import "server-only";

import { listMigrationJobsForSeller } from "@/lib/seller/migration/repository";
import {
  getMarketplaceConnectorRecord,
  updateMarketplaceConnectorRecord,
} from "@/lib/seller/marketplace/repository";
import type { MarketplaceSyncStatus } from "@/lib/seller/marketplace/types";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

export async function resolveMarketplaceSyncStatus(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<MarketplaceSyncStatus> {
  const record = await getMarketplaceConnectorRecord(sellerId, platform);
  if (!record || record.connectionStatus === "disconnected") {
    return "disconnected";
  }

  const jobs = await listMigrationJobsForSeller(sellerId);
  const active = jobs.find(
    (job) =>
      job.platform === platform &&
      (job.status === "processing" || job.status === "queued"),
  );
  const publishing = jobs.find(
    (job) =>
      job.platform === platform &&
      (job.publishStatus === "publishing" || job.publishStatus === "queued"),
  );

  let status: MarketplaceSyncStatus = record.syncStatus ?? "connected";

  if (publishing) status = "publishing";
  else if (active) status = "importing";
  else if (record.lastError) status = record.lastError.includes("retry") ? "retry_available" : "warning";
  else if (record.connectionStatus === "connected" && record.lastSyncAt) status = "completed";
  else if (record.connectionStatus === "error") status = "error";
  else if (record.connectionStatus === "connected") status = "connected";

  if (status !== record.syncStatus) {
    await updateMarketplaceConnectorRecord(sellerId, platform, { syncStatus: status });
  }

  return status;
}
