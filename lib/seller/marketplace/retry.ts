import "server-only";

import { loadConnectorCredentials } from "@/lib/seller/migration/connectors/credentials";
import { connectMarketplaceCredentials } from "@/lib/seller/marketplace/credentials";
import { handleMarketplaceError } from "@/lib/seller/marketplace/errors";
import { checkMarketplaceHealth } from "@/lib/seller/marketplace/health";
import { recordMarketplaceAnalyticsEvent } from "@/lib/seller/marketplace/adapters/analytics";
import { updateMarketplaceConnectorRecord } from "@/lib/seller/marketplace/repository";
import type { MarketplaceHealthStatus } from "@/lib/seller/marketplace/types";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

const MAX_ATTEMPTS = 3;

export async function retryMarketplaceConnection(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<MarketplaceHealthStatus> {
  const started = Date.now();
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const credentials = await loadConnectorCredentials(sellerId, platform);
      if (!credentials) {
        throw new Error("No saved credentials to retry.");
      }

      await connectMarketplaceCredentials({
        sellerId,
        platform,
        storeUrl: credentials.storeUrl,
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret,
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        fileName: credentials.fileName,
      });

      const health = await checkMarketplaceHealth(sellerId, platform);
      await recordMarketplaceAnalyticsEvent({
        sellerId,
        platform,
        eventType: "retry_success",
        durationMs: Date.now() - started,
        metadata: { attempt },
      });
      return health;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }

  const handled = handleMarketplaceError(platform, lastError);
  await updateMarketplaceConnectorRecord(sellerId, platform, {
    syncStatus: "retry_available",
    healthStatus: "warning",
    lastError: handled.message,
  });

  await recordMarketplaceAnalyticsEvent({
    sellerId,
    platform,
    eventType: "retry_failed",
    durationMs: Date.now() - started,
    errorCount: 1,
  });

  return "warning";
}
