import "server-only";

import { getMarketplaceProviderView } from "@/lib/seller/marketplace/manager";
import { loadConnectorCredentials } from "@/lib/seller/migration/connectors/credentials";
import { resolveTokenHealth } from "@/lib/seller/marketplace/oauth/token-manager";
import { OAUTH_PLATFORM_IDS, type OAuthPlatformId } from "@/lib/seller/marketplace/oauth/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MarketplaceHealthStatus } from "@/lib/seller/marketplace/types";

export type OAuthConnectionStatusView = {
  platform: OAuthPlatformId;
  name: string;
  logo: string;
  connected: boolean;
  healthStatus: MarketplaceHealthStatus;
  tokenHealth: ReturnType<typeof resolveTokenHealth>;
  lastSyncAt: string | null;
  lastError: string | null;
  retryAvailable: boolean;
  storeLabel: string | null;
};

export async function getOAuthConnectionsStatus(
  sellerId: string,
): Promise<{ connections: OAuthConnectionStatusView[]; connectedCount: number }> {
  const connections = await Promise.all(
    OAUTH_PLATFORM_IDS.map(async (platform) => {
      const provider = await getMarketplaceProviderView(sellerId, platform);
      const credentials = await loadConnectorCredentials(sellerId, platform);
      const tokenHealth = resolveTokenHealth(credentials);

      return {
        platform,
        name: provider.name,
        logo: provider.logo,
        connected: provider.connectionStatus === "connected",
        healthStatus: provider.healthStatus,
        tokenHealth,
        lastSyncAt: provider.lastSyncAt,
        lastError: provider.lastError,
        retryAvailable: provider.retryAvailable,
        storeLabel: credentials?.storeUrl ?? null,
      };
    }),
  );

  return {
    connections,
    connectedCount: connections.filter((entry) => entry.connected).length,
  };
}

export type OAuthMonitorRow = {
  sellerId: string;
  platform: OAuthPlatformId;
  connectionStatus: string;
  healthStatus: MarketplaceHealthStatus;
  syncStatus: string;
  lastSyncAt: string | null;
  lastError: string | null;
  updatedAt: string;
};

export async function getOAuthMonitorSnapshot(): Promise<{
  connections: OAuthMonitorRow[];
  totals: {
    connected: number;
    failed: number;
    expired: number;
    warning: number;
  };
}> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("store_migration_connectors")
    .select(
      "seller_id, platform, connection_status, health_status, sync_status, last_sync_at, last_error, updated_at",
    )
    .in("platform", [...OAUTH_PLATFORM_IDS]);

  const connections: OAuthMonitorRow[] = (data ?? []).map((row) => ({
    sellerId: row.seller_id,
    platform: row.platform as OAuthPlatformId,
    connectionStatus: row.connection_status,
    healthStatus: row.health_status as MarketplaceHealthStatus,
    syncStatus: row.sync_status,
    lastSyncAt: row.last_sync_at,
    lastError: row.last_error,
    updatedAt: row.updated_at,
  }));

  return {
    connections,
    totals: {
      connected: connections.filter((row) => row.connectionStatus === "connected").length,
      failed: connections.filter((row) => row.connectionStatus === "error").length,
      expired: connections.filter((row) => row.healthStatus === "authentication_expired").length,
      warning: connections.filter((row) => row.healthStatus === "warning").length,
    },
  };
}
