import "server-only";

import {
  disconnectConnector,
  getConnectorRecord,
  loadConnectorCredentials,
} from "@/lib/seller/migration/connectors/credentials";
import type { ConnectorConnectInput } from "@/lib/seller/migration/connectors/types";
import { getUniversalConnector } from "@/lib/seller/migration/connectors/registry";
import { updateMarketplaceConnectorRecord } from "@/lib/seller/marketplace/repository";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

export async function connectMarketplaceCredentials(
  input: ConnectorConnectInput,
): Promise<void> {
  await getUniversalConnector(input.platform).connect(input);
  await updateMarketplaceConnectorRecord(input.sellerId, input.platform, {
    enabled: true,
    syncStatus: "connected",
    healthStatus: "healthy",
    lastHealthCheckAt: new Date().toISOString(),
    lastError: null,
  });
}

export async function deleteMarketplaceCredentials(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<void> {
  await disconnectConnector(sellerId, platform);
  await updateMarketplaceConnectorRecord(sellerId, platform, {
    syncStatus: "disconnected",
    healthStatus: "offline",
    lastError: null,
  });
}

export async function hasMarketplaceCredentials(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<boolean> {
  const credentials = await loadConnectorCredentials(sellerId, platform);
  return Boolean(credentials);
}

export async function getMarketplaceCredentialMeta(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<{ connected: boolean; storeUrl?: string }> {
  const record = await getConnectorRecord(sellerId, platform);
  const credentials = await loadConnectorCredentials(sellerId, platform);
  return {
    connected: record?.connectionStatus === "connected",
    storeUrl: credentials?.storeUrl,
  };
}
