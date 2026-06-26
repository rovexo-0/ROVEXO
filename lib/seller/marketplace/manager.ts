import "server-only";

import { listMarketplaceRegistry } from "@/lib/seller/marketplace/registry";
import { getMarketplaceProvider } from "@/lib/seller/marketplace/factory";
import { getMarketplaceConnectorRecord } from "@/lib/seller/marketplace/repository";
import type {
  MarketplaceManagerSummary,
  MarketplaceProviderView,
} from "@/lib/seller/marketplace/types";

function mapProviderView(
  entry: ReturnType<typeof listMarketplaceRegistry>[number],
  record: Awaited<ReturnType<typeof getMarketplaceConnectorRecord>>,
  health: Awaited<ReturnType<ReturnType<typeof getMarketplaceProvider>["health"]>>,
  syncStatus: Awaited<ReturnType<ReturnType<typeof getMarketplaceProvider>["status"]>>,
): MarketplaceProviderView {
  const connected = record?.connectionStatus === "connected";
  const disabled = record?.enabled === false;

  return {
    ...entry,
    status: disabled ? "disabled" : connected ? "connected" : "disconnected",
    connectionStatus: record?.connectionStatus ?? "disconnected",
    healthStatus: health,
    syncStatus,
    enabled: record?.enabled ?? true,
    lastSyncAt: record?.lastSyncAt ?? null,
    lastHealthCheckAt: record?.lastHealthCheckAt ?? null,
    lastError: record?.lastError ?? null,
    retryAvailable: syncStatus === "retry_available" || syncStatus === "error",
  };
}

export async function getMarketplaceManagerSummary(
  sellerId: string,
): Promise<MarketplaceManagerSummary> {
  const registry = listMarketplaceRegistry();
  const providers = await Promise.all(
    registry.map(async (entry) => {
      const provider = getMarketplaceProvider(entry.id);
      const record = await getMarketplaceConnectorRecord(sellerId, entry.id);
      const [health, syncStatus] = await Promise.all([
        provider.health(sellerId),
        provider.status(sellerId),
      ]);
      return mapProviderView(entry, record, health, syncStatus);
    }),
  );

  return {
    providers,
    totalProviders: providers.length,
    connectedCount: providers.filter((provider) => provider.status === "connected").length,
    healthyCount: providers.filter((provider) => provider.healthStatus === "healthy").length,
    warningCount: providers.filter((provider) => provider.healthStatus === "warning").length,
  };
}

export async function getMarketplaceProviderView(
  sellerId: string,
  platform: import("@/lib/seller/migration/types").MigrationPlatformId,
): Promise<MarketplaceProviderView> {
  const entry = listMarketplaceRegistry().find((item) => item.id === platform);
  if (!entry) throw new Error("Unknown marketplace provider.");

  const provider = getMarketplaceProvider(platform);
  const record = await getMarketplaceConnectorRecord(sellerId, platform);
  const [health, syncStatus] = await Promise.all([
    provider.health(sellerId),
    provider.status(sellerId),
  ]);

  return mapProviderView(entry, record, health, syncStatus);
}
