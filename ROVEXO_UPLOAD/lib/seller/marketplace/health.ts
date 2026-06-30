import "server-only";

import { getConnectorDefinition } from "@/lib/seller/migration/connectors/definitions";
import { verifyConnectorApiHealth } from "@/lib/seller/migration/connectors/health";
import { getUniversalConnector } from "@/lib/seller/migration/connectors/registry";
import { handleMarketplaceError } from "@/lib/seller/marketplace/errors";
import { logMarketplaceEvent } from "@/lib/seller/marketplace/logger";
import {
  getMarketplaceConnectorRecord,
  updateMarketplaceConnectorRecord,
} from "@/lib/seller/marketplace/repository";
import { recordMarketplaceAnalyticsEvent } from "@/lib/seller/marketplace/adapters/analytics";
import type { MarketplaceHealthStatus } from "@/lib/seller/marketplace/types";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

export async function checkMarketplaceHealth(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<MarketplaceHealthStatus> {
  const started = Date.now();
  const record = await getMarketplaceConnectorRecord(sellerId, platform);
  const definition = getConnectorDefinition(platform);
  let health: MarketplaceHealthStatus = "offline";

  try {
    if (!record || record.connectionStatus === "disconnected") {
      health = definition.integrationStatus === "stub" ? "maintenance" : "offline";
    } else if (record.connectionStatus === "error") {
      health = "authentication_expired";
    } else if (record.lastError) {
      health = "warning";
    } else if (definition.integrationStatus === "stub") {
      health = "maintenance";
    } else if (platform === "ebay" || platform === "etsy") {
      await verifyConnectorApiHealth(sellerId, platform);
      await getUniversalConnector(platform).getStatus(sellerId);
      health = "healthy";
    } else {
      await getUniversalConnector(platform).getStatus(sellerId);
      health = "healthy";
    }
  } catch (error) {
    const handled = handleMarketplaceError(platform, error);
    health = handled.retryable ? "rate_limited" : "warning";
  }

  await updateMarketplaceConnectorRecord(sellerId, platform, {
    healthStatus: health,
    lastHealthCheckAt: new Date().toISOString(),
  });

  await recordMarketplaceAnalyticsEvent({
    sellerId,
    platform,
    eventType: "health_check",
    durationMs: Date.now() - started,
    errorCount: health === "healthy" ? 0 : 1,
    metadata: { health },
  });

  logMarketplaceEvent("info", "Health check completed", { sellerId, platform, health });
  return health;
}
