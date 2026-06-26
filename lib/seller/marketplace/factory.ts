import "server-only";

import { getUniversalConnector } from "@/lib/seller/migration/connectors/registry";
import { listMarketplaceRegistry } from "@/lib/seller/marketplace/registry";
import { createMarketplaceProvider, type MarketplaceProvider } from "@/lib/seller/marketplace/provider";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

const providerCache = new Map<MigrationPlatformId, MarketplaceProvider>();

export function getMarketplaceProvider(platform: MigrationPlatformId): MarketplaceProvider {
  const cached = providerCache.get(platform);
  if (cached) return cached;

  const connector = getUniversalConnector(platform);
  const provider = createMarketplaceProvider(connector);
  providerCache.set(platform, provider);
  return provider;
}

export function listAllMarketplaceProviders(): MarketplaceProvider[] {
  return listMarketplaceRegistry().map((entry) => getMarketplaceProvider(entry.id));
}
